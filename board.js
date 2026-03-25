import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DominoFace, C } from './domino';
import { HiddenDomino } from './hand';

// ── Constantes corrigées ─────────────────────────────────────────────────────
const BOARD_W = 800;
const BOARD_H = 500;
const DOMINO_W = 60;
const DOMINO_H = 30;

// ── Plateau corrigé ──────────────────────────────────────────────────────────
export function BoardArea({
  board, boardSize, boardEnds,
  isMyTurn, selPiece,
  showLeft, showRight, showCenter,
  onPlaySide, onLayout,
}) {
  const scaleX = boardSize.w > 0 ? boardSize.w / BOARD_W : 1;
  const scaleY = boardSize.h > 0 ? boardSize.h / BOARD_H : 1;
  const scale = Math.min(scaleX, scaleY) * 0.9;

  const offsetX = boardSize.w > 0 ? (boardSize.w - BOARD_W * scale) / 2 : 0;
  const offsetY = boardSize.h > 0 ? (boardSize.h - BOARD_H * scale) / 2 : 0;

  const isEmpty = board.length === 0;

  return (
    <View style={S.boardArea} onLayout={onLayout}>
      {/* Texture améliorée */}
      <View style={S.feltPattern} pointerEvents="none">
        {[...Array(12)].map((_, i) => (
          <View key={`h-${i}`} style={[S.feltLineH, { top: `${i * 8.5}%` }]} />
        ))}
        {[...Array(16)].map((_, i) => (
          <View key={`v-${i}`} style={[S.feltLineV, { left: `${i * 6.25}%` }]} />
        ))}
      </View>

      {/* Plateau vide */}
      {isEmpty && !selPiece && (
        <View style={S.emptyBoard}>
          <View style={S.emptyIcon}>
            <Text style={S.emptyIconTxt}>🎯</Text>
          </View>
          <Text style={S.emptyTxt}>Posez le premier domino</Text>
          <Text style={S.emptyHint}>Sélectionnez un domino dans votre main</Text>
        </View>
      )}

      {/* Dominos sur le plateau */}
      {board.map((tile, i) => {
        const isVertical = tile.rotation === 90;
        
        const tileWidth = (isVertical ? DOMINO_H : DOMINO_W) * scale;
        const tileHeight = (isVertical ? DOMINO_W : DOMINO_H) * scale;
        
        const posX = ((tile.x || 0) / BOARD_W) * BOARD_W * scale + offsetX;
        const posY = ((tile.y || 0) / BOARD_H) * BOARD_H * scale + offsetY;
        
        const pieceA = tile.piece ? tile.piece[0] : (tile.a ?? 0);
        const pieceB = tile.piece ? tile.piece[1] : (tile.b ?? 0);

        return (
          <View key={`domino-${i}`} style={{
            position: 'absolute',
            left: posX,
            top: posY,
            zIndex: 5
          }}>
            <DominoFace
              a={pieceA}
              b={pieceB}
              w={tileWidth}
              h={tileHeight}
              vertical={isVertical}
              borderColor="#444"
              borderWidth={Math.max(1, scale * 1.5)}
              extraStyle={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.3,
                shadowRadius: 2,
                elevation: 5,
              }}
            />
          </View>
        );
      })}

      {/* Zone de placement central */}
      {showCenter && (
        <TouchableOpacity 
          style={S.centerZone} 
          onPress={() => onPlaySide('center')} 
          activeOpacity={0.7}
        >
          <View style={S.centerZoneContent}>
            <Text style={S.centerIcon}>✓</Text>
            <Text style={S.centerText}>Placer ici</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Zones de placement latérales */}
      {(showLeft || showRight) && (
        <>
          {showLeft && (
            <TouchableOpacity 
              style={S.leftZone} 
              onPress={() => onPlaySide('left')} 
              activeOpacity={0.7}
            >
              <Text style={S.zoneArrow}>◀</Text>
              <View style={S.endBadge}>
                <Text style={S.endNumber}>{boardEnds?.left || 0}</Text>
              </View>
            </TouchableOpacity>
          )}
          
          {showRight && (
            <TouchableOpacity 
              style={S.rightZone} 
              onPress={() => onPlaySide('right')} 
              activeOpacity={0.7}
            >
              <View style={S.endBadge}>
                <Text style={S.endNumber}>{boardEnds?.right || 0}</Text>
              </View>
              <Text style={S.zoneArrow}>▶</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

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
      <View style={S.hiddenRow}>
        {[...Array(Math.min(count, 9))].map((_, i) => (
          <HiddenDomino key={i} w={16} h={28} />
        ))}
        {count > 9 && <Text style={S.hiddenMore}>+{count - 9}</Text>}
      </View>
    </View>
  );
}

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

const S = StyleSheet.create({
  boardArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1a4221',
    margin: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2e5c34',
  },
  
  feltPattern: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.3,
  },
  
  feltLineH: {
    position: 'absolute',
    left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  
  feltLineV: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  emptyBoard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(201,168,76,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  
  emptyIconTxt: { fontSize: 28 },
  
  emptyTxt: {
    color: C.dim,
    fontSize: 14,
    fontWeight: '600',
  },
  
  emptyHint: {
    color: 'rgba(138,173,142,0.6)',
    fontSize: 12,
  },

  centerZone: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(201,168,76,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  
  centerZoneContent: {
    backgroundColor: 'rgba(201,168,76,0.25)',
    borderWidth: 2,
    borderColor: C.gold,
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingVertical: 15,
    alignItems: 'center',
    gap: 6,
  },
  
  centerIcon: { fontSize: 24, color: C.gold },
  centerText: { fontSize: 16, fontWeight: '800', color: C.gold, letterSpacing: 1 },

  leftZone: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: '35%',
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderRightWidth: 2,
    borderRightColor: 'rgba(201,168,76,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 10,
  },
  
  rightZone: {
    position: 'absolute',
    right: 0, top: 0, bottom: 0,
    width: '35%',
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(201,168,76,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 10,
  },
  
  zoneArrow: { fontSize: 22, fontWeight: '900', color: C.gold },
  
  endBadge: {
    backgroundColor: C.gold,
    borderRadius: 22,
    minWidth: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
  endNumber: { fontSize: 22, fontWeight: '900', color: '#1a1200' },

  topOpp: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46,92,52,0.4)',
    backgroundColor: 'rgba(8,18,8,0.5)',
    gap: 6,
  },
  oppRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  oppAv: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderWidth: 2,
    borderColor: C.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  oppAvActive: {
    borderColor: C.gold,
    backgroundColor: 'rgba(201,168,76,0.25)',
  },
  oppAvTxt: { fontSize: 14, fontWeight: '700', color: C.gold },
  oppInfo: { flex: 1 },
  oppName: { fontSize: 13, fontWeight: '700', color: C.text },
  oppCount: { fontSize: 10, color: C.dim, marginTop: 1 },
  turnBadge: {
    backgroundColor: 'rgba(201,168,76,0.2)',
    borderWidth: 1,
    borderColor: C.gold,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  turnBadgeTxt: { fontSize: 9, fontWeight: '800', color: C.gold, letterSpacing: 1 },
  turnRing: {
    position: 'absolute',
    top: -4, left: -4, right: -4, bottom: -4,
    borderRadius: 999,
    borderWidth: 2.5,
    borderColor: C.gold,
  },
  hiddenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
  },
  hiddenMore: { fontSize: 10, color: C.dim, marginLeft: 4 },

  sideOpp: {
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    backgroundColor: 'rgba(8,18,8,0.25)',
  },
  sideAv: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderWidth: 1.5,
    borderColor: C.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sideAvActive: {
    borderColor: C.gold,
    backgroundColor: 'rgba(201,168,76,0.25)',
  },
  sideAvTxt: { fontSize: 11, fontWeight: '700', color: C.gold },
  sideName: {
    fontSize: 7,
    color: C.dim,
    textAlign: 'center',
    maxWidth: 38,
  },
  sideCount: { fontSize: 10, fontWeight: '700', color: C.gold },
  sideHidden: { gap: 2, alignItems: 'center' },
});
