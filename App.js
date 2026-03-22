import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Dimensions, SafeAreaView, StatusBar
} from 'react-native';
import { io } from 'socket.io-client';

const SERVER_URL = 'https://domino-bloque.onrender.com';
const { width, height } = Dimensions.get('window');

// ─── Patterns de points ───────────────────────────────────────────────────────
const PIP_PATTERNS = {
  0: [0,0,0, 0,0,0, 0,0,0],
  1: [0,0,0, 0,1,0, 0,0,0],
  2: [1,0,0, 0,0,0, 0,0,1],
  3: [1,0,0, 0,1,0, 0,0,1],
  4: [1,0,1, 0,0,0, 1,0,1],
  5: [1,0,1, 0,1,0, 1,0,1],
  6: [1,0,1, 1,0,1, 1,0,1],
};

// ─── Composant Pip Grid ───────────────────────────────────────────────────────
function PipGrid({ value, size = 20 }) {
  const pattern = PIP_PATTERNS[value] || PIP_PATTERNS[0];
  const pipSize = size * 0.22;
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignContent: 'space-between' }}>
      {pattern.map((p, i) => (
        <View key={i} style={{
          width: pipSize, height: pipSize, borderRadius: pipSize,
          backgroundColor: p ? '#1a1a1a' : 'transparent',
        }} />
      ))}
    </View>
  );
}

// ─── Composant Domino (main) ──────────────────────────────────────────────────
function DominoTile({ piece, selected, playable, isMyTurn, onPress, small = false }) {
  const w = small ? 32 : 40;
  const h = small ? 64 : 80;
  const pipSize = small ? 14 : 18;

  let borderColor = '#cccccc';
  if (selected) borderColor = '#c9a84c';
  else if (playable && isMyTurn) borderColor = '#6dbf6d';
  else if (!playable && isMyTurn) borderColor = '#cccccc';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.dominoTile, {
        width: w, height: h,
        borderColor,
        opacity: (!playable && isMyTurn) ? 0.4 : 1,
        transform: [{ translateY: selected ? -10 : 0 }],
      }]}
      activeOpacity={0.7}
    >
      <View style={styles.dominoHalf}>
        <PipGrid value={piece[0]} size={pipSize} />
      </View>
      <View style={styles.dominoDivider} />
      <View style={styles.dominoHalf}>
        <PipGrid value={piece[1]} size={pipSize} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Composant Domino (plateau) ───────────────────────────────────────────────
function BoardDomino({ piece }) {
  const w = 48;
  const h = 24;
  return (
    <View style={[styles.boardDomino, { width: w, height: h }]}>
      <View style={styles.boardHalf}>
        <PipGrid value={piece[0]} size={14} />
      </View>
      <View style={styles.boardDividerV} />
      <View style={styles.boardHalf}>
        <PipGrid value={piece[1]} size={14} />
      </View>
    </View>
  );
}

// ─── App principale ───────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('lobby'); // lobby | waiting | game
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [error, setError] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [me, setMe] = useState(null);
  const [myHand, setMyHand] = useState([]);
  const [board, setBoard] = useState([]);
  const [boardEnds, setBoardEnds] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [scores, setScores] = useState({ 0: 0, 1: 0 });
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [handCounts, setHandCounts] = useState({});
  const [pioireLeft, setPioireLeft] = useState(0);
  const [toast, setToast] = useState('');
  const [mancheResult, setMancheResult] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const socketRef = useRef(null);
  const boardScrollRef = useRef(null);

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('room_created', ({ code, player, players: pl }) => {
      setMe(player);
      setPlayers(pl);
      setRoomCode(code);
      setScreen('waiting');
    });

    socket.on('room_joined', ({ code, player, players: pl }) => {
      setMe(player);
      setPlayers(pl);
      setRoomCode(code);
      setScreen('waiting');
    });

    socket.on('player_joined', ({ players: pl }) => setPlayers(pl));

    socket.on('manche_start', ({ hand, currentTurn: ct, scores: sc, board: b, boardEnds: be }) => {
      setMyHand(hand);
      setCurrentTurn(ct);
      setScores(sc);
      setBoard(b || []);
      setBoardEnds(be);
      setSelectedIdx(null);
      setMancheResult(null);
      setGameOver(null);
      const hc = {};
      // init hand counts
      setHandCounts(prev => {
        const newHc = { ...prev };
        return newHc;
      });
      setScreen('game');
      if (ct === socket.id) showToast('🎯 Vous commencez !');
    });

    socket.on('piece_played', ({ playerId, piece, board: b, boardEnds: be, handCounts: hc }) => {
      setBoard(b);
      setBoardEnds(be);
      setHandCounts(hc);
      if (playerId !== socket.id) {
        showToast(`[${piece[0]}|${piece[1]}] posé`);
      }
    });

    socket.on('hand_update', ({ hand }) => {
      setMyHand(hand);
      setSelectedIdx(null);
    });

    socket.on('turn_change', ({ currentTurn: ct, skipped }) => {
      setCurrentTurn(ct);
      if (skipped && skipped.length > 0) showToast('Un joueur passe son tour');
    });

    socket.on('forced_pass', () => showToast('Vous passez votre tour'));

    socket.on('piece_drawn', ({ hand }) => {
      setMyHand(hand);
      showToast('Vous avez pioché une pièce');
    });

    socket.on('draw_happened', ({ handCounts: hc, pioireLeft: pl }) => {
      setHandCounts(hc);
      setPioireLeft(pl);
    });

    socket.on('manche_end', ({ winTeam, points, scores: sc, hands }) => {
      setScores(sc);
      setMancheResult({ winTeam, points, scores: sc });
    });

    socket.on('game_over', ({ winTeam, scores: sc }) => {
      setScores(sc);
      setGameOver({ winTeam, scores: sc });
    });

    socket.on('player_left', ({ players: pl, msg }) => {
      setPlayers(pl);
      showToast(msg);
    });

    socket.on('error', ({ msg }) => setError(msg));

    return () => socket.disconnect();
  }, []);

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
    if (!joinCode.trim()) return setError('Entrez un code');
    setError('');
    socketRef.current.emit('join_room', { name: playerName.trim(), code: joinCode.trim().toUpperCase() });
  }

  function canPlayPiece(piece) {
    if (!boardEnds) return true;
    return piece[0] === boardEnds.left || piece[1] === boardEnds.left ||
           piece[0] === boardEnds.right || piece[1] === boardEnds.right;
  }

  function playPiece(side) {
    if (selectedIdx === null) return;
    const piece = myHand[selectedIdx];
    socketRef.current.emit('play_piece', { code: roomCode, piece, side });
    setSelectedIdx(null);
  }

  function drawPiece() {
    socketRef.current.emit('draw_piece', { code: roomCode });
  }

  const isMyTurn = socketRef.current && currentTurn === socketRef.current.id;
  const hasPlayable = myHand.some(p => canPlayPiece(p));

  function getTeamName(teamIdx) {
    return players.filter(p => p.team === teamIdx).map(p => p.name).join(' & ') || `Équipe ${teamIdx + 1}`;
  }

  // ─── LOBBY ──────────────────────────────────────────────────────────────────
  if (screen === 'lobby') {
    return (
      <SafeAreaView style={styles.lobbyContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f1f0f" />
        <ScrollView contentContainerStyle={styles.lobbyScroll} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoArea}>
            <View style={styles.dominoIcon}>
              <PipGrid value={3} size={28} />
              <View style={styles.iconDivider} />
              <PipGrid value={6} size={28} />
            </View>
            <Text style={styles.titleMain}>DOMINO</Text>
            <Text style={styles.titleSub}>BLOQUÉ</Text>
            <View style={styles.statusDot}>
              <View style={styles.greenDot} />
              <Text style={styles.statusText}>Connecté</Text>
            </View>
          </View>

          {/* Nom */}
          <View style={styles.card}>
            <Text style={styles.label}>VOTRE NOM</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez votre nom"
              placeholderTextColor="#4a6e4e"
              value={playerName}
              onChangeText={setPlayerName}
              maxLength={16}
            />
          </View>

          {/* Mode */}
          <View style={styles.card}>
            <Text style={styles.label}>NOMBRE DE JOUEURS</Text>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeBtn, maxPlayers === 2 && styles.modeBtnActive]}
                onPress={() => setMaxPlayers(2)}
              >
                <Text style={[styles.modeBtnText, maxPlayers === 2 && styles.modeBtnTextActive]}>2 Joueurs</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, maxPlayers === 4 && styles.modeBtnActive]}
                onPress={() => setMaxPlayers(4)}
              >
                <Text style={[styles.modeBtnText, maxPlayers === 4 && styles.modeBtnTextActive]}>4 Joueurs</Text>
                <Text style={styles.modeBtnSub}>Équipes</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.btnPrimary} onPress={createRoom}>
            <Text style={styles.btnPrimaryText}>Créer une salle privée</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>CODE DE LA SALLE</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: ABC123"
              placeholderTextColor="#4a6e4e"
              value={joinCode}
              onChangeText={t => setJoinCode(t.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={[styles.btnOutline, { marginTop: 12 }]} onPress={joinRoom}>
              <Text style={styles.btnOutlineText}>Rejoindre</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorMsg}>{error}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── WAITING ────────────────────────────────────────────────────────────────
  if (screen === 'waiting') {
    return (
      <SafeAreaView style={styles.waitingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f1f0f" />
        <Text style={styles.waitingLabel}>CODE DE LA SALLE</Text>
        <Text style={styles.codeDisplay}>{roomCode}</Text>
        <Text style={styles.waitingHint}>Partagez ce code avec vos amis</Text>

        <View style={styles.playersList}>
          {Array.from({ length: maxPlayers }).map((_, i) => {
            const p = players[i];
            return (
              <View key={i} style={[styles.playerSlot, p && styles.playerSlotFilled]}>
                {p ? (
                  <>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{p.name[0].toUpperCase()}</Text>
                    </View>
                    <Text style={styles.playerName}>{p.name}{p.id === socketRef.current?.id ? ' (vous)' : ''}</Text>
                    {maxPlayers === 4 && <Text style={styles.teamBadge}>ÉQ. {p.team + 1}</Text>}
                  </>
                ) : (
                  <>
                    <View style={styles.spinner} />
                    <Text style={styles.waitingText}>En attente…</Text>
                  </>
                )}
              </View>
            );
          })}
        </View>
        <Text style={styles.waitingCount}>{players.length}/{maxPlayers} joueurs</Text>
      </SafeAreaView>
    );
  }

  // ─── GAME ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.gameContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0a140a" />

      {/* Scores */}
      <View style={styles.gameHeader}>
        <View style={styles.scoreTeam}>
          <Text style={styles.scoreName}>{getTeamName(0)}</Text>
          <Text style={styles.scoreVal}>{scores[0]}</Text>
        </View>
        <Text style={styles.scoreSep}>·</Text>
        <View style={styles.scoreTeam}>
          <Text style={styles.scoreName}>{getTeamName(1)}</Text>
          <Text style={styles.scoreVal}>{scores[1]}</Text>
        </View>
      </View>

      {/* Adversaires */}
      <View style={styles.opponentsRow}>
        {players.filter(p => p.id !== socketRef.current?.id).map(p => (
          <View key={p.id} style={styles.oppPlayer}>
            {p.id === currentTurn && <View style={styles.turnDot} />}
            <Text style={styles.oppName}>{p.name}{maxPlayers === 4 && p.team === me?.team ? ' 🤝' : ''}</Text>
            <Text style={styles.oppCount}>{handCounts[p.id] ?? 7} pièces</Text>
          </View>
        ))}
      </View>

      {/* Message de tour */}
      <Text style={[styles.turnMsg, { color: isMyTurn ? '#c9a84c' : '#8aad8e' }]}>
        {isMyTurn ? '🎯 C\'EST VOTRE TOUR' : `Tour de ${players.find(x => x.id === currentTurn)?.name || '…'}`}
      </Text>

      {/* Plateau */}
      <ScrollView
        ref={boardScrollRef}
        horizontal
        style={styles.boardScroll}
        contentContainerStyle={styles.boardInner}
        showsHorizontalScrollIndicator={false}
        onContentSizeChange={() => boardScrollRef.current?.scrollToEnd({ animated: true })}
      >
        {board.map((item, i) => (
          <BoardDomino key={i} piece={item.piece} />
        ))}
        {board.length === 0 && (
          <Text style={styles.boardEmpty}>Le plateau est vide</Text>
        )}
      </ScrollView>

      {/* Main */}
      <View style={styles.handArea}>
        <Text style={styles.handLabel}>VOTRE MAIN</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.handScroll}>
          {myHand.map((piece, i) => (
            <DominoTile
              key={i}
              piece={piece}
              selected={selectedIdx === i}
              playable={canPlayPiece(piece)}
              isMyTurn={isMyTurn}
              onPress={() => {
                if (!isMyTurn) return showToast("Ce n'est pas votre tour");
                if (!canPlayPiece(piece)) return showToast("Pièce non jouable");
                setSelectedIdx(selectedIdx === i ? null : i);
              }}
            />
          ))}
        </ScrollView>

        {/* Boutons */}
        <View style={styles.controls}>
          {isMyTurn && selectedIdx !== null && boardEnds && (
            <>
              <TouchableOpacity style={styles.btnLeft} onPress={() => playPiece('left')}>
                <Text style={styles.btnPlayText}>◀ [{boardEnds.left}]</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnRight} onPress={() => playPiece('right')}>
                <Text style={styles.btnPlayText}>[{boardEnds.right}] ▶</Text>
              </TouchableOpacity>
            </>
          )}
          {isMyTurn && selectedIdx !== null && !boardEnds && (
            <TouchableOpacity style={styles.btnRight} onPress={() => playPiece('right')}>
              <Text style={styles.btnPlayText}>▶ Jouer</Text>
            </TouchableOpacity>
          )}
          {isMyTurn && !hasPlayable && maxPlayers === 2 && pioireLeft > 0 && (
            <TouchableOpacity style={styles.btnDraw} onPress={drawPiece}>
              <Text style={styles.btnPlayText}>🂠 Piocher ({pioireLeft})</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Toast */}
      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      {/* Overlay fin de manche */}
      {mancheResult && !gameOver && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <Text style={styles.overlayTitle}>
              {mancheResult.winTeam === me?.team ? '🎉 Votre équipe gagne !' : mancheResult.winTeam === -1 ? 'Égalité !' : '😔 Équipe adverse gagne'}
            </Text>
            <Text style={styles.overlayPoints}>+{mancheResult.points} points</Text>
            <View style={styles.overlayScores}>
              <View style={styles.ovTeam}>
                <Text style={styles.ovTeamName}>{getTeamName(0)}</Text>
                <Text style={styles.ovTeamVal}>{mancheResult.scores[0]}</Text>
              </View>
              <View style={styles.ovTeam}>
                <Text style={styles.ovTeamName}>{getTeamName(1)}</Text>
                <Text style={styles.ovTeamVal}>{mancheResult.scores[1]}</Text>
              </View>
            </View>
            <Text style={styles.overlayHint}>Prochaine manche dans quelques secondes…</Text>
          </View>
        </View>
      )}

      {/* Overlay fin de partie */}
      {gameOver && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <Text style={styles.overlayTitle}>
              {gameOver.winTeam === me?.team ? '🏆 VICTOIRE !' : '💀 DÉFAITE'}
            </Text>
            <Text style={styles.overlayPoints}>
              {gameOver.winTeam === me?.team ? 'Félicitations !' : "L'équipe adverse a gagné"}
            </Text>
            <View style={styles.overlayScores}>
              <View style={styles.ovTeam}>
                <Text style={styles.ovTeamName}>{getTeamName(0)}</Text>
                <Text style={styles.ovTeamVal}>{gameOver.scores[0]}</Text>
              </View>
              <View style={styles.ovTeam}>
                <Text style={styles.ovTeamName}>{getTeamName(1)}</Text>
                <Text style={styles.ovTeamVal}>{gameOver.scores[1]}</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.btnPrimary, { marginTop: 16 }]} onPress={() => setScreen('lobby')}>
              <Text style={styles.btnPrimaryText}>Nouvelle partie</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#0f1f0f', felt: '#163a1c', felt2: '#1a4520',
  gold: '#c9a84c', gold2: '#e8c96d', border: '#2e5c34',
  text: '#e8e0cc', dim: '#8aad8e', domino: '#f5f0e8', dot: '#1a1a1a',
};

const styles = StyleSheet.create({
  // LOBBY
  lobbyContainer: { flex: 1, backgroundColor: C.bg },
  lobbyScroll: { padding: 20, paddingBottom: 40, alignItems: 'center' },
  logoArea: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  dominoIcon: {
    width: 48, height: 90, backgroundColor: C.domino,
    borderRadius: 8, borderWidth: 2, borderColor: '#ccc',
    alignItems: 'center', justifyContent: 'space-around',
    padding: 8, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8,
    elevation: 8,
  },
  iconDivider: { width: '80%', height: 1.5, backgroundColor: '#aaa' },
  titleMain: { fontFamily: undefined, fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  titleSub: { fontSize: 20, fontWeight: '700', color: C.gold, letterSpacing: 8, marginTop: 2 },
  statusDot: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4caf50' },
  statusText: { fontSize: 12, color: C.dim },
  card: {
    width: '100%', maxWidth: 400,
    backgroundColor: 'rgba(26,69,32,0.5)',
    borderWidth: 1, borderColor: C.border, borderRadius: 16,
    padding: 16, marginBottom: 12,
  },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 2, color: C.dim, marginBottom: 8, textTransform: 'uppercase' },
  input: {
    height: 48, backgroundColor: 'rgba(15,40,18,0.8)',
    borderWidth: 1, borderColor: C.border, borderRadius: 10,
    color: C.text, fontSize: 15, paddingHorizontal: 16,
  },
  modeRow: { flexDirection: 'row', gap: 10 },
  modeBtn: {
    flex: 1, height: 60, backgroundColor: 'rgba(15,40,18,0.6)',
    borderWidth: 2, borderColor: C.border, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  modeBtnActive: { borderColor: C.gold, backgroundColor: 'rgba(201,168,76,0.15)' },
  modeBtnText: { fontSize: 14, fontWeight: '700', color: C.dim },
  modeBtnTextActive: { color: C.text },
  modeBtnSub: { fontSize: 10, color: C.gold, fontWeight: '600', letterSpacing: 1 },
  btnPrimary: {
    width: '100%', maxWidth: 400, height: 48,
    backgroundColor: C.gold, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    shadowColor: C.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#1a1200', letterSpacing: 1 },
  btnOutline: {
    height: 48, borderWidth: 1, borderColor: C.gold, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  btnOutlineText: { fontSize: 15, fontWeight: '600', color: C.gold },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4, width: '100%', maxWidth: 400 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { fontSize: 12, color: C.dim, letterSpacing: 2 },
  errorMsg: { color: '#c0392b', fontSize: 13, marginTop: 4 },

  // WAITING
  waitingContainer: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 },
  waitingLabel: { fontSize: 12, letterSpacing: 3, color: C.dim, fontWeight: '700' },
  codeDisplay: { fontSize: 52, fontWeight: '900', color: C.gold, letterSpacing: 12 },
  waitingHint: { fontSize: 12, color: C.dim, marginBottom: 8 },
  playersList: { width: '100%', maxWidth: 360, gap: 10 },
  playerSlot: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(26,69,32,0.4)',
    borderWidth: 1, borderColor: C.border, borderRadius: 12, height: 50, paddingHorizontal: 16,
  },
  playerSlotFilled: { borderColor: C.gold },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontWeight: '700', fontSize: 14, color: '#1a1200' },
  playerName: { fontWeight: '600', fontSize: 14, color: C.text, flex: 1 },
  teamBadge: { fontSize: 10, color: C.gold, fontWeight: '700', letterSpacing: 1 },
  spinner: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border, borderTopColor: C.gold },
  waitingText: { color: C.dim, fontSize: 13 },
  waitingCount: { fontSize: 13, color: C.dim },

  // GAME
  gameContainer: { flex: 1, backgroundColor: C.felt },
  gameHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: 'rgba(10,20,10,0.7)',
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  scoreTeam: { flex: 1, alignItems: 'center' },
  scoreName: { fontSize: 10, letterSpacing: 1.5, color: C.dim, fontWeight: '600' },
  scoreVal: { fontSize: 28, fontWeight: '900', color: C.gold, lineHeight: 32 },
  scoreSep: { fontSize: 22, color: C.border },
  opponentsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 6, paddingHorizontal: 12 },
  oppPlayer: { alignItems: 'center', gap: 2 },
  oppName: { fontSize: 11, color: C.dim, fontWeight: '600' },
  oppCount: { fontSize: 13, fontWeight: '700', color: C.text },
  turnDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.gold, position: 'absolute', top: -4 },
  turnMsg: { textAlign: 'center', fontSize: 12, letterSpacing: 1.5, fontWeight: '600', paddingVertical: 4 },
  boardScroll: { flex: 1, backgroundColor: 'transparent' },
  boardInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 3, minWidth: '100%' },
  boardEmpty: { color: C.dim, fontSize: 13, letterSpacing: 1, opacity: 0.5 },

  // Domino plateau
  boardDomino: {
    backgroundColor: C.domino, borderRadius: 4,
    borderWidth: 1.5, borderColor: '#bbb',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4,
  },
  boardHalf: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  boardDividerV: { width: 1.5, height: '60%', backgroundColor: '#aaa' },

  // Domino main
  dominoTile: {
    backgroundColor: C.domino, borderRadius: 8,
    borderWidth: 2, flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 6,
    paddingVertical: 4,
  },
  dominoHalf: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  dominoDivider: { width: '70%', height: 1.5, backgroundColor: '#aaa', marginVertical: 2 },

  // Hand area
  handArea: {
    backgroundColor: 'rgba(10,20,10,0.6)',
    borderTopWidth: 1, borderTopColor: C.border,
    paddingTop: 8, paddingBottom: 12,
  },
  handLabel: { fontSize: 10, letterSpacing: 2, color: C.dim, fontWeight: '600', textAlign: 'center', marginBottom: 6 },
  handScroll: { paddingHorizontal: 8, paddingVertical: 4, gap: 4, minHeight: 90 },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8 },
  btnLeft: {
    flex: 1, maxWidth: 140, height: 38,
    backgroundColor: C.gold, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  btnRight: {
    flex: 1, maxWidth: 140, height: 38,
    backgroundColor: C.gold, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  btnDraw: {
    flex: 1, maxWidth: 160, height: 38,
    backgroundColor: '#2e7d32', borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  btnPlayText: { fontSize: 13, fontWeight: '700', color: '#1a1200' },

  // Toast
  toast: {
    position: 'absolute', bottom: 120, alignSelf: 'center',
    backgroundColor: 'rgba(26,69,32,0.95)',
    borderWidth: 1, borderColor: C.gold,
    borderRadius: 20, paddingVertical: 10, paddingHorizontal: 20,
  },
  toastText: { fontSize: 13, fontWeight: '600', color: C.text },

  // Overlay
  overlay: {
    position: 'absolute', inset: 0, top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  overlayCard: {
    backgroundColor: C.felt, borderWidth: 1, borderColor: C.gold,
    borderRadius: 20, padding: 28, width: '100%', maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.8, shadowRadius: 30, elevation: 20,
  },
  overlayTitle: { fontSize: 24, fontWeight: '900', color: C.gold, marginBottom: 6, textAlign: 'center' },
  overlayPoints: { fontSize: 14, color: C.dim, marginBottom: 16 },
  overlayScores: { flexDirection: 'row', gap: 40, marginBottom: 16 },
  ovTeam: { alignItems: 'center' },
  ovTeamName: { fontSize: 11, letterSpacing: 1.5, color: C.dim, marginBottom: 4 },
  ovTeamVal: { fontSize: 40, fontWeight: '900', color: C.gold, lineHeight: 44 },
  overlayHint: { fontSize: 12, color: C.dim, textAlign: 'center' },
});
