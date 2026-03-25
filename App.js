import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Dimensions, StatusBar, ScrollView,
} from 'react-native';
import { io } from 'socket.io-client';

import { DominoFace, C, HPAD, HGAP } from './domino';
import { HandArea }                    from './hand';
import { BoardArea, TopOpponent, SideOpponent } from './board';
import { GameLogic } from './utils/GameLogic'; // ← Nouvelle logique

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
  const [boardSize,    setBoardSize]    = useState({ w: 800, h: 400 }); // ← Taille par défaut
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

  // ── Logique de jeu améliorée ─────────────────────────────────────────────
  function canPlay(piece) {
    return GameLogic.canPlaceDomino(board, piece, boardEnds);
  }

  function canPlayLeft(piece) {
    return GameLogic.canPlaceOnSide(board, piece, boardEnds, 'left');
  }

  function canPlayRight(piece) {
    return GameLogic.canPlaceOnSide(board, piece, boardEnds, 'right');
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

  // ── LOBBY (GARDÉ INTACT) ─────────────────────────────────────────────────
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

  // ── WAITING (GARDÉ INTACT) ───────────────────────────────────────────────
  if (screen === 'waiting') return (
    <View style={[S.bg, { alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20 }]}>
      <StatusBar hidden />
      <Text style={S.wLbl}>CODE DE LA SALLE</Text>
      <Text style={S.wCode}>{roomCode}</Text>
      <Text style={S.wHint}>Partagez ce code avec vos amis</Text>
      <View style={{ width: '100%', maxWidth: 360, gap: 10 }}>
        {Array.from({ length: maxPlayers }).map((_, i) => {
          const p = players[i];
          return (
            <View key={i} style={[S.slot, p && S.slotOn]}>
              {p ? <>
                <View style={S.av}><Text style={S.avTxt}>{p.name[0].toUpperCase()}</Text></View>
                <Text style={S.pName}>{p.name}{p.id === socketRef.current?.id ? ' (vous)' : ''}</Text>
                {maxPlayers === 4 && <Text style={S.tBadge}>ÉQ. {p.team + 1}</Text>}
              </> : <>
                <View style={S.spin} /><Text style={S.wTxt}>En attente…</Text>
              </>}
            </View>
          );
        })}
      </View>
      <Text style={{ fontSize: 13, color: C.dim }}>{players.length}/{maxPlayers} joueurs</Text>
    </View>
  );

  // ── GAME (Amélioré avec nouvelle logique) ────────────────────────────────
  return (
    <View style={S.game}>
      <StatusBar hidden />

      {/* SCORES */}
      <View style={S.header}>
        <View style={S.scoreBox}>
          <Text style={S.sLbl}>NOUS</Text>
          <Text style={S.sVal}>
            {scores[me?.team ?? 0]}<Text style={S.sMax}>/100</Text>
          </Text>
        </View>
        <Text style={S.sX}>✕</Text>
        <View style={S.scoreBox}>
          <Text style={[S.sLbl, { color: C.red }]}>RIVAUX</Text>
          <Text style={[S.sVal, { color: C.red }]}>
            {scores[me?.team === 0 ? 1 : 0]}<Text style={S.sMax}>/100</Text>
          </Text>
        </View>
      </View>

      {/* ADVERSAIRE HAUT */}
      <TopOpponent
        player={topPlayer}
        handCount={handCounts[topPlayer?.id]}
        isCurrentTurn={topPlayer?.id === currentTurn}
      />

      {/* MILIEU */}
      <View style={S.middleRow}>

        {/* GAUCHE */}
        <SideOpponent
          player={leftPlayer}
          handCount={handCounts[leftPlayer?.id]}
          isCurrentTurn={leftPlayer?.id === currentTurn}
          side="left"
        />

        {/* PLATEAU AMÉLIORÉ */}
        <BoardArea
          board={board}
          boardSize={boardSize}
          boardEnds={boardEnds}
          isMyTurn={isMyTurn}
          selPiece={selPiece}
          showLeft={showLeft}
          showRight={showRight}
          showCenter={showCenter}
          onPlaySide={playSide}
          onLayout={e => {
            const { width: w, height: h } = e.nativeEvent.layout;
            setBoardSize({ w, h });
            if (socketRef.current && roomCode) {
              socketRef.current.emit('board_size', { code: roomCode, width: w, height: h });
            }
          }}
        />

        {/* DROITE */}
        <SideOpponent
          player={rightPlayer}
          handCount={handCounts[rightPlayer?.id]}
          isCurrentTurn={rightPlayer?.id === currentTurn}
          side="right"
        />
      </View>

      {/* MAIN */}
      <HandArea
        myHand={myHand}
        me={me}
        isMyTurn={isMyTurn}
        needToDraw={needToDraw}
        pioireLeft={pioireLeft}
        selectedIdx={selectedIdx}
        currentTurn={currentTurn}
        players={players}
        canPlay={canPlay}
        onSelect={handleSelect}
        onDraw={drawPiece}
        onCancelSelect={() => setSelectedIdx(null)}
      />

      {/* TOAST */}
      {!!toast && (
        <View style={S.toast}><Text style={S.toastTxt}>{toast}</Text></View>
      )}

      {/* OVERLAY MANCHE */}
      {mancheResult && !gameOver && (
        <View style={S.overlay}>
          <View style={S.ovCard}>
            <Text style={S.ovTitle}>
              {mancheResult.winTeam === me?.team ? '🎉 Votre équipe gagne !'
                : mancheResult.winTeam === -1 ? 'Égalité !'
                : '😔 Équipe adverse gagne'}
            </Text>
            <Text style={S.ovPts}>+{mancheResult.points} points</Text>
            <View style={S.ovScores}>
              {[0, 1].map(t => (
                <View key={t} style={{ alignItems: 'center' }}>
                  <Text style={S.ovTN}>{teamName(t)}</Text>
                  <Text style={S.ovTV}>{mancheResult.scores[t]}</Text>
                </View>
              ))}
            </View>
            <Text style={S.ovHint}>Prochaine manche dans quelques secondes…</Text>
          </View>
        </View>
      )}

      {/* OVERLAY FIN DE PARTIE */}
      {gameOver && (
        <View style={S.overlay}>
          <View style={S.ovCard}>
            <Text style={S.ovTitle}>
              {gameOver.winTeam === me?.team ? '🏆 VICTOIRE !' : '💀 DÉFAITE'}
            </Text>
            <Text style={S.ovPts}>
              {gameOver.winTeam === me?.team ? 'Félicitations !' : "L'équipe adverse a gagné"}
            </Text>
            <View style={S.ovScores}>
              {[0, 1].map(t => (
                <View key={t} style={{ alignItems: 'center' }}>
                  <Text style={S.ovTN}>{teamName(t)}</Text>
                  <Text style={S.ovTV}>{gameOver.scores[t]}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={[S.btnGold, { marginTop: 16, width: '100%' }]}
              onPress={() => setScreen('lobby')}>
              <Text style={S.btnGoldTxt}>Nouvelle partie</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ── STYLES (GARDÉS INTACTS) ──────────────────────────────────────────────────
const S = StyleSheet.create({
  // Lobby
  bg:          { flex: 1, backgroundColor: C.bg },
  lobbyScroll: { padding: 20, paddingBottom: 40, alignItems: 'center' },
  logoWrap:    { alignItems: 'center', marginBottom: 20, marginTop: 16 },
  t1: { fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: 4 },
  t2: { fontSize: 20, fontWeight: '700', color: C.gold, letterSpacing: 10, marginTop: 2 },
  connRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  connDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4caf50' },
  connTxt: { fontSize: 12, color: C.dim },
  card:    { width: '100%', maxWidth: 400, backgroundColor: 'rgba(26,69,32,0.5)', borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 16, marginBottom: 12 },
  lbl:     { fontSize: 11, fontWeight: '700', letterSpacing: 2, color: C.dim, marginBottom: 8, textTransform: 'uppercase' },
  inp:     { height: 48, backgroundColor: 'rgba(15,40,18,0.8)', borderWidth: 1, borderColor: C.border, borderRadius: 10, color: C.text, fontSize: 15, paddingHorizontal: 16 },
  mBtn:    { flex: 1, height: 58, backgroundColor: 'rgba(15,40,18,0.6)', borderWidth: 2, borderColor: C.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  mBtnOn:  { borderColor: C.gold, backgroundColor: 'rgba(201,168,76,0.15)' },
  mTxt:    { fontSize: 14, fontWeight: '700', color: C.dim },
  mTxtOn:  { color: C.text },
  mSub:    { fontSize: 10, color: C.gold, fontWeight: '600', letterSpacing: 1 },
  btnGold:    { width: '100%', maxWidth: 400, height: 50, backgroundColor: C.gold, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 12, elevation: 6 },
  btnGoldTxt: { fontSize: 15, fontWeight: '700', color: '#1a1200', letterSpacing: 1 },
  btnOutline:    { height: 48, borderWidth: 1, borderColor: C.gold, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  btnOutlineTxt: { fontSize: 15, fontWeight: '600', color: C.gold },
  divRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4, width: '100%', maxWidth: 400 },
  divLine: { flex: 1, height: 1, backgroundColor: C.border },
  divTxt:  { fontSize: 12, color: C.dim, letterSpacing: 2 },
  err:     { color: '#c0392b', fontSize: 13, marginTop: 4 },

  // Waiting
  wLbl:  { fontSize: 12, letterSpacing: 3, color: C.dim, fontWeight: '700' },
  wCode: { fontSize: 52, fontWeight: '900', color: C.gold, letterSpacing: 12 },
  wHint: { fontSize: 12, color: C.dim },
  slot:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(26,69,32,0.4)', borderWidth: 1, borderColor: C.border, borderRadius: 12, height: 50, paddingHorizontal: 16 },
  slotOn:{ borderColor: C.gold },
  av:    { width: 32, height: 32, borderRadius: 16, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  avTxt: { fontWeight: '700', fontSize: 14, color: '#1a1200' },
  pName: { fontWeight: '600', fontSize: 14, color: C.text, flex: 1 },
  tBadge:{ fontSize: 10, color: C.gold, fontWeight: '700', letterSpacing: 1 },
  spin:  { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border, borderTopColor: C.gold },
  wTxt:  { color: C.dim, fontSize: 13 },

  // Game
  game:   { flex: 1, backgroundColor: C.felt },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, backgroundColor: 'rgba(6,14,6,0.92)', borderBottomWidth: 1, borderBottomColor: C.border },
  scoreBox: { flex: 1, alignItems: 'center' },
  sLbl: { fontSize: 11, fontWeight: '800', color: C.gold, letterSpacing: 2 },
  sVal: { fontSize: 28, fontWeight: '900', color: C.gold },
  sMax: { fontSize: 13, color: C.dim },
  sX:   { fontSize: 20, color: C.goldDim, paddingHorizontal: 10 },

  middleRow: { flex: 1, flexDirection: 'row' },

  // Toast
  toast:    { position: 'absolute', bottom: 145, alignSelf: 'center', backgroundColor: 'rgba(10,28,12,0.97)', borderWidth: 1, borderColor: C.gold, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 20, zIndex: 50, elevation: 20 },
  toastTxt: { fontSize: 13, fontWeight: '600', color: C.text },

  // Overlays
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.82)', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 },
  ovCard:  { backgroundColor: C.felt, borderWidth: 1, borderColor: C.gold, borderRadius: 20, padding: 28, width: '100%', maxWidth: 340, alignItems: 'center', elevation: 20 },
  ovTitle: { fontSize: 22, fontWeight: '900', color: C.gold, marginBottom: 6, textAlign: 'center' },
  ovPts:   { fontSize: 14, color: C.dim, marginBottom: 16 },
  ovScores:{ flexDirection: 'row', gap: 40, marginBottom: 16 },
  ovTN:    { fontSize: 11, letterSpacing: 1.5, color: C.dim, marginBottom: 4 },
  ovTV:    { fontSize: 42, fontWeight: '900', color: C.gold, lineHeight: 46 },
  ovHint:  { fontSize: 12, color: C.dim, textAlign: 'center' },
});
