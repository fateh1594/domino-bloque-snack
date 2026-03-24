import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const C = {
  bg: '#0f1f0f',
  gold: '#c9a84c',
  domino: '#fdfcf7',
  dot: '#1a1a1a',
  border: '#2e5c34',
  green: '#4caf74'
};

export const HDW = Math.floor(width / 7.5); 
export const HDH = HDW * 2; 

const DOTS = {
  1: [{x:50, y:50}], 
  2: [{x:25, y:25}, {x:75, y:75}], 
  3: [{x:25, y:25}, {x:50, y:50}, {x:75, y:75}],
  4: [{x:25, y:25}, {x:25, y:75}, {x:75, y:25}, {x:75, y:75}],
  5: [{x:25, y:25}, {x:25, y:75}, {x:50, y:50}, {x:75, y:25}, {x:75, y:75}],
  6: [{x:25, y:20}, {x:25, y:50}, {x:25, y:80}, {x:75, y:20}, {x:75, y:50}, {x:75, y:80}],
};

export function DominoFace({ a, b, w, h, vertical, borderColor = '#333', borderWidth = 1.5, extraStyle = {} }) {
  const dotSize = Math.min(w, h) * 0.18;
  const renderHalf = (num) => (
    <View style={S.half}>
      {(DOTS[num] || []).map((p, i) => (
        <View key={i} style={[S.dot, { 
          width: dotSize, height: dotSize, borderRadius: dotSize/2,
          left: `${p.x}%`, top: `${p.y}%`, marginLeft: -dotSize/2, marginTop: -dotSize/2 
        }]} />
      ))}
    </View>
  );

  return (
    <View style={[S.card, { width: w, height: h, borderColor, borderWidth, flexDirection: vertical ? 'column' : 'row' }, extraStyle]}>
      {renderHalf(a)}
      <View style={vertical ? S.lineH : S.lineV} />
      {renderHalf(b)}
    </View>
  );
}

const S = StyleSheet.create({
  card: { backgroundColor: C.domino, borderRadius: 4, elevation: 3, overflow: 'hidden' },
  half: { flex: 1, position: 'relative' },
  dot: { position: 'absolute', backgroundColor: C.dot },
  lineH: { height: 1.5, width: '80%', backgroundColor: 'rgba(0,0,0,0.1)', alignSelf: 'center' },
  lineV: { width: 1.5, height: '80%', backgroundColor: 'rgba(0,0,0,0.1)', alignSelf: 'center' },
});
