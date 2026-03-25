import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// ── Palette premium ultra-moderne ────────────────────────────────────────────
export const C = {
  bg: '#0f1f0f',
  felt: '#163a1c',
  felt2: '#1a4221',
  gold: '#c9a84c',
  goldDim: '#a07830',
  border: '#2e5c34',
  text: '#e8e0cc',
  dim: '#8aad8e',
  
  // Couleurs dominos pro
  domino: {
    base: '#f8f7f2',
    shadow: '#e1dfda',
    border: '#d4d2cd',
    highlight: '#ffffff',
    edge: '#c8c6c1',
  },
  
  dot: {
    primary: '#1a1a1a',
    shadow: '#000000',
    highlight: '#333333',
  },
  
  red: '#e05c5c',
  green: '#4caf74',
  white: '#ffffff',
};

// ── Tailles domino main optimisées ───────────────────────────────────────────
export const HPAD = 8;
export const HGAP = 3;
export const HDW = Math.floor((width - HPAD * 2 - HGAP * 6) / 7);
export const HDH = Math.floor(HDW * 2.1);

// ── Positions des points ultra-précises ─────────────────────────────────────
const DOT_PATTERNS = {
  0: [],
  1: [{ x: 0.5, y: 0.5 }],
  2: [
    { x: 0.3, y: 0.3 },
    { x: 0.7, y: 0.7 }
  ],
  3: [
    { x: 0.25, y: 0.25 },
    { x: 0.5, y: 0.5 },
    { x: 0.75, y: 0.75 }
  ],
  4: [
    { x: 0.3, y: 0.3 },
    { x: 0.7, y: 0.3 },
    { x: 0.3, y: 0.7 },
    { x: 0.7, y: 0.7 }
  ],
  5: [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.5, y: 0.5 },
    { x: 0.25, y: 0.75 },
    { x: 0.75, y: 0.75 }
  ],
  6: [
    { x: 0.25, y: 0.2 },
    { x: 0.75, y: 0.2 },
    { x: 0.25, y: 0.5 },
    { x: 0.75, y: 0.5 },
    { x: 0.25, y: 0.8 },
    { x: 0.75, y: 0.8 }
  ]
};

// ── Composant Point 3D ultra-réaliste ───────────────────────────────────────
function DominoDot({ size, x, y }) {
  const dotRadius = size / 2;
  const shadowRadius = size / 2.2;
  const highlightRadius = size / 3;

  return (
    <View
      style={[
        styles.dotContainer,
        {
          width: size,
          height: size,
          borderRadius: dotRadius,
          left: x - dotRadius,
          top: y - dotRadius,
        }
      ]}
    >
      {/* Ombre portée */}
      <View
        style={[
          styles.dotShadow,
          {
            width: size * 1.1,
            height: size * 1.1,
            borderRadius: (size * 1.1) / 2,
            top: 1,
            left: 1,
          }
        ]}
      />
      
      {/* Point principal avec dégradé */}
      <LinearGradient
        colors={[C.dot.primary, C.dot.shadow]}
        start={{ x: 0.2, y: 0.2 }}
        end={{ x: 0.8, y: 0.8 }}
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: dotRadius,
          }
        ]}
      >
        {/* Reflet highlight */}
        <View
          style={[
            styles.dotHighlight,
            {
              width: highlightRadius,
              height: highlightRadius,
              borderRadius: highlightRadius / 2,
              top: size * 0.15,
              left: size * 0.2,
            }
          ]}
        />
      </LinearGradient>
    </View>
  );
}

// ── Rendu des points avec calculs précis ────────────────────────────────────
function renderDots(value, areaW, areaH) {
  const patterns = DOT_PATTERNS[value] || [];
  const maxDotSize = Math.min(areaW, areaH) * 0.18;
  const dotSize = Math.max(6, Math.min(maxDotSize, 14));
  
  return patterns.map((pattern, index) => (
    <DominoDot
      key={index}
      size={dotSize}
      x={pattern.x * areaW}
      y={pattern.y * areaH}
    />
  ));
}

// ── Composant principal ultra-professionnel ─────────────────────────────────
export function DominoFace({
  a,
  b,
  w,
  h,
  vertical = true,
  borderColor = C.domino.border,
  borderWidth = 1.5,
  extraStyle = {},
}) {
  const radius = Math.max(6, Math.min(w, h) * 0.1);
  const areaW = vertical ? w : w / 2;
  const areaH = vertical ? h / 2 : h;
  const dividerThickness = Math.max(1.5, Math.min(w, h) * 0.02);
  const isDouble = a === b;

  return (
    <View style={[styles.dominoWrapper, extraStyle]}>
      {/* Ombre portée du domino */}
      <View
        style={[
          styles.dominoShadow,
          {
            width: w + 4,
            height: h + 4,
            borderRadius: radius + 2,
            top: 3,
            left: 2,
          }
        ]}
      />
      
      {/* Corps principal avec dégradé */}
      <LinearGradient
        colors={[C.domino.highlight, C.domino.base, C.domino.shadow]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.dominoBody,
          {
            width: w,
            height: h,
            borderRadius: radius,
            borderWidth,
            borderColor,
            flexDirection: vertical ? 'column' : 'row',
          }
        ]}
      >
        {/* Reflet supérieur */}
        <LinearGradient
          colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[
            styles.topGloss,
            {
              borderTopLeftRadius: radius - borderWidth,
              borderTopRightRadius: radius - borderWidth,
              height: h * 0.3,
            }
          ]}
        />

        {/* Première moitié */}
        <View style={[styles.dominoHalf, { width: areaW, height: areaH }]}>
          {renderDots(a, areaW, areaH)}
          
          {/* Bevel interne */}
          <View
            style={[
              styles.innerBevel,
              {
                borderRadius: radius * 0.7,
                margin: 2,
              }
            ]}
          />
        </View>

        {/* Séparateur central 3D */}
        <View
          style={[
            styles.dividerContainer,
            {
              width: vertical ? '100%' : dividerThickness,
              height: vertical ? dividerThickness : '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }
          ]}
        >
          <LinearGradient
            colors={[C.domino.shadow, C.domino.border, C.domino.edge]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.divider,
              {
                width: vertical ? '85%' : dividerThickness,
                height: vertical ? dividerThickness : '85%',
                borderRadius: dividerThickness / 2,
              }
            ]}
          />
        </View>

        {/* Deuxième moitié */}
        <View style={[styles.dominoHalf, { width: areaW, height: areaH }]}>
          {renderDots(b, areaW, areaH)}
          
          {/* Bevel interne */}
          <View
            style={[
              styles.innerBevel,
              {
                borderRadius: radius * 0.7,
                margin: 2,
              }
            ]}
          />
        </View>

        {/* Bordure interne premium */}
        <View
          style={[
            styles.innerBorder,
            {
              borderRadius: radius - 1,
              borderWidth: 0.5,
              borderColor: 'rgba(0,0,0,0.1)',
            }
          ]}
        />

        {/* Badge spécial pour les doubles */}
        {isDouble && (
          <View style={styles.doubleBadge}>
            <LinearGradient
              colors={[C.gold, C.goldDim]}
              style={styles.doubleBadgeGradient}
            >
              <View style={styles.doubleBadgeDot} />
              <View style={styles.doubleBadgeDot} />
            </LinearGradient>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

// ── Styles ultra-professionnels ─────────────────────────────────────────────
const styles = StyleSheet.create({
  dominoWrapper: {
    position: 'relative',
  },

  dominoShadow: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.15)',
    opacity: 0.8,
  },

  dominoBody: {
    position: 'relative',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  topGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    pointerEvents: 'none',
  },

  dominoHalf: {
    position: 'relative',
    backgroundColor: 'transparent',
  },

  innerBevel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    pointerEvents: 'none',
  },

  dividerContainer: {
    position: 'relative',
    zIndex: 5,
  },

  divider: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },

  innerBorder: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    pointerEvents: 'none',
    zIndex: 8,
  },

  // Styles des points 3D
  dotContainer: {
    position: 'absolute',
    zIndex: 15,
  },

  dotShadow: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 1,
  },

  dot: {
    position: 'relative',
    zIndex: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
  },

  dotHighlight: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.6)',
    zIndex: 3,
  },

  // Badge pour doubles
  doubleBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 20,
  },

  doubleBadgeGradient: {
    flex: 1,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },

  doubleBadgeDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#1a1200',
  },
});
