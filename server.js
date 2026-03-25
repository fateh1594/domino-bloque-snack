const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));

// ─── Dominos ──────────────────────────────────────────────────────────────────
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

// ─── Salles ───────────────────────────────────────────────────────────────────
const rooms = {};

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function calcPoints(hand) {
  return hand.reduce((sum, d) => sum + d[0] + d[1], 0);
}

// ─── Distribution ─────────────────────────────────────────────────────────────
function dealCards(room) {
  const pieces = shuffle(createDominoSet());
  const n = room.players.length;
  room.hands = {};
  room.players.forEach((p, i) => {
    room.hands[p.id] = pieces.slice(i * 7, i * 7 + 7);
  });
  room.pioche = n === 2 ? pieces.slice(14) : [];
  room.board = [];
  room.boardEnds = null;
  room.layout = null;
}

// ─── Calcul position/rotation domino sur plateau ✅ CORRIGÉ ───────────────────
const DOMINO_W = 80;
const DOMINO_H = 40;
const SPACING = 3;
const BOARD_W = 1000;
const BOARD_H = 600;
const MARGIN = 50;

function initLayout() {
  const centerX = Math.floor((BOARD_W - DOMINO_W) / 2);
  const centerY = Math.floor((BOARD_H - DOMINO_H) / 2);
  
  return {
    firstX: centerX,
    firstY: centerY,
    firstUsed: false,
    nextRightX: centerX + DOMINO_W + SPACING,
    nextRightY: centerY,
    nextLeftX: centerX - DOMINO_W - SPACING,
    nextLeftY: centerY,
    rightDirection: 'right',
    leftDirection: 'left',
    rightBoundary: BOARD_W - MARGIN,
    leftBoundary: MARGIN,
    topBoundary: MARGIN,
    bottomBoundary: BOARD_H - MARGIN,
  };
}

function getNextPosition(layout, side, isDouble = false) {
  let x, y, rotation = 0;
  
  if (side === 'center' || (!layout.firstUsed && side === 'right')) {
    x = layout.firstX;
    y = layout.firstY;
    rotation = isDouble ? 90 : 0;
    layout.firstUsed = true;
    return { x, y, rotation };
  }
  
  if (side === 'right') {
    x = layout.nextRightX;
    y = layout.nextRightY;
    
    switch (layout.rightDirection) {
      case 'right':
        rotation = isDouble ? 90 : 0;
        if (x + DOMINO_W > layout.rightBoundary) {
          rotation = 90;
          layout.nextRightX = x;
          layout.nextRightY = y + DOMINO_W + SPACING;
          layout.rightDirection = 'down';
        } else {
          layout.nextRightX = x + DOMINO_W + SPACING;
        }
        break;
        
      case 'down':
        rotation = 90;
        layout.nextRightY = y + DOMINO_W + SPACING;
        break;
        
      case 'left':
        rotation = 0;
        layout.nextRightX = x - DOMINO_W - SPACING;
        break;
    }
  } else if (side === 'left') {
    x = layout.nextLeftX;
    y = layout.nextLeftY;
    
    switch (layout.leftDirection) {
      case 'left':
        rotation = isDouble ? 90 : 0;
        if (x < layout.leftBoundary) {
          rotation = 90;
          layout.nextLeftX = x;
          layout.nextLeftY = y + DOMINO_W + SPACING;
          layout.leftDirection = 'down';
        } else {
          layout.nextLeftX = x - DOMINO_W - SPACING;
        }
        break;
        
      case 'down':
        rotation = 90;
        layout.nextLeftY = y + DOMINO_W + SPACING;
        break;
    }
  }
  
  if (isDouble) rotation = 90;
  
  return { x, y, rotation };
}

// ─── Logique jeu ──────────────────────────────────────────────────────────────
function canPlay(hand, ends) {
  if (!ends) return true;
  return hand.some(d => d[0] === ends.left || d[1] === ends.left ||
                        d[0] === ends.right || d[1] === ends.right);
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
  let points = 0, winTeam;

  if (winnerId === 'blocked') {
    const t0 = getTeamPoints(room, 0);
    const t1 = getTeamPoints(room, 1);
    if (t0 < t1)      { winTeam = 0; points = t1; }
    else if (t1 < t0) { winTeam = 1; points = t0; }
    else              { winTeam = -1; points = 0; }
  } else {
    const winner = room.players.find(p => p.id === winnerId);
    winTeam = winner.team;
    const advTeam = winTeam === 0 ? 1 : 0;
    points = getTeamPoints(room, advTeam);
  }

  if (winTeam >= 0) room.scores[winTeam] = (room.scores[winTeam] || 0) + points;

  room.lastMancheWinner = winnerId === 'blocked'
    ? (winTeam >= 0 ? room.players.find(p => p.team === winTeam)?.id : room.currentTurn)
    : winnerId;

  io.to(room.code).emit('manche_end', { winTeam, points, scores: room.scores });

  if (room.scores[0] >= 100 || room.scores[1] >= 100) {
    const gameWinner = room.scores[0] >= 100 ? 0 : 1;
    io.to(room.code).emit('game_over', { winTeam: gameWinner, scores: room.scores });
    room.status = 'finished';
  } else {
    setTimeout(() => startManche(room), 4000);
  }
}

function findStartingPlayer(room) {
  if (room.maxPlayers === 4) {
    for (const p of room.players)
      if (room.hands[p.id].some(d => d[0] === 6 && d[1] === 6)) return p.id;
    return room.players[0].id;
  }
  for (let v = 6; v >= 0; v--)
    for (const p of room.players)
      if (room.hands[p.id].some(d => d[0] === v && d[1] === v)) return p.id;
  let bestPid = room.players[0].id, bestVal = -1;
  for (const p of room.players) {
    const maxVal = Math.max(...room.hands[p.id].map(d => d[0] + d[1]));
    if (maxVal > bestVal) { bestVal = maxVal; bestPid = p.id; }
  }
  return bestPid;
}

function startManche(room) {
  dealCards(room);
  const startId = room.lastMancheWinner || findStartingPlayer(room);
  room.currentTurn = startId;
  room.status = 'playing';
  room.layout = null;

  room.players.forEach(p => {
    io.to(p.id).emit('manche_start', {
      hand: room.hands[p.id],
      currentTurn: room.currentTurn,
      scores: room.scores,
      board: room.board,
      boardEnds: room.boardEnds,
      pioireLeft: room.pioche.length,
    });
  });
}

function nextTurn(room) {
  const idx = room.players.findIndex(p => p.id === room.currentTurn);
  room.currentTurn = room.players[(idx + 1) % room.players.length].id;
}

// ─── Socket.IO ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`✅ Joueur connecté: ${socket.id}`);

  socket.on('create_room', ({ name, maxPlayers }) => {
    const code = generateCode();
    rooms[code] = {
      code, maxPlayers: parseInt(maxPlayers),
      players: [], hands: {}, board: [], boardEnds: null,
      scores: { 0: 0, 1: 0 }, status: 'waiting',
      currentTurn: null, pioche: [], layout: null,
      lastMancheWinner: null,
    };
    const player = { id: socket.id, name, team: 0 };
    rooms[code].players.push(player);
    socket.join(code);
    socket.roomCode = code;
    console.log(`🎮 Salle créée: ${code} par ${name}`);
    socket.emit('room_created', { code, player, players: rooms[code].players });
  });

  socket.on('join_room', ({ name, code }) => {
    const room = rooms[code.toUpperCase()];
    if (!room)                         return socket.emit('error', { msg: 'Salle introuvable' });
    if (room.status !== 'waiting')     return socket.emit('error', { msg: 'Partie déjà commencée' });
    if (room.players.length >= room.maxPlayers) return socket.emit('error', { msg: 'Salle pleine' });

    const pos  = room.players.length;
    const team = room.maxPlayers === 4 ? (pos % 2) : pos;
    const player = { id: socket.id, name, team };
    room.players.push(player);
    socket.join(code.toUpperCase());
    socket.roomCode = code.toUpperCase();

    console.log(`👤 ${name} a rejoint la salle ${code}`);
    io.to(code.toUpperCase()).emit('player_joined', { players: room.players });
    socket.emit('room_joined', { code: code.toUpperCase(), player, players: room.players, maxPlayers: room.maxPlayers });

    if (room.players.length === room.maxPlayers) {
      console.log(`🚀 Démarrage de la partie dans ${code}`);
      setTimeout(() => startManche(room), 1000);
    }
  });

  socket.on('board_size', ({ code, width, height }) => {
    const room = rooms[code];
    if (!room) return;
    if (!room.layout) {
      room.layout = initLayout();
    }
  });

  socket.on('play_piece', ({ code, piece, side }) => {
    const room = rooms[code];
    if (!room) {
      console.log(`❌ Salle ${code} introuvable`);
      return;
    }
    
    if (room.currentTurn !== socket.id) {
      console.log(`❌ Pas le tour de ${socket.id}, c'est à ${room.currentTurn}`);
      return socket.emit('error', { msg: "Ce n'est pas votre tour" });
    }

    const hand = room.hands[socket.id];
    if (!hand) {
      console.log(`❌ Main introuvable pour ${socket.id}`);
      return;
    }

    const pieceIdx = hand.findIndex(d =>
      (d[0] === piece[0] && d[1] === piece[1]) ||
      (d[0] === piece[1] && d[1] === piece[0])
    );
    
    if (pieceIdx === -1) {
      console.log(`❌ Pièce [${piece[0]},${piece[1]}] pas trouvée dans la main`);
      return;
    }

    let played = [...hand[pieceIdx]];
    if (!room.layout) room.layout = initLayout();

    console.log(`🎯 ${socket.id} joue [${played[0]},${played[1]}] côté ${side}`);

    if (!room.boardEnds) {
      const pos = getNextPosition(room.layout, 'center', played[0] === played[1]);
      room.board.push({ 
        piece: played, 
        side: 'center', 
        x: pos.x, 
        y: pos.y, 
        rotation: pos.rotation 
      });
      room.boardEnds = { left: played[0], right: played[1] };
      console.log(`✅ Premier domino posé. Extrémités: ${played[0]} | ${played[1]}`);
    } 
    else {
      const matchesLeft = played[0] === room.boardEnds.left || played[1] === room.boardEnds.left;
      const matchesRight = played[0] === room.boardEnds.right || played[1] === room.boardEnds.right;

      if (!matchesLeft && !matchesRight) {
        console.log(`❌ Pièce [${played[0]},${played[1]}] ne correspond pas aux extrémités [${room.boardEnds.left},${room.boardEnds.right}]`);
        return;
      }

      let actualSide = side;
      if (matchesLeft && !matchesRight) actualSide = 'left';
      if (matchesRight && !matchesLeft) actualSide = 'right';

      const isDouble = played[0] === played[1];
      const pos = getNextPosition(room.layout, actualSide, isDouble);

      if (actualSide === 'left') {
        if (played[1] === room.boardEnds.left) {
          room.board.unshift({ piece: played, side: 'left', x: pos.x, y: pos.y, rotation: pos.rotation });
          room.boardEnds.left = played[0];
        } else {
          played = [played[1], played[0]];
          room.board.unshift({ piece: played, side: 'left', x: pos.x, y: pos.y, rotation: pos.rotation });
          room.boardEnds.left = played[0];
        }
        console.log(`✅ Domino posé à gauche. Nouvelle extrémité gauche: ${room.boardEnds.left}`);
      } else {
        if (played[0] === room.boardEnds.right) {
          room.board.push({ piece: played, side: 'right', x: pos.x, y: pos.y, rotation: pos.rotation });
          room.boardEnds.right = played[1];
        } else {
          played = [played[1], played[0]];
          room.board.push({ piece: played, side: 'right', x: pos.x, y: pos.y, rotation: pos.rotation });
          room.boardEnds.right = played[1];
        }
        console.log(`✅ Domino posé à droite. Nouvelle extrémité droite: ${room.boardEnds.right}`);
      }
    }

    room.hands[socket.id].splice(pieceIdx, 1);
    console.log(`📋 ${socket.id} a maintenant ${room.hands[socket.id].length} domino(s)`);

    io.to(code).emit('piece_played', {
      playerId: socket.id,
      board: room.board,
      boardEnds: room.boardEnds,
      handCounts: Object.fromEntries(room.players.map(p => [p.id, room.hands[p.id].length])),
    });
    
    socket.emit('hand_update', { hand: room.hands[socket.id] });

    if (room.hands[socket.id].length === 0) { 
      console.log(`🏆 ${socket.id} a gagné la manche !`);
      endManche(room, socket.id); 
      return; 
    }

    nextTurn(room);
    console.log(`⏭️ Tour suivant: ${room.currentTurn}`);

    if (isBlocked(room)) { 
      console.log(`🚫 Partie bloquée !`);
      endManche(room, 'blocked'); 
      return; 
    }

    let skipped = [];
    if (room.maxPlayers === 2) {
      io.to(code).emit('turn_change', { 
        currentTurn: room.currentTurn, 
        skipped: [], 
        pioireLeft: room.pioche.length 
      });
    } else {
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
        skipped, 
        pioireLeft: room.pioche.length 
      });
    }
  });

  socket.on('draw_piece', ({ code }) => {
    const room = rooms[code];
    if (!room || room.currentTurn !== socket.id) return;
    if (room.pioche.length === 0) return;

    const piece = room.pioche.pop();
    room.hands[socket.id].push(piece);

    console.log(`🎲 ${socket.id} a pioché: [${piece[0]}, ${piece[1]}]`);

    socket.emit('piece_drawn', { piece, hand: room.hands[socket.id] });
    io.to(code).emit('draw_happened', {
      playerId: socket.id,
      handCounts: Object.fromEntries(room.players.map(p => [p.id, room.hands[p.id].length])),
      pioireLeft: room.pioche.length,
    });

    const canNowPlay = canPlay(room.hands[socket.id], room.boardEnds);
    if (canNowPlay) {
      console.log(`✅ ${socket.id} peut maintenant jouer`);
      io.to(code).emit('turn_change', { currentTurn: room.currentTurn, skipped: [], pioireLeft: room.pioche.length });
    } else if (room.pioche.length === 0) {
      console.log(`⏭️ ${socket.id} passe son tour (pioche vide)`);
      nextTurn(room);
      io.to(code).emit('turn_change', { currentTurn: room.currentTurn, skipped: [socket.id], pioireLeft: 0 });
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Joueur déconnecté: ${socket.id}`);
    const code = socket.roomCode;
    if (!code || !rooms[code]) return;
    const room = rooms[code];
    room.players = room.players.filter(p => p.id !== socket.id);
    if (room.players.length === 0) {
      console.log(`🗑️ Suppression de la salle vide: ${code}`);
      delete rooms[code];
    } else {
      io.to(code).emit('player_left', { players: room.players, msg: 'Un joueur a quitté la partie' });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎮 Domino Bloqué - Serveur FINAL sur port ${PORT}\n`);
});
