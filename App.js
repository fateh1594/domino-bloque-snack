import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Dimensions, StatusBar, ScrollView,
} from 'react-native';
import { io } from 'socket.io-client';

import { DominoFace, C, HPAD, HGAP } from './domino';
import { HandArea }                    from './hand';
import { BoardArea, TopOpponent, SideOpponent } from './board';

const SERVER_URL = 'https://domino-bloque.onrender.com';
const { width }  = Dimensions.get('window');

// ══════════════════════════════════════════════════════════════════════════════
// APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [screen,       setScreen]       = useState('lobby');
  const [playerName,   setPlayerName]   = useState('');
  const [joinCode,     setJoinCode]     = useState('');
  const [maxPlayers,   setMaxPlayers]   = useState(2);
  const [error,        setError]        = useState('');
  const [roomCode,     setRoomCode]     = useState('');
  const [players,      setPlayers]      = useState([]);
  const [me,           setMe]           = useState(null);
  const [myHand,       setMyHand]       = useState([]);
  const [board,        setBoard]        = useState([]);
  const [boardEnds,    setBoardEnds]    = useState(null);
  const [currentTurn,  setCurrentTurn]  = useState(null);
  const [scores,       setScores]       = useState({ 0: 0, 1: 0 });
  const [handCounts,   setHandCounts]   = useState({});
  const [pioireLeft,   setPioireLeft]   = useState(0);
  const [toast,        setToast]        = useState('');
  const [mancheResult, setMancheResult] = useState(null);
  const [gameOver,     setGameOver]     = useState(null);
  const [selectedIdx,  setSelectedIdx]  = useState(null);
  const [boardSize,    setBoardSize]    = useState({ w: 0, h: 0 });
  const socketRef = useRef(null);

  // ── Socket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('room_created',  ({ code, player, players: pl }) => {
      setMe(player); setPlayers(pl); setRoomCode(code); setScreen('waiting');
    });
    socket.on('room_joined',   ({ code, player, players: pl, maxPlayers: mp }) => {
      setMe(player); setPlayers(pl); setRoomCode(code);
      if (mp) setMaxPlayers(mp);
      setScreen('waiting');
    });
    socket.on('player_joined', ({ players: pl }) => setPlayers(pl));
    socket.on('manche_start',  ({ hand, currentTurn: ct, scores: sc, board: b, boardEnds: be, pioireLeft: pl }) => {
      setMyHand(hand); setCurrentTurn(ct); setScores(sc);
      setBoard(b || []); setBoardEnds(be);
      setPioireLeft(pl || 0);
      setSelectedIdx(null); setMancheResult(null); setGameOver(null);
      setScreen('game');
      if (ct === socket.id) showToast('🎯 Vous commencez !');
    });
    socket.on('piece_played',  ({ playerId, board: b, boardEnds: be, handCounts: hc }) => {
      console.log('📨 piece_played reçu:', { playerId, boardLength: b?.length, board: b });
      setBoard(b); setBoardEnds(be); setHandCounts(hc);
      if (playerId !== socket.id) showToast('Domino joué');
    });
    socket.on('hand_update',   ({ hand }) => { setMyHand(hand); setSelectedIdx(null); });
    socket.on('turn_change',   ({ currentTurn: ct, skipped, pioireLeft: pl }) => {
      setCurrentTurn(ct); setSelectedIdx(null);
      if (pl !== undefined) setPioireLeft(pl);
      if (skipped?.length > 0) showToast('Un joueur passe son tour');
    });
    socket.on('forced_pass',   () => showToast('Vous passez votre tour'));
    socket.on('piece_drawn',   ({ hand }) => { setMyHand(hand); showToast('Pièce piochée !'); });
    socket.on('draw_happened', ({ handCounts: hc, pioireLeft: pl }) => {
      setHandCounts(hc); setPioireLeft(pl);
    });
    socket.on('manche_end',    ({ winTeam, points, scores: sc }) => {
      setScores(sc); setMancheResult({ winTeam, points, scores: sc });
    });
    socket.on('game_over',     ({ winTeam, scores: sc }) => {
      setScores(sc); setGameOver({ winTeam, scores: sc });
    });
    socket.on('player_left',   ({ players: pl, msg }) => { setPlayers(pl); showToast(msg); });
    socket.on('error',         ({ msg }) => setError(msg));

    return () => socket.disconnect();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  function createRoom() {
    if (!playerName.trim()) return setError('Entrez votre nom');
    setError('');
    socketRef.current.emit('create_room', { name: playerName.trim(), maxPlayers });
  }

  function joinRoom() {
    if (!playerName.trim()) return setError('Entrez votre nom');
    if (!joinCode.trim())   return setError('Entrez un code');
    setError('');
    socketRef.current.emit('join_room', { name: playerName.trim(), code: joinCode.trim().toUpperCase() });
  }

  function canPlay(piece) {
    if (!boardEnds) return true;
    return piece[0] === boardEnds.left  || piece[1] === boardEnds.left ||
           piece[0] === boardEnds.right || piece[1] === boardEnds.right;
  }

  function canPlayLeft(piece) {
    if (!boardEnds) return false;
    return piece[0] === boardEnds.left || piece[1] === boardEnds.left;
  }

  function canPlayRight(piece) {
    if (!boardEnds) return false;
    return piece[0] === boardEnds.right || piece[1] === boardEnds.right;
  }

  function handleSelect(idx) {
    console.log('🎯 handleSelect:', { idx, piece: myHand[idx], boardLength: board.length });
    if (!isMyTurn) return showToast("Ce n'est pas votre tour");
    const piece = myHand[idx];
    if (!canPlay(piece)) return showToast('Pièce non jouable');

    if (!boardEnds) {
      setSelectedIdx(selectedIdx === idx ? null : idx);
      return;
    }

    const left = canPlayLeft(piece);
    const right = canPlayRight(piece);

    if (left && !right) {
      socketRef.current.emit('play_piece', { code: roomCode, piece, side: 'left' });
      setSelectedIdx(null);
      return;
    }
    if (right && !left) {
      socketRef.current.emit('play_piece', { code: roomCode, piece, side: 'right' });
      setSelectedIdx(null);
      return;
    }
    
    setSelectedIdx(selectedIdx === idx ? null : idx);
  }

  function playSide(side) {
    if (selectedIdx === null) return;
    const piece = myHand[selectedIdx];
    
    if (!boardEnds) {
      socketRef.current.emit('play_piece', { code: roomCode, piece, side: 'right' });
    } else {
      socketRef.current.emit('play_piece', { code: roomCode, piece, side });
    }
    setSelectedIdx(null);
  }

  function drawPiece() {
    socketRef.current.emit('draw_piece', { code: roomCode });
  }

  // ── Dérivés ───────────────────────────────────────────────────────────────
  const isMyTurn    = !!(socketRef.current && currentTurn === socketRef.current.id);
  const hasPlayable = myHand.some(p => canPlay(p));
  const needToDraw  = isMyTurn && !hasPlayable && maxPlayers === 2 && pioireLeft > 0;
  const teamName    = t => players.filter(p => p.team === t).map(p => p.name).join(' & ') || `Éq.${t + 1}`;

  const others      = players.filter(p => p.id !== socketRef.current?.id);
  const topPlayer   = others[0] || null;
  const leftPlayer  = others[1] || null;
  const rightPlayer = others[2] || null;

  const selPiece  = selectedIdx !== null ? myHand[selectedIdx] : null;
  const showLeft  = isMyTurn && selPiece && board.length > 0 && canPlayLeft(selPiece);
  const showRight = isMyTurn && selPiece && board.length > 0 && canPlayRight(selPiece);
  const showCenter= isMyTurn && selPiece && board.length === 0;

  // ── LOBBY ─────────────────────────────────────────────────────────────────
  if (screen === 'lobby') return (
    <View style={S.bg}>
      <StatusBar hidden />
      <ScrollView contentContainerStyle={S.lobbyScroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={S.logoWrap}>
          <DominoFace a={6} b={6} w={52} h={100} vertical={true}
            extraStyle={{ marginBottom: 16, elevation: 10 }} />
          <Text style={S.t1}>DOMINO</Text>
          <Text style={S.t2}>BLOQUÉ</Text>
          <View style={S.connRow}>
            <View style={S.connDot} />
            <Text style={S.connTxt}>Connecté</Text>
          </View>
        </View>

        {/* Nom */}
        <View style={S.card}>
          <Text style={S.lbl}>VOTRE NOM</Text>
          <TextInput style={S.inp} placeholder="Entrez votre nom"
            placeholderTextColor="#4a6e4e" value={playerName}
            onChangeText={setPlayerName} maxLength={16} />
        </View>

        {/* Mode */}
        <View style={S.card}>
          <Text style={S.lbl}>NOMBRE DE JOUEURS</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[2, 4].map(n => (
              <TouchableOpacity key={n}
                style={[S.mBtn, maxPlayers === n && S.mBtnOn]}
                onPress={() => setMaxPlayers(n)}>
                <Text style={[S.mTxt, maxPlayers === n && S.mTxtOn]}>{n} Joueurs</Text>
                {n === 4 && <Text style={S.mSub}>Équipes</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={S.btnGold} onPress={createRoom}>
          <Text style={S.btnGoldTxt}>Créer une salle privée</Text>
        </TouchableOpacity>

        <View style={S.divRow}>
          <View style={S.divLine} /><Text style={S.divTxt}>OU</Text><View style={S.divLine} />
        </View>

        <View style={S.card}>
          <Text style={S.lbl}>CODE DE LA SALLE</Text>
          <TextInput style={S.inp} placeholder="Ex: ABC123"
            placeholderTextColor="#4a6e4e" value={joinCode}
            onChangeText={t => setJoinCode(t.toUpperCase())}
            maxLength={6} autoCapitalize="characters" />
          <TouchableOpacity style={[S.btnOutline, { marginTop: 12 }]} onPress={joinRoom}>
            <Text style={S.btnOutlineTxt}>Rejoindre</Text>
          </TouchableOpacity>
        </View>

        {!!error && <Text style={S.err}>{error}</Text>}
      </ScrollView>
    </View>
  );

  // ── WAITING ───────────────────────────────────────────────────────────────
  if (screen === 'waiting') return (
    <View style={[S.bg, { alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20 }]}>
      <StatusBar hidden />
      <Text style={S.wLbl}>CODE DE LA SALLE</Text>
      <Text style={S.wCode}>{roomCode}</Text>
      <Text style={S.wHint}>Partagez ce code avec vos amis</Text>
      <View style={{ width: '100%',
