import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DominoFace, C } from './domino';
import { HiddenDomino } from './hand';

export function BoardArea({
  board, boardSize, boardEnds,
  isMyTurn, selPiece,
  showLeft, showRight, showCenter,
  onPlaySide, onLayout,
}) {
  console.log('🎲 Board:', { boardLength: board?.length, boardSize });

  const isEmpty = !board || board.length === 0;

  return (
    <View style={S.boardArea} onLayout={onLayout}>
      <View style={S.debugInfo} pointerEvents="none">
        <Text style={S.debugText}>
          Dominos: {board?.length || 0} | Taille: {boardSize.w?.toFixed(0)}×{boardSize.h?.toFixed(0)}
        </Text>
      </View>

      {isEmpty && (
        <View style={S.emptyBoard}>
          <View style={S.emptyIcon}>
            <Text style={S.emptyIconTxt}>🎯</Text>
          </View>
          <Text style={S.emptyTxt}>Posez le premier domino</Text>
          <Text style={S.emptyHint}>Sélectionnez un domino dans votre main</Text>
        </View>
      )}

      {board && board.map((tile, i) => {
        const isVertical = tile.rotation === 90;
        const dominoWidth = isVertical ? 50 : 100;
        const dominoHeight = isVertical ? 100 : 50;
        const centerX = (boardSize.w || 400) / 2;
        const centerY = (boardSize.h || 300) / 2;
        const offsetX = (i - Math.floor(board.length / 2)) * (dominoWidth + 10);
        const posX = centerX + offsetX - dominoWidth / 2;
        const posY = centerY - dominoHeight / 2;
        const valueA = tile.piece?.[0] ?? tile.a ?? 0;
        const valueB = tile.piece?.[1] ?? tile.b ?? 0;

        console.log(`🎲 Domino ${i}:`, {
          values: [valueA, valueB],
          position: { x: posX.toFixed(1), y: posY.toFixed(1) },
          size: { w: dominoWidth, h: dominoHeight }
        });

        return (
          <View 
            key={`domino-${i}-${valueA}-${valueB}-${Date.now()}`}
            style={{
              position: 'absolute',
              left: posX,
              top: posY,
              zIndex: 30 + i,
              borderWidth: 2,
              borderColor: '#ffff00',
            }}
          >
            <DominoFace
              a={valueA}
              b={valueB}
              w={dominoWidth}
              h={dominoHeight}
              vertical={isVertical}
              borderColor="#000"
              borderWidth={3}
              extraStyle={{
                backgroundColor: '#ffffff',
                elevation: 30 + i,
                shadowColor: '#000',
                shadowOffset: { width: 3, height: 3 },
                shadowOpacity: 1,
                shadowRadius: 5,
              }}
            />
          </View>
        );
      })}

      {showCenter && (
        <TouchableOpacity 
          style={S.centerZone} 
          onPress={() => onPlaySide('right')}
          activeOpacity={0.7}
        >
          <View style={S.centerZoneContent}>
            <Text style={S.centerIcon}>✓</Text>
            <Text style={S.centerText}>Placer ici</Text>
          </View>
        </TouchableOpacity>
      )}

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
    backgroundColor: '#1e4d1e',
    margin: 4,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#ffaa00',
  },

  debugInfo: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 6,
    borderRadius: 6,
    zIndex: 200,
  },
  
  debugText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },

  emptyBoard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(201,168,76,0.2)',
    borderWidth: 3,
    borderColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  
  emptyIconTxt: { fontSize: 36 },
  
  emptyTxt: {
    color: C.gold,
    fontSize: 18,
    fontWeight: '800',
  },
  
  emptyHint: {
    color: '#aaa',
    fontSize: 14,
  },

  centerZone: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  
  centerZoneContent: {
    backgroundColor: 'rgba(201,168,76,0.4)',
    borderWidth: 4,
    borderColor: C.gold,
    borderRadius: 30,
    paddingHorizontal: 40,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 10,
  },
  
  centerIcon: { fontSize: 32, color: C.gold },
  centerText: { fontSize: 20, fontWeight: '900', color: C.gold },

  leftZone: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: '30%',
    backgroundColor: 'rgba(255,0,0,0.2)',
    borderRightWidth: 4,
    borderRightColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    zIndex: 10,
  },
  
  rightZone: {
    position: 'absolute',
    right: 0, top: 0, bottom: 0,
    width: '30%',
    backgroundColor: 'rgba(0,0,255,0.2)',
    borderLeftWidth: 4,
    borderLeftColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    zIndex: 10,
  },
  
  zoneArrow: { fontSize: 28, fontWeight: '900', color: C.gold },
  
  endBadge: {
    backgroundColor: C.gold,
    borderRadius: 25,
    minWidth: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  
  endNumber: { fontSize: 24, fontWeight: '900', color: '#000' },

  topOpp: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46,92,52,0.4)',
    backgroundColor: 'rgba(8,18,8,0.5)',
    gap: 6,
  },
  oppRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  oppAv: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 2, borderColor: C.goldDim,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  oppAvActive: { borderColor: C.gold, backgroundColor: 'rgba(201,168,76,0.25)' },
  oppAvTxt: { fontSize: 14, fontWeight: '700', color: C.gold },
  oppInfo: { flex: 1 },
  oppName: { fontSize: 13, fontWeight: '700', color: C.text },
  oppCount: { fontSize: 10, color: C.dim, marginTop: 1 },
  turnBadge: {
    backgroundColor: 'rgba(201,168,76,0.2)', borderWidth: 1, borderColor: C.gold,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  turnBadgeTxt: { fontSize: 9, fontWeight: '800', color: C.gold, letterSpacing: 1 },
  turnRing: {
    position: 'absolute', top: -4, left: -4, right: -4, bottom: -4,
    borderRadius: 999, borderWidth: 2.5, borderColor: C.gold,
  },
  hiddenRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 2 },
  hiddenMore: { fontSize: 10, color: C.dim, marginLeft: 4 },

  sideOpp: {
    width: 42, alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 8, backgroundColor: 'rgba(8,18,8,0.25)',
  },
  sideAv: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 1.5, borderColor: C.goldDim,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  sideAvActive: { borderColor: C.gold, backgroundColor: 'rgba(201,168,76,0.25)' },
  sideAvTxt: { fontSize: 11, fontWeight: '700', color: C.gold },
  sideName: { fontSize: 7, color: C.dim, textAlign: 'center', maxWidth: 38 },
  sideCount: { fontSize: 10, fontWeight: '700', color: C.gold },
  sideHidden: { gap: 2, alignItems: 'center' },
});
