const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.static(path.join(__dirname, 'public')));

// ─── Génération des dominos ───────────────────────────────────────────────────
function createDominoSet() {
  const pieces = [];
  for (let i = 0; i <= 6; i++)
    for (let j = i; j <= 6; j++)
      pieces.push([i, j]);
  return pieces;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── Stockage des salles ──────────────────────────────────────────────────────
const rooms = {};

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function calcPoints(hand) {
  return hand.reduce((sum, d) => sum + d[0] + d[1], 0);
}

// ─── Logique de jeu ───────────────────────────────────────────────────────────
function dealCards(room) {
  const pieces = shuffle(createDominoSet());
  const n = room.players.length;
  room.hands = {};
  room.players.forEach((p, i) => {
    room.hands[p.id] = pieces.slice(i * 7, i * 7 + 7);
  });
  // Pioche pour mode 2 joueurs
  room.pioche = n === 2 ? pieces.slice(14) : [];
  room.board = [];
  room.boardEnds = null; // { left, right }
  room.passCount = 0;
}

function findStartingPlayer(room) {
  // Premier manche : celui qui a [6,6]
  for (const [pid, hand] of Object.entries(room.hands)) {
    if (hand.some(d => d[0] === 6 && d[1] === 6)) return pid;
  }
  return room.players[0].id;
}

function canPlay(hand, ends) {
  if (!ends) return true;
  return hand.some(d => d[0] === ends.left || d[1] === ends.left || d[0] === ends.right || d[1] === ends.right);
}

function isBlocked(room) {
  return room.players.every(p => !canPlay(room.hands[p.id], room.boardEnds));
}

function getTeamPoints(room, teamIndex) {
  return room.players
    .filter(p => p.team === teamIndex)
    .reduce((sum, p) => sum + calcPoints(room.hands[p.id]), 0);
}

function endManche(room, winnerId) {
  let points = 0;
  let winTeam;

  if (winnerId === 'blocked') {
    const t0 = getTeamPoints(room, 0);
    const t1 = getTeamPoints(room, 1);
    if (t0 < t1) {
      winTeam = 0;
      points = t1;
    } else if (t1 < t0) {
      winTeam = 1;
      points = t0;
    } else {
      // Égalité : personne ne marque
      winTeam = -1;
      points = 0;
    }
  } else {
    const winner = room.players.find(p => p.id === winnerId);
    winTeam = winner.team;
    // Points = somme des pièces restantes de l'équipe adverse
    const advTeam = winTeam === 0 ? 1 : 0;
    points = getTeamPoints(room, advTeam);
  }

  if (winTeam >= 0) {
    room.scores[winTeam] = (room.scores[winTeam] || 0) + points;
  }

  room.lastMancheWinner = winnerId === 'blocked' ? (winTeam >= 0 ? room.players.find(p => p.team === winTeam)?.id : room.currentTurn) : winnerId;

  io.to(room.code).emit('manche_end', {
    winTeam,
    points,
    scores: room.scores,
    hands: room.hands
  });

  // Vérifier fin de partie
  if (room.scores[0] >= 100 || room.scores[1] >= 100) {
    const gameWinner = room.scores[0] >= 100 ? 0 : 1;
    io.to(room.code).emit('game_over', { winTeam: gameWinner, scores: room.scores });
    room.status = 'finished';
  } else {
    // Attendre 4 secondes puis relancer
    setTimeout(() => startManche(room), 4000);
  }
}

function startManche(room) {
  dealCards(room);
  const startId = room.lastMancheWinner || findStartingPlayer(room);
  room.currentTurn = startId;
  room.firstMove = true;
  room.status = 'playing';

  room.players.forEach(p => {
    io.to(p.id).emit('manche_start', {
      hand: room.hands[p.id],
      currentTurn: room.currentTurn,
      scores: room.scores,
      board: room.board,
      boardEnds: room.boardEnds,
      firstMove: room.firstMove
    });
  });
}

function nextTurn(room) {
  const idx = room.players.findIndex(p => p.id === room.currentTurn);
  room.currentTurn = room.players[(idx + 1) % room.players.length].id;
}

// ─── Socket.IO ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {

  // Créer une salle
  socket.on('create_room', ({ name, maxPlayers }) => {
    const code = generateCode();
    rooms[code] = {
      code,
      maxPlayers: parseInt(maxPlayers),
      players: [],
      hands: {},
      board: [],
      boardEnds: null,
      scores: { 0: 0, 1: 0 },
      status: 'waiting',
      currentTurn: null,
      pioche: [],
      passCount: 0,
      firstMove: true,
      lastMancheWinner: null
    };

    const team = 0;
    const player = { id: socket.id, name, team };
    rooms[code].players.push(player);
    socket.join(code);
    socket.roomCode = code;

    socket.emit('room_created', { code, player, players: rooms[code].players });
  });

  // Rejoindre une salle
  socket.on('join_room', ({ name, code }) => {
    const room = rooms[code.toUpperCase()];
    if (!room) return socket.emit('error', { msg: 'Salle introuvable' });
    if (room.status !== 'waiting') return socket.emit('error', { msg: 'Partie déjà commencée' });
    if (room.players.length >= room.maxPlayers) return socket.emit('error', { msg: 'Salle pleine' });

    // Attribution des équipes
    // Mode 2j : 0, 1
    // Mode 4j : positions 0,2 → équipe 0 | positions 1,3 → équipe 1
    const pos = room.players.length;
    const team = room.maxPlayers === 4 ? (pos % 2) : pos;

    const player = { id: socket.id, name, team };
    room.players.push(player);
    socket.join(code.toUpperCase());
    socket.roomCode = code.toUpperCase();

    io.to(code.toUpperCase()).emit('player_joined', { players: room.players });
    socket.emit('room_joined', { code: code.toUpperCase(), player, players: room.players });

    // Démarrer si salle pleine
    if (room.players.length === room.maxPlayers) {
      setTimeout(() => startManche(room), 1000);
    }
  });

  // Jouer une pièce
  socket.on('play_piece', ({ code, piece, side }) => {
    const room = rooms[code];
    if (!room || room.currentTurn !== socket.id) return;

    const hand = room.hands[socket.id];
    const pieceIdx = hand.findIndex(d =>
      (d[0] === piece[0] && d[1] === piece[1]) ||
      (d[0] === piece[1] && d[1] === piece[0])
    );
    if (pieceIdx === -1) return;

    let played = [...hand[pieceIdx]];

    if (!room.boardEnds) {
      // Premier coup
      room.board.push({ piece: played, side: 'center' });
      room.boardEnds = { left: played[0], right: played[1] };
    } else {
      if (side === 'left') {
        if (played[1] === room.boardEnds.left) {
          room.board.unshift({ piece: played, side: 'left' });
          room.boardEnds.left = played[0];
        } else if (played[0] === room.boardEnds.left) {
          played = [played[1], played[0]];
          room.board.unshift({ piece: played, side: 'left' });
          room.boardEnds.left = played[0];
        } else return;
      } else {
        if (played[0] === room.boardEnds.right) {
          room.board.push({ piece: played, side: 'right' });
          room.boardEnds.right = played[1];
        } else if (played[1] === room.boardEnds.right) {
          played = [played[1], played[0]];
          room.board.push({ piece: played, side: 'right' });
          room.boardEnds.right = played[1];
        } else return;
      }
    }

    // Retirer du main
    room.hands[socket.id].splice(pieceIdx, 1);
    room.firstMove = false;
    room.passCount = 0;

    io.to(code).emit('piece_played', {
      playerId: socket.id,
      piece: played,
      side,
      board: room.board,
      boardEnds: room.boardEnds,
      handCounts: Object.fromEntries(room.players.map(p => [p.id, room.hands[p.id].length]))
    });

    // Envoyer la main mise à jour au joueur
    socket.emit('hand_update', { hand: room.hands[socket.id] });

    // Vérifier fin de manche
    if (room.hands[socket.id].length === 0) {
      endManche(room, socket.id);
      return;
    }

    nextTurn(room);

    // Vérifier blocage
    if (isBlocked(room)) {
      endManche(room, 'blocked');
      return;
    }

    // Skip les joueurs qui ne peuvent pas jouer
    let skipped = [];
    while (!canPlay(room.hands[room.currentTurn], room.boardEnds)) {
      skipped.push(room.currentTurn);
      io.to(room.currentTurn).emit('forced_pass', {});
      nextTurn(room);
      if (skipped.length >= room.players.length) {
        endManche(room, 'blocked');
        return;
      }
    }

    io.to(code).emit('turn_change', {
      currentTurn: room.currentTurn,
      skipped
    });
  });

  // Piocher (mode 2 joueurs)
  socket.on('draw_piece', ({ code }) => {
    const room = rooms[code];
    if (!room || room.currentTurn !== socket.id) return;
    if (room.pioche.length === 0) return;

    const piece = room.pioche.pop();
    room.hands[socket.id].push(piece);

    socket.emit('piece_drawn', { piece, hand: room.hands[socket.id] });
    io.to(code).emit('draw_happened', {
      playerId: socket.id,
      handCounts: Object.fromEntries(room.players.map(p => [p.id, room.hands[p.id].length])),
      pioireLeft: room.pioche.length
    });

    const canNowPlay = canPlay(room.hands[socket.id], room.boardEnds);

    if (canNowPlay) {
      // Peut jouer maintenant -> garder le tour et notifier
      io.to(code).emit('turn_change', { currentTurn: room.currentTurn, skipped: [] });
    } else if (room.pioche.length === 0) {
      // Pioche vide et ne peut pas jouer -> passer le tour
      nextTurn(room);
      io.to(code).emit('turn_change', { currentTurn: room.currentTurn, skipped: [socket.id] });
    }
    // Sinon : pioche non vide, ne peut pas jouer -> continuer a piocher
  });

  // Déconnexion
  socket.on('disconnect', () => {
    const code = socket.roomCode;
    if (!code || !rooms[code]) return;
    const room = rooms[code];
    room.players = room.players.filter(p => p.id !== socket.id);
    if (room.players.length === 0) {
      delete rooms[code];
    } else {
      io.to(code).emit('player_left', {
        players: room.players,
        msg: `Un joueur a quitté la partie`
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎮 Domino Bloqué - Serveur lancé sur le port ${PORT}`);
  console.log(`📱 Ouvrez votre navigateur sur : http://localhost:${PORT}\n`);
});
