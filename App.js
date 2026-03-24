import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Dimensions, StatusBar, ScrollView
} from 'react-native';
import { io } from 'socket.io-client';

const SERVER_URL = 'https://domino-bloque.onrender.com';
const { width, height } = Dimensions.get('window');

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:     '#0f1f0f',
  felt:   '#163a1c',
  gold:   '#c9a84c',
  border: '#2e5c34',
  text:   '#e8e0cc',
  dim:    '#8aad8e',
  domino: '#f5f2ec',
  dot:    '#1a1a2e',
  red:    '#e05c5c',
  green:  '#5cb85c',
};

// ── Points ────────────────────────────────────────────────────────────────────
// ── Positions des points (proportionnelles) ─────────────────────────────────
const DOT_POSITIONS = {
  0: [],
  1: [[0.5,  0.5]],
  2: [[0.25, 0.25], [0.75, 0.75]],
  3: [[0.25, 0.25], [0.5,  0.5],  [0.75, 0.75]],
  4: [[0.25, 0.25], [0.25, 0.75], [0.75, 0.25], [0.75, 0.75]],
  5: [[0.25, 0.25], [0.25, 0.75], [0.5,  0.5],  [0.75, 0.25], [0.75, 0.75]],
  6: [[0.25, 0.17], [0.25, 0.5],  [0.25, 0.83], [0.75, 0.17], [0.75, 0.5],  [0.75, 0.83]],
};

function renderDots(num, areaW, areaH) {
  const positions = DOT_POSITIONS[num] || [];
  const dotR = Math.max(2.5, Math.min(areaW, areaH) * 0.1);
  return positions.map(([px, py], i) => (
    <View key={i} style={{
      position: 'absolute',
      width: dotR * 2, height: dotR * 2,
      borderRadius: dotR,
      backgroundColor: '#1a1a2e',
      left: px * areaW - dotR,
      top:  py * areaH - dotR,
    }} />
  ));
}

// ── Composant Domino ──────────────────────────────────────────────────────────
function DominoFace({ a, b, w, h, vertical, borderColor='#ccc', borderWidth=1.5, extraStyle={} }) {
  const radius = Math.max(6, Math.min(w, h) * 0.15);
  const areaW  = vertical ? w      : w / 2;
  const areaH  = vertical ? h / 2  : h;
  return (
    <View style={[{
      width: w, height: h,
      backgroundColor: '#ffffff',
      borderRadius: radius,
      borderWidth, borderColor,
      flexDirection: vertical ? 'column' : 'row',
      overflow: 'hidden', position: 'relative',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 0.3, shadowRadius: 3,
    }, extraStyle]}>
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
        backgroundColor: 'rgba(255,255,255,0.45)',
        borderTopLeftRadius: radius, borderTopRightRadius: radius,
      }} />
      <View style={{ width: areaW, height: areaH, position: 'relative' }}>
        {renderDots(a, areaW, areaH)}
      </View>
      {vertical
        ? <View style={{ width: '80%', height: 1.5, backgroundColor: '#888', alignSelf: 'center' }} />
        : <View style={{ width: 1.5, height: '80%', backgroundColor: '#888', alignSelf: 'center' }} />
      }
      <View style={{ width: areaW, height: areaH, position: 'relative' }}>
        {renderDots(b, areaW, areaH)}
      </View>
    </View>
  );
}

// ── Tailles domino main ───────────────────────────────────────────────────────
const HPAD = 8;
const HGAP = 5;
const HDW  = Math.floor((width - HPAD * 2 - HGAP * 6) / 7);
const HDH  = Math.floor(HDW * 1.9);

// ── Domino dans la main ───────────────────────────────────────────────────────
function HandDomino({ piece, playable, isMyTurn, selected, onPress }) {
  const bc = selected ? C.gold : (playable && isMyTurn) ? C.green : '#ccc';
  const bw = selected ? 3 : (playable && isMyTurn) ? 2 : 1.5;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <DominoFace
        a={piece[0]} b={piece[1]}
        w={HDW} h={HDH}
        vertical={true}
        borderColor={bc} borderWidth={bw}
        extraStyle={{
          opacity: (!playable && isMyTurn) ? 0.28 : 1,
          transform: [{ translateY: selected ? -14 : 0 }],
          elevation: selected ? 14 : 5,
          backgroundColor: selected ? '#fffaf0' : C.domino,
          shadowColor: selected ? C.gold : '#000',
          shadowOpacity: selected ? 0.6 : 0.25,
          shadowRadius: selected ? 10 : 4,
        }}
      />
    </TouchableOpacity>
  );
}

// ── Domino pioche (dos) ───────────────────────────────────────────────────────
function PiocheDomino({ onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <View style={{
        width: HDW, height: HDH,
        backgroundColor: '#1a3d20',
        borderRadius: Math.max(4, HDW * 0.12),
        borderWidth: 2, borderColor: C.gold,
        alignItems: 'center', justifyContent: 'center',
        elevation: 4,
      }}>
        <View style={{
          width: HDW * 0.55, height: HDH * 0.55,
          borderRadius: 5, borderWidth: 1.5,
          borderColor: 'rgba(201,168,76,0.35)',
        }} />
        <Text style={{ color: C.gold, fontSize: 7, marginTop: 4, letterSpacing: 1 }}>PIOCHER</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Domino caché adversaire ───────────────────────────────────────────────────
function HiddenDomino({ w = 14, h = 26 }) {
  return (
    <View style={{
      width: w, height: h,
      backgroundColor: '#1a3d20',
      borderRadius: 3, borderWidth: 1, borderColor: '#2e6e36',
      marginVertical: 1,
    }} />
  );
}

// ── Le serveur calcule x,y,rotation pour chaque domino ───────────────────────
// Le client affiche simplement chaque domino à sa position
// Coordonnées serveur : 0-1000 (relatives)
// On les convertit en pixels selon la taille réelle du plateau

function scalePos(val, serverSize, clientSize) {
  return (val / serverSize) * clientSize;
}

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

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('room_created',  ({ code, player, players: pl }) => {
      setMe(player); setPlayers(pl); setRoomCode(code); setScreen('waiting');
    });
    socket.on('room_joined',   ({ code, player, players: pl }) => {
      setMe(player); setPlayers(pl); setRoomCode(code); setScreen('waiting');
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
    if (!isMyTurn) return showToast("Ce n'est pas votre tour");
    const piece = myHand[idx];
    if (!canPlay(piece)) return showToast('Pièce non jouable');

    if (!boardEnds) {
      // Premier coup → sélectionner pour afficher la zone centrale
      setSelectedIdx(selectedIdx === idx ? null : idx);
      return;
    }

    const left  = canPlayLeft(piece);
    const right = canPlayRight(piece);

    if (left && !right) {
      // Un seul côté possible → jouer directement
      socketRef.current.emit('play_piece', { code: roomCode, piece, side: 'left' });
      return;
    }
    if (right && !left) {
      socketRef.current.emit('play_piece', { code: roomCode, piece, side: 'right' });
      return;
    }
    // Les deux côtés possibles → sélectionner
    setSelectedIdx(selectedIdx === idx ? null : idx);
  }

  function playSide(side) {
    if (selectedIdx === null) return;
    socketRef.current.emit('play_piece', { code: roomCode, piece: myHand[selectedIdx], side });
    setSelectedIdx(null);
  }

  function drawPiece() {
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

  const selPiece      = selectedIdx !== null ? myHand[selectedIdx] : null;
  const showLeft      = isMyTurn && selPiece && board.length > 0 && canPlayLeft(selPiece);
  const showRight     = isMyTurn && selPiece && board.length > 0 && canPlayRight(selPiece);
  const showCenter    = isMyTurn && selPiece && board.length === 0;

  // ── LOBBY ──────────────────────────────────────────────────────────────────
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

  // ── WAITING ────────────────────────────────────────────────────────────────
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

  // ── GAME ───────────────────────────────────────────────────────────────────
  return (
    <View style={S.game}>
      <StatusBar hidden />

      {/* SCORES */}
      <View style={S.header}>
        <View style={S.scoreBox}>
          <Text style={S.sLbl}>NOUS</Text>
          <Text style={S.sVal}>{scores[me?.team ?? 0]}<Text style={S.sMax}>/100</Text></Text>
        </View>
        <Text style={S.sX}>✕</Text>
        <View style={S.scoreBox}>
          <Text style={[S.sLbl, { color: C.red }]}>RIVAUX</Text>
          <Text style={[S.sVal, { color: C.red }]}>{scores[me?.team === 0 ? 1 : 0]}<Text style={S.sMax}>/100</Text></Text>
        </View>
      </View>

      {/* ADVERSAIRE HAUT */}
      {topPlayer && (
        <View style={S.topOpp}>
          <View style={S.oppAv}>
            <Text style={S.oppAvTxt}>{topPlayer.name[0].toUpperCase()}</Text>
            {topPlayer.id === currentTurn && <View style={S.turnRing} />}
          </View>
          <Text style={S.oppLbl}>{handCounts[topPlayer.id] ?? 7} dominos</Text>
          <View style={{ flexDirection: 'row', gap: 3, marginTop: 3 }}>
            {Array.from({ length: Math.min(handCounts[topPlayer.id] ?? 7, 7) }).map((_, i) => (
              <HiddenDomino key={i} w={18} h={9} />
            ))}
          </View>
        </View>
      )}

      {/* MILIEU : côtés + plateau */}
      <View style={S.middleRow}>

        {/* GAUCHE */}
        {leftPlayer ? (
          <View style={S.sideOpp}>
            <View style={S.sideAv}>
              <Text style={S.sideAvTxt}>{leftPlayer.name[0].toUpperCase()}</Text>
              {leftPlayer.id === currentTurn && <View style={S.turnRing} />}
            </View>
            <Text style={S.sideLbl}>{handCounts[leftPlayer.id] ?? 7}{'\n'}dom.</Text>
            {Array.from({ length: Math.min(handCounts[leftPlayer.id] ?? 7, 7) }).map((_, i) => (
              <HiddenDomino key={i} />
            ))}
          </View>
        ) : <View style={{ width: 36 }} />}

        {/* PLATEAU */}
        <View
          style={S.boardArea}
          onLayout={e => {
            const { width: w, height: h } = e.nativeEvent.layout;
            setBoardSize({ w, h });
            if (socketRef.current && roomCode) {
              socketRef.current.emit('board_size', { code: roomCode, width: 1000, height: 600 });
            }
          }}
        >
          {/* Dominos */}
          {board.map((tile, i) => {
            const scX = boardSize.w > 0 ? boardSize.w / 1000 : 1;
            const scY = boardSize.h > 0 ? boardSize.h / 600  : 1;
            const px  = (tile.x || 0) * scX;
            const py  = (tile.y || 0) * scY;
            const tw  = tile.w ? tile.w * scX : (tile.vertical ? 28 * scX : 56 * scX);
            const th  = tile.h ? tile.h * scY : (tile.vertical ? 56 * scY : 28 * scY);
            return (
              <View key={i} style={{
                position: 'absolute',
                left: px, top: py,
                transform: tile.rotation ? [{ rotate: `${tile.rotation}deg` }] : [],
              }}>
                <DominoFace
                  a={tile.a ?? tile[0]} b={tile.b ?? tile[1]}
                  w={tw} h={th}
                  vertical={tile.vertical ?? true}
                  borderColor="#ccc" borderWidth={1.2}
                />
              </View>
            );
          })}

          {/* Plateau vide */}
          {board.length === 0 && !selPiece && (
            <View style={S.emptyBoard}>
              <Text style={S.emptyTxt}>{'Appuyez sur un domino\npuis posez-le ici'}</Text>
            </View>
          )}

          {/* Zone centre (1er coup) */}
          {showCenter && (
            <TouchableOpacity style={S.zoneAll} onPress={() => playSide('right')} activeOpacity={0.75}>
              <Text style={S.zoneCenterTxt}>✓ Poser ici</Text>
            </TouchableOpacity>
          )}

          {/* Zones gauche / droite */}
          {(showLeft || showRight) && (
            <>
              {showLeft && (
                <TouchableOpacity style={S.zoneLeft} onPress={() => playSide('left')} activeOpacity={0.75}>
                  <Text style={S.zoneArrow}>◀</Text>
                  <Text style={S.zoneNum}>{boardEnds?.left}</Text>
                </TouchableOpacity>
              )}
              {showRight && (
                <TouchableOpacity style={S.zoneRight} onPress={() => playSide('right')} activeOpacity={0.75}>
                  <Text style={S.zoneNum}>{boardEnds?.right}</Text>
                  <Text style={S.zoneArrow}>▶</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* DROITE */}
        {rightPlayer ? (
          <View style={S.sideOpp}>
            {Array.from({ length: Math.min(handCounts[rightPlayer.id] ?? 7, 7) }).map((_, i) => (
              <HiddenDomino key={i} />
            ))}
            <Text style={S.sideLbl}>{handCounts[rightPlayer.id] ?? 7}{'\n'}dom.</Text>
            <View style={S.sideAv}>
              <Text style={S.sideAvTxt}>{rightPlayer.name[0].toUpperCase()}</Text>
              {rightPlayer.id === currentTurn && <View style={S.turnRing} />}
            </View>
          </View>
        ) : <View style={{ width: 36 }} />}
      </View>

      {/* MAIN */}
      <View style={S.handArea}>
        <View style={S.handHeader}>
          <View style={S.myAv}>
            <Text style={S.myAvTxt}>{me?.name?.[0]?.toUpperCase() || 'M'}</Text>
            {isMyTurn && <View style={S.turnRing} />}
          </View>
          <Text style={S.handInfo} numberOfLines={1}>
            {needToDraw
              ? '🂠 Pioche un domino'
              : isMyTurn
                ? selectedIdx !== null ? 'Choisissez un côté ⬆' : '🎯 Appuyez sur un domino'
                : `Tour de ${players.find(x => x.id === currentTurn)?.name || '…'}`}
          </Text>
          {selectedIdx !== null && (
            <TouchableOpacity style={S.btnCancel} onPress={() => setSelectedIdx(null)}>
              <Text style={S.btnCancelTxt}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={S.handRow}>
          {myHand.map((piece, i) => (
            <HandDomino
              key={`${i}-${piece[0]}-${piece[1]}`}
              piece={piece}
              playable={canPlay(piece)}
              isMyTurn={isMyTurn && !needToDraw}
              selected={selectedIdx === i}
              onPress={() => handleSelect(i)}
            />
          ))}
          {needToDraw && Array.from({ length: Math.min(pioireLeft, 3) }).map((_, i) => (
            <PiocheDomino key={`pioche-${i}`} onPress={drawPiece} />
          ))}
        </View>
      </View>

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

// ── STYLES ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
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
  wLbl:  { fontSize: 12, letterSpacing: 3, color: C.dim, fontWeight: '700' },
  wCode: { fontSize: 52, fontWeight: '900', color: C.gold, letterSpacing: 12 },
  wHint: { fontSize: 12, color: C.dim },
  slot:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(26,69,32,0.4)', borderWidth: 1, borderColor: C.border, borderRadius: 12, height: 50, paddingHorizontal: 16 },
  slotOn: { borderColor: C.gold },
  av:    { width: 32, height: 32, borderRadius: 16, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  avTxt: { fontWeight: '700', fontSize: 14, color: '#1a1200' },
  pName: { fontWeight: '600', fontSize: 14, color: C.text, flex: 1 },
  tBadge: { fontSize: 10, color: C.gold, fontWeight: '700', letterSpacing: 1 },
  spin:  { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border, borderTopColor: C.gold },
  wTxt:  { color: C.dim, fontSize: 13 },

  game:   { flex: 1, backgroundColor: C.felt },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, backgroundColor: 'rgba(8,18,8,0.88)', borderBottomWidth: 1, borderBottomColor: C.border },
  scoreBox: { flex: 1, alignItems: 'center' },
  sLbl: { fontSize: 13, fontWeight: '800', color: C.gold, letterSpacing: 2 },
  sVal: { fontSize: 26, fontWeight: '900', color: C.gold },
  sMax: { fontSize: 14, color: C.dim },
  sX:   { fontSize: 22, color: C.gold, paddingHorizontal: 10 },

  topOpp:   { alignItems: 'center', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(46,92,52,0.3)' },
  oppAv:    { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(201,168,76,0.2)', borderWidth: 2, borderColor: C.gold, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  oppAvTxt: { fontSize: 12, fontWeight: '700', color: C.gold },
  oppLbl:   { fontSize: 10, color: C.dim, marginTop: 2 },
  turnRing: { position: 'absolute', top: -3, left: -3, right: -3, bottom: -3, borderRadius: 999, borderWidth: 2.5, borderColor: C.gold },

  middleRow: { flex: 1, flexDirection: 'row' },
  sideOpp:   { width: 40, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 6, backgroundColor: 'rgba(8,18,8,0.15)' },
  sideAv:    { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(201,168,76,0.2)', borderWidth: 1.5, borderColor: C.gold, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  sideAvTxt: { fontSize: 10, fontWeight: '700', color: C.gold },
  sideLbl:   { fontSize: 8, color: C.dim, textAlign: 'center' },

  boardArea: { flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: 'rgba(18,52,22,0.35)', margin: 4, borderRadius: 8 },
  emptyBoard: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTxt:   { color: C.dim, fontSize: 12, textAlign: 'center', opacity: 0.55, lineHeight: 20 },

  zoneAll:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(201,168,76,0.15)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  zoneCenterTxt: { fontSize: 20, fontWeight: '900', color: C.gold },
  zoneLeft:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: '38%', backgroundColor: 'rgba(201,168,76,0.18)', borderRightWidth: 1, borderRightColor: 'rgba(201,168,76,0.4)', alignItems: 'center', justifyContent: 'center', gap: 4, zIndex: 10 },
  zoneRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '38%', backgroundColor: 'rgba(201,168,76,0.18)', borderLeftWidth: 1, borderLeftColor: 'rgba(201,168,76,0.4)', alignItems: 'center', justifyContent: 'center', gap: 4, zIndex: 10 },
  zoneArrow: { fontSize: 22, fontWeight: '900', color: C.gold },
  zoneNum:   { fontSize: 26, fontWeight: '900', color: C.gold },

  handArea:   { backgroundColor: 'rgba(8,16,8,0.9)', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8, paddingBottom: 14 },
  handHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, marginBottom: 8 },
  myAv:       { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(201,168,76,0.25)', borderWidth: 2, borderColor: C.gold, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  myAvTxt:    { fontSize: 12, fontWeight: '700', color: C.gold },
  handInfo:   { flex: 1, fontSize: 10, color: C.text, fontWeight: '600' },
  btnCancel:  { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(200,60,60,0.3)', borderWidth: 1, borderColor: C.red, alignItems: 'center', justifyContent: 'center' },
  btnCancelTxt: { fontSize: 16, fontWeight: '900', color: C.red },
  handRow:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: HPAD, gap: HGAP, flexWrap: 'wrap' },

  toast:    { position: 'absolute', bottom: 145, alignSelf: 'center', backgroundColor: 'rgba(20,50,22,0.96)', borderWidth: 1, borderColor: C.gold, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 20, zIndex: 50 },
  toastTxt: { fontSize: 13, fontWeight: '600', color: C.text },
  overlay:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.78)', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 },
  ovCard:   { backgroundColor: C.felt, borderWidth: 1, borderColor: C.gold, borderRadius: 20, padding: 28, width: '100%', maxWidth: 340, alignItems: 'center', elevation: 20 },
  ovTitle:  { fontSize: 22, fontWeight: '900', color: C.gold, marginBottom: 6, textAlign: 'center' },
  ovPts:    { fontSize: 14, color: C.dim, marginBottom: 16 },
  ovScores: { flexDirection: 'row', gap: 40, marginBottom: 16 },
  ovTN:     { fontSize: 11, letterSpacing: 1.5, color: C.dim, marginBottom: 4 },
  ovTV:     { fontSize: 42, fontWeight: '900', color: C.gold, lineHeight: 46 },
  ovHint:   { fontSize: 12, color: C.dim, textAlign: 'center' },
});
