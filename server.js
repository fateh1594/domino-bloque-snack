const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));

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

const rooms = {};

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function calcPoints(hand) {
  return hand.reduce((sum, d) => sum + d[0] + d[1], 0);
}

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

const DOMINO_W = 100;
const DOMINO_H = 50;
const SPACING = 10;

function initLayout() {
  return {
    center: { x: 400, y: 250 },
    nextIndex: 0
  };
}

function getNextPosition(layout, side, isDouble = false) {
  const centerX = layout.center.x;
  const centerY = layout.center.y;
  const index = layout.nextIndex++;
  const offsetX = (index - 2) * (DOMINO_W + SPACING);
  return {
    x: centerX + offsetX - DOMINO_W / 2,
    y: centerY - DOMINO_H / 2,
    rotation: isDouble ? 90 : 0
  };
}

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
  room.layout = initLayout();

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
    socket.emit('room_created', { code,
