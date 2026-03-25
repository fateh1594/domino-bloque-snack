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

// ─── Calcul position/rotation domino sur plateau CORRIGÉ ──────────────────────
const DOMINO_W = 60;
const DOMINO_H = 30;
const SPACING = 2;
const BOARD_W = 800;
const BOARD_H = 500;
const MARGIN = 40;

function initLayout() {
  const centerX = Math.floor((BOARD_W - DOMINO_W) / 2);
  const centerY = Math.floor((BOARD_H - DOMINO_H) / 2);
  
  return {
    firstX: centerX,
    firstY: centerY,
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
  
  if (side === 'center') {
    x = layout.firstX;
    y = layout.firstY;
    rotation = isDouble ? 90 : 0;
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
        if (layout.nextRightY > layout.bottomBoundary) {
          layout.rightDirection = 'left';
          layout.nextRightX = x - DOMINO_W - SPACING;
          layout.nextRightY = y;
        }
        break;
        
      case 'left':
        rotation = 0;
        layout.nextRightX = x - DOMINO_W - SPACING;
        break;
    }
  } else {
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
  if (room
