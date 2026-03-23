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

// ── Positions des points ───────────────────────────────────────────────────────
const DOT_POSITIONS = {
  0: [],
  1: [[0.5,  0.5]],
  2: [[0.25, 0.25], [0.75, 0.75]],
  3: [[0.25, 0.25], [0.5,  0.5],  [0.75, 0.75]],
  4: [[0.25, 0.25], [0.25, 0.75], [0.75, 0.25], [0.75, 0.75]],
  5: [[0.25, 0.25], [0.25, 0.75], [0.5,  0.5],  [0.75, 0.25], [0.75, 0.75]],
  6: [[0.25, 0.17], [0.25, 0.5],  [0.25, 0.83], [0.75, 0.17], [0.75, 0.5],  [0.75, 0.83]],
};

// ── Composants ───────────────────────────────────────────────────────────────
function renderDots(num, w, h) {
  const positions = DOT_POSITIONS[num] || [];
  const r = Math.max(2.5, Math.min(w, h) * 0.1);
  return positions.map(([px, py], i) => (
    <View key={i} style={{
      position: 'absolute',
      width: r * 2, height: r * 2,
      borderRadius: r,
      backgroundColor: C.dot,
      left: px * w - r,
      top:  py * h - r,
    }} />
  ));
}

// ── Domino face ──────────────────────────────────────────────────────────────
function DominoFace({ a, b, w, h, vertical=true, borderColor='#ccc', borderWidth=1.5, style={} }) {
  const radius = Math.max(6, Math.min(w, h) * 0.15);
  const areaW = vertical ? w : w / 2;
  const areaH = vertical ? h / 2 : h;
  return (
    <View style={[{
      width: w, height: h,
      backgroundColor: C.domino,
      borderRadius: radius,
      borderWidth, borderColor,
      flexDirection: vertical ? 'column' : 'row',
      overflow: 'hidden',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 1, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
    }, style]}>
      <View style={{ width: areaW, height: areaH, position: 'relative' }}>
        {renderDots(a, areaW, areaH)}
      </View>
      <View style={{ width: vertical ? '80%' : 1.5, height: vertical ? 1.5 : '80%', backgroundColor: '#888', alignSelf: 'center' }} />
      <View style={{ width: areaW, height: areaH, position: 'relative' }}>
        {renderDots(b, areaW, areaH)}
      </View>
    </View>
  );
}

// ── Domino main ───────────────────────────────────────────────────────────────
const HPAD = 8;
const HGAP = 5;
const HDW  = Math.floor((width - HPAD * 2 - HGAP * 6) / 7);
const HDH  = Math.floor(HDW * 1.9);

function HandDomino({ piece, playable, selected, onPress }) {
  const bc = selected ? C.gold : playable ? C.green : '#ccc';
  const bw = selected ? 3 : playable ? 2 : 1.5;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <DominoFace
        a={piece[0]} b={piece[1]}
        w={HDW} h={HDH}
        vertical={true}
        borderColor={bc}
        borderWidth={bw}
        style={{
          opacity: playable ? 1 : 0.3,
          transform: [{ translateY: selected ? -10 : 0 }],
          elevation: selected ? 12 : 4,
          shadowColor: selected ? C.gold : '#000',
          shadowOpacity: selected ? 0.6 : 0.25,
          shadowRadius: selected ? 8 : 3,
        }}
      />
    </TouchableOpacity>
  );
}

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

// ── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [myHand, setMyHand] = useState([[6,6],[5,3],[2,4]]);
  const [board, setBoard] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);

  function handleSelect(i) { setSelectedIdx(i === selectedIdx ? null : i); }

  return (
    <View style={[S.bg, { flex:1 }]}>
      <StatusBar hidden />

      {/* Plateau */}
      <View style={[S.boardArea, { margin: 16, flex:1 }]}>
        {board.map((tile, i) => (
          <DominoFace
            key={i}
            a={tile[0]} b={tile[1]}
            w={HDW} h={HDH}
            vertical={true}
            style={{ position: 'absolute', left: tile.x || 0, top: tile.y || 0 }}
          />
        ))}
      </View>

      {/* Main */}
      <View style={S.handRow}>
        {myHand.map((piece, i) => (
          <HandDomino
            key={i}
            piece={piece}
            playable={true}
            selected={selectedIdx === i}
            onPress={() => handleSelect(i)}
          />
        ))}
      </View>
    </View>
  );
}

// ── STYLES ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  bg: { flex:1, backgroundColor:C.felt },
  boardArea: { backgroundColor: 'rgba(18,52,22,0.35)', borderRadius:8, position:'relative', overflow:'hidden' },
  handRow: { flexDirection:'row', justifyContent:'center', alignItems:'flex-end', padding:HPAD, gap: HGAP, flexWrap:'wrap' },
});
