import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DominoFace, C } from './domino';
import { HiddenDomino }  from './hand';

// ── Constantes serveur ────────────────────────────────────────────────────────
const SERVER_W = 1000;
const SERVER_H = 600;
const DOM_W    = 200; // largeur domino horizontal en unités serveur
const DOM_H    = 100; // hauteur domino horizontal en unités serveur

// ── Plateau ───────────────────────────────────────────────────────────────────
export function BoardArea({
  board, boardSize, boardEnds,
  isMyTurn, selPiece,
  showLeft, showRight, showCenter,
  onPlaySide, onLayout,
}) {
  // Scale uniforme pour ne pas déformer les dominos
  const sc = boardSize.w > 0
    ? Math.min(boardSize.w / SERVER_W, boardSize.h / SERVER_H)
    : 1;
  // Offset pour centrer le contenu dans le plateau
  const offX = boardSize.w > 0 ? (boardSize.w - SERVER_W * sc) / 2 : 0;
  const offY = boardSize.h > 0 ? (boardSize.h - SERVER_H * sc) / 2 : 0;

  const isEmpty = board.length === 0;

  return (
    <View style={S.boardArea} onLayout={onLayout}>
      {/* Texture tapis : lignes subtiles */}
      <View style={S.feltLines} pointerEvents="none">
        {[...Array(8)].map((_, i) => (
          <View key={i} style={[S.feltLine, { top: `${i * 14}%` }]} />
        ))}
      </View>

      {/* Plateau vide */}
      {isEmpty && !selPiece && (
        <View style={S.emptyBoard}>
          <View style={S.emptyIcon}>
            <Text style={S.emptyIconTxt}>🁣</Text>
          </View>
          <Text style={S.emptyTxt}>Posez le premier domino</Text>
          <Text style={S.emptyHint}>Sélectionnez un domino dans votre main</Text>
        </View>
      )}

      {/* Dominos posés */}
      {board.map((tile, i) => {
        const isVert = (tile.rotation || 0) === 90;
        // Taille : ratio 2:1 respecté (DOM_W=200, DOM_H=100)
        const tw = isVert ? DOM_H * sc : DOM_W * sc;
        const th = isVert ? DOM_W * sc : DOM_H * sc;
        const px = (tile.x || 0) * sc + offX;
        const py = (tile.y || 0) * sc + offY;
        const a  = tile.piece ? tile.piece[0] : (tile.a ?? 0);
        const b  = tile.piece ? tile.piece[1] : (tile.b ?? 0);

        return (
          <View key={i} style={{ position: 'absolute', left: px, top: py }}>
            <DominoFace
              a={a} b={b}
              w={tw} h={th}
              vertical={isVert}
              borderColor="#333"
              borderWidth={1.5}
            />
          </View>
        );
      })}

      {/* Zone centre (1er coup) */}
      {showCenter && (
        <TouchableOpacity style={S.zoneAll} onPress={() => onPlaySide('right')} activeOpacity={0.8}>
          <View style={S.zoneCenterInner}>
            <Text style={S.zoneCenterIcon}>✓</Text>
            <Text style={S.zoneCenterTxt}>Poser ici</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Zones gauche / droite */}
      {(showLeft || showRight) && (
        <>
          {showLeft && (
            <TouchableOpacity style={S.zoneLeft} onPress={() => onPlaySide('left')} activeOpacity={0.8}>
              <Text style={S.zoneArrow}>◀</Text>
              <View style={S.zoneEndBadge}>
                <Text style={S.zoneEndNum}>{boardEnds?.left}</Text>
              </View>
            </TouchableOpacity>
          )}
          {showRight && (
            <TouchableOpacity style={S.zoneRight} onPress={() => onPlaySide('right')} activeOpacity={0.8}>
              <View style={S.zoneEndBadge}>
                <Text style={S.zoneEndNum}>{boardEnds?.right}</Text>
              </View>
              <Text style={S.zoneArrow}>▶</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

// ── Adversaire du haut ────────────────────────────────────────────────────────
export function TopOpponent({ player, handCount, isCurrentTurn }) {
  if (!player) return null;
  const count = handCount ?? 7;
  return (
    <View style={S.topOpp}>
      <View style={S.oppRow}>
        <View style={[S.oppAv, isCurrentTurn && S.oppAvActive]}>
          <Text style={S.oppAvTxt}>{player.name[0].toUpperCase()}</Text>
          {isCurrentTurn && <View style={S.turnRing} />}
        </View>
        <View style={S.oppInfo}>
          <Text style={S.oppName}>{player.name}</Text>
          <Text style={S.oppCount}>{count} domino{count > 1 ? 's' : ''}</Text>
        </View>
        {isCurrentTurn && (
          <View style={S.turnBadge}>
            <Text style={S.turnBadgeTxt}>SON TOUR</Text>
          </View>
        )}
      </View>
      {/* Dominos cachés */}
      <View style={S.hiddenRow}>
        {[...Array(Math.min(count, 9))].map((_, i) => (
          <HiddenDomino key={i} w={16} h={28} />
        ))}
        {count > 9 && <Text style={S.hiddenMore}>+{count - 9}</Text>}
      </View>
    </View>
  );
}

// ── Adversaire latéral ────────────────────────────────────────────────────────
export function SideOpponent({ player, handCount, isCurrentTurn, side }) {
  if (!player) return <View style={{ width: 38 }} />;
  const count = handCount ?? 7;
  return (
    <View style={S.sideOpp}>
      <View style={[S.sideAv, isCurrentTurn && S.sideAvActive]}>
        <Text style={S.sideAvTxt}>{player.name[0].toUpperCase()}</Text>
        {isCurrentTurn && <View style={S.turnRing} />}
      </View>
      <Text style={S.sideName} numberOfLines={1}>{player.name}</Text>
      <Text style={S.sideCount}>{count}</Text>
      <View style={S.sideHidden}>
        {[...Array(Math.min(count, 7))].map((_, i) => (
          <HiddenDomino key={i} w={12} h={22} />
        ))}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  boardArea: {
    flex:            1,
    position:        'relative',
    overflow:        'hidden',
    backgroundColor: 'rgba(16,48,20,0.6)',
    margin:          4,
    borderRadius:    10,
    borderWidth:     1,
    borderColor:     'rgba(46,92,52,0.4)',
  },
  feltLines: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  feltLine: {
    position:        'absolute',
    left: 0, right: 0,
    height:          1,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },

  emptyBoard: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
  },
  emptyIcon: {
    width:           52,
    height:          52,
    borderRadius:    26,
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth:     1,
    borderColor:     'rgba(201,168,76,0.3)',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  emptyIconTxt: { fontSize: 26 },
  emptyTxt: {
    color:     C.dim,
    fontSize:  13,
    fontWeight:'600',
  },
  emptyHint: {
    color:    'rgba(138,173,142,0.5)',
    fontSize: 11,
  },

  zoneAll: {
    position:        'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(201,168,76,0.12)',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          10,
  },
  zoneCenterInner: {
    backgroundColor: 'rgba(201,168,76,0.2)',
    borderWidth:     2,
    borderColor:     C.gold,
    borderRadius:    16,
    paddingHorizontal:24,
    paddingVertical: 12,
    alignItems:      'center',
    gap:             4,
  },
  zoneCenterIcon: { fontSize: 22, color: C.gold },
  zoneCenterTxt:  { fontSize: 16, fontWeight: '800', color: C.gold, letterSpacing: 1 },

  zoneLeft: {
    position:        'absolute',
    left: 0, top: 0, bottom: 0,
    width:           '36%',
    backgroundColor: 'rgba(201,168,76,0.14)',
    borderRightWidth:1,
    borderRightColor:'rgba(201,168,76,0.35)',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    zIndex:          10,
  },
  zoneRight: {
    position:        'absolute',
    right: 0, top: 0, bottom: 0,
    width:           '36%',
    backgroundColor: 'rgba(201,168,76,0.14)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(201,168,76,0.35)',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    zIndex:          10,
  },
  zoneArrow: { fontSize: 20, fontWeight: '900', color: C.gold },
  zoneEndBadge: {
    backgroundColor: C.gold,
    borderRadius:    20,
    minWidth:        36,
    height:          36,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal:6,
    elevation:       4,
  },
  zoneEndNum: { fontSize: 20, fontWeight: '900', color: '#1a1200' },

  // Adversaire haut
  topOpp: {
    paddingVertical:  8,
    paddingHorizontal:12,
    borderBottomWidth:1,
    borderBottomColor:'rgba(46,92,52,0.4)',
    backgroundColor:  'rgba(8,18,8,0.5)',
    gap:              6,
  },
  oppRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  oppAv: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderWidth:     2,
    borderColor:     C.goldDim,
    alignItems:      'center',
    justifyContent:  'center',
    position:        'relative',
  },
  oppAvActive: {
    borderColor:     C.gold,
    backgroundColor: 'rgba(201,168,76,0.25)',
  },
  oppAvTxt:  { fontSize: 14, fontWeight: '700', color: C.gold },
  oppInfo:   { flex: 1 },
  oppName:   { fontSize: 13, fontWeight: '700', color: C.text },
  oppCount:  { fontSize: 10, color: C.dim, marginTop: 1 },
  turnBadge: {
    backgroundColor: 'rgba(201,168,76,0.2)',
    borderWidth:     1,
    borderColor:     C.gold,
    borderRadius:    10,
    paddingHorizontal:8,
    paddingVertical: 3,
  },
  turnBadgeTxt: { fontSize: 9, fontWeight: '800', color: C.gold, letterSpacing: 1 },
  turnRing: {
    position:     'absolute',
    top: -4, left: -4, right: -4, bottom: -4,
    borderRadius: 999,
    borderWidth:  2.5,
    borderColor:  C.gold,
  },
  hiddenRow: {
    flexDirection: 'row',
    alignItems:    'center',
    flexWrap:      'wrap',
    gap:           2,
  },
  hiddenMore: { fontSize: 10, color: C.dim, marginLeft: 4 },

  // Adversaire latéral
  sideOpp: {
    width:          42,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            4,
    paddingVertical:8,
    backgroundColor:'rgba(8,18,8,0.25)',
  },
  sideAv: {
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderWidth:     1.5,
    borderColor:     C.goldDim,
    alignItems:      'center',
    justifyContent:  'center',
    position:        'relative',
  },
  sideAvActive: {
    borderColor:     C.gold,
    backgroundColor: 'rgba(201,168,76,0.25)',
  },
  sideAvTxt:  { fontSize: 11, fontWeight: '700', color: C.gold },
  sideName: {
    fontSize:  7,
    color:     C.dim,
    textAlign: 'center',
    maxWidth:  38,
  },
  sideCount: { fontSize: 10, fontWeight: '700', color: C.gold },
  sideHidden: { gap: 2, alignItems: 'center' },
});
