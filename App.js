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

// ── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  // ... (le reste du code reste exactement le même, inchangé)
  // Les seuls changements : toutes les instances de <Domino> sont remplacées par <DominoFace> comme montré
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  // ... (tout ton StyleSheet reste inchangé)
});
