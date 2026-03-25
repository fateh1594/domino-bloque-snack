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
export const HGAP = 3;
export const HDW  = Math.floor((width - HPAD * 2 - HGAP * 6) / 7);
export const HDH  = Math.floor(HDW * 2.1);

// ── Positions des points améliorées ──────────────────────────────────────────
const DOT_POSITIONS = {
  0: [],
  1: [[0.5, 0.5]],
  2: [[0.25, 0.25], [0.75, 0.75]],
  3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
  4: [[0.25, 0.25], [0.25, 0.75], [0.75, 0.25], [0.75, 0.75]],
  5: [[0.25, 0.25], [0.25, 0.75], [0.5, 0.5], [0.75, 0.25], [0.75, 0.75]],
  6: [[0.25, 0.15], [0.25, 0.5], [0.25, 0.85], [0.75, 0.15], [0.75, 0.5], [0.75, 0.85]],
};

// ── Points version "gravés" améliorée ────────────────────────────────────────
function renderDots(num, areaW, areaH) {
  const positions = DOT_POSITIONS[num] || [];
  const dotR = Math.max(2, Math.min(areaW, areaH) * 0.12);
  
  return positions.map(([px, py], i) => (
    <View key={i} style={{
      position: 'absolute',
      width: dotR * 2,
      height: dotR * 2,
      borderRadius: dotR,
      backgroundColor: C.dot,
      left: px * areaW - dotR,
      top: py * areaH - dotR,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0.5 },
      shadowOpacity: 0.4,
      shadowRadius: 1,
      elevation: 2,
    }} />
  ));
}

// ── Composant principal amélioré ─────────────────────────────────────────────
export function DominoFace({
  a,
  b,
  w,
  h,
  vertical = true,
  borderColor = '#222',
  borderWidth = 1.5,
  extraStyle = {},
}) {
  const radius = Math.max(4, Math.min(w, h) * 0.08);
  const areaW = vertical ? w : w / 2;
  const areaH = vertical ? h / 2 : h;
  const divThickness = Math.max(1, Math.min(w, h) * 0.015);

  return (
    <View style={[{
      width: w,
      height: h,
      backgroundColor: C.domino,
      borderRadius: radius,
      borderWidth,
      borderColor,
      flexDirection: vertical ? 'column' : 'row',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 3,
    }, extraStyle]}>

      {/* Reflet subtil */}
      <View pointerEvents="none" style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '25%',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderTopLeftRadius: radius,
        borderTopRightRadius: radius,
      }} />

      {/* Moitié A */}
      <View style={{ 
        width: areaW, 
        height: areaH, 
        position: 'relative', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'transparent'
      }}>
        {renderDots(a, areaW, areaH)}
      </View>

      {/* Séparateur central */}
      {vertical ? (
        <View style={{ 
          width: '80%', 
          height: divThickness, 
          backgroundColor: '#2a2a2a', 
          alignSelf: 'center',
          borderRadius: divThickness / 2
        }} />
      ) : (
        <View style={{ 
          width: divThickness, 
          height: '80%', 
          backgroundColor: '#2a2a2a', 
          alignSelf: 'center',
          borderRadius: divThickness / 2
        }} />
      )}

      {/* Moitié B */}
      <View style={{ 
        width: areaW, 
        height: areaH, 
        position: 'relative', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'transparent'
      }}>
        {renderDots(b, areaW, areaH)}
      </View>
    </View>
  );
}
