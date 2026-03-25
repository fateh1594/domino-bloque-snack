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

// ── Points version "gravés" améliorée ────────────────
