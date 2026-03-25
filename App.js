import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Dimensions, StatusBar, ScrollView,
} from 'react-native';
import { io } from 'socket.io-client';

import { DominoFace, C, HPAD, HGAP } from './domino';
import { HandArea }                    from './hand';
import { BoardArea, TopOpponent, SideOpponent } from './board';
import { GameLogic } from './GameLogic';

const SERVER_URL = 'https://domino-bloque.onrender.com';
const { width }  = Dimensions.get('window');

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
  const [boardSize,    setBoardSize]    = useState({ w: 800, h: 400 });
  const socketRef = useRef(null);

  useEffect(() => {
    console.log('🔌 === INITIALISATION SOCKET ===');
    console.log('🔌 SERVER_URL:', SERVER_URL);
    
    const socket = io(SERVER_URL, { transports: ['websocket'] });
    socketRef.current = socket;
    
    socket.on('connect', () => {
      console.log('✅ === CONNEXION RÉUSSIE ===');
      console.log('✅ Socket ID:', socket.id);
      console.log('✅ Socket.connected:', socket.connected);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ === DÉCONNEXION ===');
      console.log('❌ Raison:', reason);
    });

    socket.on('connect_error', (error) => {
      console.log('🚨 === ERREUR CONNEXION ===');
      console.log('🚨 Error:', error.message);
    });

    socket.on('room_created', (data) => {
      console.log('✅ === SALLE CRÉÉE REÇUE ===');
      console.log('✅ Data:', data);
      setMe(data.player); 
      setPlayers(data.players); 
      setRoomCode(data.code); 
      setScreen('waiting');
    });

    socket.on('room_joined', ({ code, player, players: pl, maxPlayers: mp }) => {
      console.log('✅ === SALLE REJOINTE ===');
      setMe(player); 
      setPlayers(pl); 
      setRoomCode(code);
      if (mp) setMaxPlayers(mp);
      setScreen('waiting');
    });

    socket.on('player_joined', ({ players: pl }) => {
      console.log('👤 === JOUEUR REJOINT ===');
      setPlayers(pl);
    });

    socket.on('manche_start', ({ hand, currentTurn: ct, scores: sc, board: b, boardEnds: be, pioireLeft: pl }) => {
      console.log('🎮 === MANCHE DÉMARRÉE ===');
      setMyHand(hand); 
      setCurrentTurn(ct); 
      setScores(sc);
      setBoard(b || []); 
      setBoardEnds(be);
      setPioireLeft(pl || 0);
      setSelectedIdx(null); 
      setMancheResult(null); 
      setGameOver(null);
      setScreen('game');
      if (ct === socket.id) showToast('🎯 Vous commencez !');
    });

    socket.on('piece_played', ({ playerId, board: b, boardEnds: be, handCounts: hc }) => {
      console.log('🎲 === PIÈCE JOUÉE ===');
      setBoard(b); 
      setBoardEnds(be); 
      setHandCounts(hc);
      if (playerId !== socket.id) showToast('Domino joué');
    });

    socket.on('hand_update', ({ hand }) => {
      console.log('🎲 === MAIN MISE À JOUR ===');
      setMyHand(hand); 
      setSelectedIdx(null);
    });

    socket.on('turn_change', ({ currentTurn: ct, skipped, pioireLeft: pl }) => {
      console.log('🔄 === CHANGEMENT TOUR ===');
      setCurrentTurn(ct); 
      setSelectedIdx(null);
      if (pl !== undefined) setPioireLeft(pl);
      if (skipped?.length > 0) showToast('Un joueur passe son tour');
    });

    socket.on('forced_pass', () => {
      console.log('⏭️ === PASSAGE FORCÉ ===');
      showToast('Vous passez votre tour');
    });

    socket.on('piece_drawn', ({ hand }) => {
      console.log('🎲 === PIÈCE PIOCHÉE ===');
      setMyHand(hand); 
      showToast('Pièce piochée !');
    });

    socket.on('draw_happened', ({ handCounts: hc, pioireLeft: pl }) => {
      console.log('🎲 === PIOCHE ÉVÉNEMENT ===');
      setHandCounts(hc); 
      setPioireLeft(pl);
    });

    socket.on('manche_end', ({ winTeam, points, scores: sc }) => {
      console.log('🏁 === FIN MANCHE ===');
      setScores(sc); 
      setMancheResult({ winTeam, points, scores: sc });
    });

    socket.on('game_over', ({ winTeam, scores: sc }) => {
      console.log('🏆 === FIN PARTIE ===');
      setScores(sc); 
      setGameOver({ winTeam, scores: sc });
    });

    socket.on('player_left', ({ players: pl, msg }) => {
      console.log('👋 === JOUEUR PARTI ===');
      setPlayers(pl); 
      showToast(msg);
    });

    socket.on('error', (data) => {
      console.log('🚨 === ERREUR SERVEUR ===');
      setError(data.msg || 'Erreur serveur');
    });

    return () => {
      console.log('🔌 === NETTOYAGE SOCKET ===');
      socket.disconnect();
    };
  }, []);

  function showToast(msg) {
    console.log('📢 Toast:', msg);
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  function createRoom() {
    console.log('\n🎮 === DÉBUT createRoom ===');
    console.log('📝 playerName:', `"${playerName}"`);
    console.log('📝 playerName.trim():', `"${playerName.trim()}"`);
    console.log('🎯 maxPlayers:', maxPlayers);
    console.log('🔗 Socket connecté:', socketRef.current?.connected);
    
    if (!playerName.trim()) {
      console.log('❌ ÉCHEC: Nom vide');
      setError('Entrez votre nom');
      return;
    }
    
    if (!socketRef.current?.connected) {
      console.log('❌ ÉCHEC: Socket non connecté');
      setError('Connexion en cours...');
      return;
    }
    
    console.log('✅ VALIDATIONS PASSÉES');
    setError('');
    
    const data = { name: playerName.trim(), maxPlayers };
    console.log('📤 ENVOI create_room:', data);
    
    try {
      socketRef.current.emit('create_room', data);
      console.log('✅ create_room ENVOYÉ');
    } catch (error) {
      console.log('🚨 ERREUR envoi:', error.message);
    }
    
    console.log('🎮 === FIN createRoom ===\n');
  }

  function joinRoom() {
    console.log('\n🎮 === DÉBUT joinRoom ===');
    
    if (!playerName.trim()) {
      setError('Entrez votre nom');
      return;
    }
    if (!joinCode.trim()) {
      setError('Entrez un code');
      return;
    }
    
    if (!socketRef.current?.connected) {
      setError('Connexion en cours...');
      return;
    }
    
    setError('');
    const data = { name: playerName.trim(), code: joinCode.trim().toUpperCase() };
    console.log('📤 ENVOI join_room:', data);
    socketRef.current.emit('join_room', data);
  }

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
    console.log('🎯 Sélection domino:', idx, myHand[idx]);
    
    if (!isMyTurn) {
      showToast("Ce n'est pas votre tour");
      return;
    }
    
    const piece = myHand[idx];
    if (!canPlay(piece)) {
      showToast('Pièce non jouable');
      return;
    }

    if (!boardEnds) {
      setSelectedIdx(selectedIdx === idx ? null : idx);
      return;
    }

    const left = canPlayLeft(piece);
    const right = canPlayRight(piece);

    if (left && !right) {
      console.log('📤 Jeu automatique à gauche');
      socketRef.current.emit('play_piece', { code: roomCode, piece, side: 'left' });
      setSelectedIdx(null);
      return;
    }
    if (right && !left) {
      console.log('📤 Jeu automatique à droite');
      socketRef.current.emit('play_piece', { code: roomCode, piece, side: 'right' });
      setSelectedIdx(null);
      return;
    }
    
    setSelectedIdx(selectedIdx === idx ? null : idx);
  }

  function playSide(side) {
    if (selectedIdx === null) return;
    
    const piece = myHand[selectedIdx];
    console.log('📤 Jeu manuel:', { piece, side });
    
    if (!boardEnds) {
      socketRef.current.emit('play_piece', { code: roomCode, piece, side: 'right' });
    } else {
      socketRef.current.emit('play_piece', { code: roomCode, piece, side });
    }
    setSelectedIdx(null);
  }

  function drawPiece() {
    console.log('🎲 Pioche demandée');
    socketRef.current.emit('draw_piece', { code: roomCode });
  }

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

  if (screen === 'lobby') return (
    <View style={S.bg}>
      <StatusBar hidden />
      <ScrollView contentContainerStyle={S.lobbyScroll} keyboardShouldPersistTaps="handled">

        <View style={S.logoWrap}>
          <DominoFace a={6} b={6} w={52} h={100} vertical={true}
            extraStyle={{ marginBottom: 16, elevation: 10 }} />
          <Text style={S.t1}>DOMINO</Text>
          <Text style={S.t2}>BLOQUÉ</Text>
          <View style={S.connRow}>
            <View style={[S.connDot, { 
              backgroundColor: socketRef.current?.connected ? '#4caf50' : '#f44336' 
            }]} />
            <Text style={S.connTxt}>
              {socketRef.current?.connected ? 
                `Connecté (${socketRef.current.id?.slice(-4)})` : 
                'Connexion...'
              }
            </Text>
          </View>
        </View>

        <View style={S.card}>
          <Text style={S.lbl}>VOTRE NOM</Text>
          <TextInput style={S.inp} placeholder="Entrez votre nom"
            placeholderTextColor="#4a6e4e" value={playerName}
            onChangeText={(text) => {
              console.log('📝 Nom changé:', `"${text}"`);
              setPlayerName(text);
            }} 
            maxLength={16} />
        </View>

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

        <TouchableOpacity 
          style={[S.btnGold, !socketRef.current?.connected && S.btnDisabled]} 
          onPress={() => {
            console.log('\n🎯 === CLIC BOUTON CRÉER ===');
            console.log('🎯 Socket connecté:', socketRef.current?.connected);
            console.log('🎯 PlayerName:', `"${playerName}"`);
            createRoom();
          }}
          disabled={!socketRef.current?.connected}
        >
          <Text style={S.btnGoldTxt}>
            {socketRef.current?.connected ? 'Créer une salle privée' : 'Connexion...'}
          </Text>
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
          <TouchableOpacity 
            style={[S.btnOutline, { marginTop: 12 }, !socketRef.current?.connected && S.btnDisabled]} 
            onPress={joinRoom}
            disabled={!socketRef.current?.connected}
          >
            <Text style={S.btnOutlineTxt}>
              {socketRef.current?.connected ? 'Rejoindre' : 'Connexion...'}
            </Text>
          </TouchableOpacity>
        </View>

        {!!error && (
          <View style={S.errorBox}>
            <Text style={S.err}>❌ {error}</Text>
          </View>
        )}
        
        {__DEV__ && (
          <View style={S.debugCard}>
            <Text style={S.debugTitle}>🔧 DEBUG</Text>
            <Text style={S.debugText}>
              Socket: {socketRef.current?.connected ? '✅' : '❌'}
            </Text>
            <Text style={S.debugText}>
              ID: {socketRef.current?.id || 'Aucun'}
            </Text>
            <Text style={S.debugText}>
              Nom: "{playerName}" ({playerName.length})
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

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

  return (
    <View style={S.game}>
      <StatusBar hidden />

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

      <TopOpponent
        player={topPlayer}
        handCount={handCounts[topPlayer?.id]}
        isCurrentTurn={topPlayer?.id === currentTurn}
      />

      <View style={S.middleRow}>
        <SideOpponent
          player={leftPlayer}
          handCount={handCounts[leftPlayer?.id]}
          isCurrentTurn={leftPlayer?.id === currentTurn}
          side="left"
        />

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

        <SideOpponent
          player={rightPlayer}
          handCount={handCounts[rightPlayer?.id]}
          isCurrentTurn={rightPlayer?.id === currentTurn}
          side="right"
        />
      </View>

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

      {!!toast && (
        <View style={S.toast}><Text style={S.toastTxt}>{toast}</Text></View>
      )}

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

const S = StyleSheet.create({
  bg:          { flex: 1, backgroundColor: C.bg },
  lobbyScroll: { padding: 20, paddingBottom: 40, alignItems: 'center' },
  logoWrap:    { alignItems: 'center', marginBottom: 20, marginTop: 16 },
  t1: { fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: 4 },
  t2: { fontSize: 20, fontWeight: '700', color: C.gold, letterSpacing: 10, marginTop: 2 },
  connRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  connDot: { width: 8, height: 8, borderRadius: 4 },
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
  btnDisabled: { backgroundColor: C.goldDim, opacity: 0.5 },
  btnOutline:    { height: 48, borderWidth: 1, borderColor: C.gold, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  btnOutlineTxt: { fontSize: 15, fontWeight: '600', color: C.gold },
  divRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4, width: '100%', maxWidth: 400 },
  divLine: { flex: 1, height: 1, backgroundColor: C.border },
  divTxt:  { fontSize: 12, color: C.dim, letterSpacing: 2 },
  err:     { color: '#c0392b', fontSize: 13, marginTop: 4 },

  errorBox: {
    width: '100%', maxWidth: 400, backgroundColor: 'rgba(192,57,43,0.1)', 
    borderWidth: 1, borderColor: '#c0392b', borderRadius: 8, padding: 12, marginTop: 8
  },

  debugCard: { 
    width: '100%', maxWidth: 400, backgroundColor: 'rgba(0,0,0,0.7)', 
    borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 12, marginTop: 8 
  },
  debugTitle: { fontSize: 12, fontWeight: '700', color: '#fff', marginBottom: 4 },
  debugText: { fontSize: 10, color: '#ccc', marginBottom: 2 },

  wLbl:  { fontSize: 12, letterSpacing: 3, color: C.dim, fontWeight: '700' },
  wCode: { fontSize: 52, fontWeight: '900', color: C.gold, letterSpacing: 12 },
  wHint: { fontSize: 12, color: C.dim },
  slot:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(26,69,32,0.4)', borderWidth: 1, borderColor: C.border, borderRadius: 12, height: 50, paddingHorizontal: 16 },
  slotOn:{ borderColor: C.gold },
  av:    { width: 32, height: 32, borderRadius: 16, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  avTxt: { fontWeight: '700', fontSize: 14, color: '#1a1200' },
  pName: { fontWeight: '600', fontSize: 14, color: C.text, flex: 1 },
  tBadge:{ fontSize: 10, color: C.gold, fontWeight: '700', letterSpacing: 1 },
  spin:  { width: 20, height: 20, borderRadius: 10,
