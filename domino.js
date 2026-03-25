import React from 'react';
import { View, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// ── Palette premium ───────────────────────────────────────────────────────────
export const C = {
  bg:      '#0f1f0f',
  felt:    '#163a1c',
  felt2:   '#1a4221',
  gold:    '#c9a84c',
  goldDim: '#a07830',
  border:  '#2e5c34',
  text:    '#e8e0cc',
  dim:     '#8aad8e',
  domino:  '#fdfcf7',
  dot:     '#0e0e0e',
  red:     '#e05c5c',
  green:   '#4caf74',
  white:   '#ffffff',
};

// ── Tailles domino main ───────────────────────────────────────────────────────
export const HPAD = 8;
export const HGAP = 4;
export const HDW  = Math.floor((width - HPAD * 2 - HGAP * 6) / 7);
export const HDH  = Math.floor(HDW * 1.8);

// ── Positions des points ──────────────────────────────────────────────────────
const DOT_POSITIONS = {
  0: [],
  1: [[0.5,  0.5]],
  2: [[0.3,  0.3],  [0.7,  0.7]],
  3: [[0.3,  0.3],  [0.5,  0.5],  [0.7,  0.7]],
  4: [[0.28, 0.28], [0.28, 0.72], [0.72, 0.28], [0.72, 0.72]],
  5: [[0.28, 0.28], [0.28, 0.72], [0.5,  0.5],  [0.72, 0.28], [0.72, 0.72]],
  6: [[0.28, 0.18], [0.28, 0.5],  [0.28, 0.82], [0.72, 0.18], [0.72, 0.5],  [0.72, 0.82]],
};

// ── Points version "gravés" ───────────────────────────────────────────────────
function renderDots(num, areaW, areaH) {
  const positions = DOT_POSITIONS[num] || [];
  const dotR = Math.max(3, Math.min(areaW, areaH) * 0.14);
  return positions.map(([px, py], i) => (
    <View key={i} style={{
      position:        'absolute',
      width:           dotR * 2,
      height:          dotR * 2,
      borderRadius:    dotR,
      backgroundColor: C.dot,
      left:            px * areaW - dotR,
      top:             py * areaH - dotR,
      shadowColor:     '#000',
      shadowOffset:    { width: 0, height: 1 },
      shadowOpacity:   0.25,
      shadowRadius:    1,
      elevation:       1,
    }} />
  ));
}

// ── Composant principal ───────────────────────────────────────────────────────
export function DominoFace({
  a,
  b,
  w,
  h,
  vertical = true,
  borderColor = '#111',
  borderWidth = 2,
  extraStyle = {},
}) {
  const radius  = Math.max(6, Math.min(w, h) * 0.12);
  const areaW   = vertical ? w      : w / 2;
  const areaH   = vertical ? h / 2  : h;
  const divSize = Math.max(1, Math.min(w, h) * 0.012);

  return (
    <View style={[{
      width:           w,
      height:          h,
      backgroundColor: C.domino,
      borderRadius:    radius,
      borderWidth,
      borderColor,
      flexDirection:   vertical ? 'column' : 'row',
      overflow:        'hidden',
      shadowColor:     '#000',
      shadowOffset:    { width: 0, height: 3 },
      shadowOpacity:   0.12,
      shadowRadius:    3,
      elevation:       2,
    }, extraStyle]}>

      {/* Léger dégradé haut */}
      <View pointerEvents="none" style={{
        position:        'absolute',
        top: 0, left: 0, right: 0,
        height:          '30%',
        backgroundColor: 'rgba(255,255,255,0.08)',
      }} />

      {/* Moitié A */}
      <View style={{ width: areaW, height: areaH, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
        {renderDots(a, areaW, areaH)}
      </View>

      {/* Séparateur */}
      {vertical
        ? <View style={{ width: '70%', height: divSize, backgroundColor: '#1a1a1a', alignSelf: 'center' }} />
        : <View style={{ width: divSize, height: '70%', backgroundColor: '#1a1a1a', alignSelf: 'center' }} />
      }

      {/* Moitié B */}
      <View style={{ width: areaW, height: areaH, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
        {renderDots(b, areaW, areaH)}
      </View>
    </View>
  );
}
