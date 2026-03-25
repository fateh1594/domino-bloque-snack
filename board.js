import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { DominoFace, C } from './domino';
import { HiddenDomino } from './hand';
import { GameLogic } from './GameLogic';

export function BoardArea({
  board, boardSize, boardEnds,
  isMyTurn, selPiece,
  showLeft, showRight, showCenter,
  onPlaySide, onLayout,
}) {
  const [dominoPositions, setDominoPositions] = useState([]);

  // Fonction de calcul de serpent intelligent
  function calculateSmartBoardLayout(board, boardSize) {
    if (!board || board.length === 0) return [];
    
    const positions = [];
    const DOMINO_WIDTH = 60;
    const DOMINO_HEIGHT = 30;
    const MARGIN = 8;
    const MAX_WIDTH = (boardSize.w || 800) - 100;
    
    let currentX = 0;
    let currentY = 0;
    let direction = 1; // 1 = droite, -1 = gauche
    let lineStartX = 0;
    
    board.forEach((piece, index) => {
      const values = GameLogic.extractDominoValues ? 
        GameLogic.extractDominoValues(piece) : 
        { a: piece[0], b: piece[1] };
      
      const isDouble = values.a === values.b;
      const width = isDouble ? DOMINO_HEIGHT : DOMINO_WIDTH;
      const height = isDouble ? DOMINO_WIDTH : DOMINO_HEIGHT;
      
      // Premier domino au centre
      if (index === 0) {
        currentX = MAX_WIDTH / 2 - width / 2;
        lineStartX = currentX;
        positions.push({
          x: currentX,
          y: currentY,
          width,
          height,
          rotation: 0
        });
        currentX += width + MARGIN;
        return;
      }
      
      // Vérifier si on dépasse la largeur
      if (direction > 0 && currentX + width > MAX_WIDTH) {
        currentY += height + MARGIN;
        direction = -1;
        currentX = MAX_WIDTH - width;
      } else if (direction < 0 && currentX < 0) {
        currentY += height + MARGIN;
        direction = 1;
        currentX = lineStartX;
      }
      
      positions.push({
        x: currentX,
        y: currentY,
        width,
        height,
        rotation: 0
      });
      
      if (direction > 0) {
        currentX += width + MARGIN;
      } else {
        currentX -= width + MARGIN;
      }
    });
    
    return positions;
  }

  useEffect(() => {
    if (board && board.length > 0) {
      const positions = calculateSmartBoardLayout(board, boardSize);
      setDominoPositions(positions);
    } else {
      setDominoPositions([]);
    }
  }, [board, boardSize]);

  console.log('🎲 Board:', { 
    boardLength: board?.length, 
    boardSize, 
    positionsCount: dominoPositions.length 
  });

  const isEmpty = !board || board.length === 0;

  return (
    <View style={S.boardArea} onLayout={onLayout}>
      
      <View style={S.debugInfo} pointerEvents="none">
        <Text style={S.debugText}>
          🎯 {board?.length || 0} dominos | {boardSize.w?.toFixed(0)}×{boardSize.h?.toFixed(0)}
        </Text>
        {boardEnds && (
          <Text style={S.debugText}>
            Extrémités: {boardEnds.left} ◀━━━━▶ {boardEnds.right}
          </Text>
        )}
      </View>

      <ScrollView
        style={S.boardScroll}
        contentContainerStyle={[S.boardContent, { 
          minHeight: Math.max(600, (dominoPositions[dominoPositions.length - 1]?.y || 0) + 200) 
        }]}
        horizontal={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={true}
        minimumZoomScale={0.3}
        maximumZoomScale={1.5}
        bouncesZoom
      >
        <View style={S.gameArea}>
          
          {isEmpty && (
            <View style={S.emptyBoard}>
              <View style={S.emptyIcon}>
                <Text style={S.emptyIconTxt}>🎯</Text>
              </View>
              <Text style={S.emptyTxt}>Posez le premier domino</Text>
              <Text style={S.emptyHint}>
                {isMyTurn 
                  ? 'Sélectionnez un domino dans votre main'
                  : 'En attente du premier joueur...'
                }
              </Text>
            </View>
          )}

          {dominoPositions.map((position, i) => {
            const tile = board[i];
            const values = GameLogic.extractDominoValues ? 
              GameLogic.extractDominoValues(tile) : 
              { a: tile[0], b: tile[1] };
            const isDouble = values.a === values.b;

            return (
              <View 
                key={`smart-domino-${i}-${values.a}-${values.b}`}
                style={[
                  S.placedDomino,
                  {
                    left: position.x,
                    top: position.y,
                    zIndex: 30 + i,
                    transform: [{ rotate: `${position.rotation}deg` }],
                  }
                ]}
              >
                <DominoFace
                  a={values.a}
                  b={values.b}
                  w={position.width}
                  h={position.height}
                  vertical={isDouble}
                  borderColor="#000"
                  borderWidth={2}
                  extraStyle={{
                    backgroundColor: '#ffffff',
                    elevation: 30 + i,
                    shadowColor: '#000',
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: 0.4,
                    shadowRadius: 4,
                  }}
                />
                
                {__DEV__ && (
                  <View style={S.orderBadge}>
                    <Text style={S.orderText}>{i + 1}</Text>
                  </View>
                )}
              </View>
            );
          })}

          {isMyTurn && selPiece && !isEmpty && (
            <DominoPreview 
              piece={selPiece}
              boardEnds={boardEnds}
              showLeft={showLeft}
              showRight={showRight}
              positions={dominoPositions}
            />
          )}
        </View>
      </ScrollView>

      {showCenter && (
        <TouchableOpacity 
          style={S.centerZone} 
          onPress={() => onPlaySide('right')}
          activeOpacity={0.7}
        >
          <View style={S.centerZoneContent}>
            <Text style={S.centerIcon}>🎯</Text>
            <Text style={S.centerText}>COMMENCER ICI</Text>
            <Text style={S.centerHint}>Premier domino</Text>
          </View>
        </TouchableOpacity>
      )}

      {(showLeft || showRight) && (
        <>
          {showLeft && dominoPositions[0] && (
            <TouchableOpacity 
              style={[S.leftZone, {
                left: Math.max(0, dominoPositions[0].x - 80),
                top: dominoPositions[0].y,
                width: 70,
                height: 60
              }]} 
              onPress={() => onPlaySide('left')} 
              activeOpacity={0.7}
            >
              <Text style={S.zoneArrow}>◀</Text>
              <View style={S.endBadge}>
                <Text style={S.endNumber}>{boardEnds?.left || 0}</Text>
              </View>
            </TouchableOpacity>
          )}
          
          {showRight && dominoPositions.length > 0 && (
            <TouchableOpacity 
              style={[S.rightZone, {
                left: dominoPositions[dominoPositions.length - 1].x + dominoPositions[dominoPositions.length - 1].width + 10,
                top: dominoPositions[dominoPositions.length - 1].y,
                width: 70,
                height: 60
              }]} 
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

function DominoPreview({ piece, boardEnds, showLeft, showRight, positions }) {
  if (!piece || !positions || positions.length === 0) return null;

  const lastPosition = positions[positions.length - 1];
  const previewWidth = piece[0] === piece[1] ? 50 : 100;
  const previewHeight = piece[0] === piece[1] ? 100 : 50;

  return (
    <>
      {showLeft && (
        <View style={[
          S.previewDomino,
          {
            left: positions[0].x - previewWidth - 10,
            top: positions[0].y,
          }
        ]}>
          <DominoFace
            a={piece[0]}
            b={piece[1]}
            w={previewWidth}
            h={previewHeight}
            vertical={piece[0] === piece[1]}
            extraStyle={S.previewStyle}
          />
        </View>
      )}
      
      {showRight && (
        <View style={[
          S.previewDomino,
          {
            left: lastPosition.x + lastPosition.width + 10,
            top: lastPosition.y,
          }
        ]}>
          <DominoFace
            a={piece[0]}
            b={piece[1]}
            w={previewWidth}
            h={previewHeight}
            vertical={piece[0] === piece[1]}
            extraStyle={S.previewStyle}
          />
        </View>
      )}
    </>
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
            <Text style={S.turnBadgeTxt}>🎯 SON TOUR</Text>
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
    borderWidth: 2,
    borderColor: C.gold,
  },

  boardScroll: {
    flex: 1,
  },

  boardContent: {
    minWidth: 800,
    minHeight: 600,
  },

  gameArea: {
    flex: 1,
    position: 'relative',
    padding: 20,
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
    color: C.gold,
    fontSize: 10,
    fontWeight: '600',
  },

  emptyBoard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(201,168,76,0.2)',
    borderWidth: 3,
    borderColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  
  emptyIconTxt: { 
    fontSize: 48,
  },
  
  emptyTxt: {
    color: C.gold,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  
  emptyHint: {
    color: C.dim,
    fontSize: 14,
    textAlign: 'center',
  },

  placedDomino: {
    position: 'absolute',
  },

  previewDomino: {
    position: 'absolute',
    zIndex: 100,
  },

  previewStyle: {
    opacity: 0.7,
    borderColor: C.gold,
    borderWidth: 3,
    borderStyle: 'dashed',
  },

  orderBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ff4444',
    alignItems: 'center',
    justifyContent: 'center',
  },

  orderText: {
    fontSize: 8,
    color: 'white',
    fontWeight: 'bold',
  },

  centerZone: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(201,168,76,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  
  centerZoneContent: {
    backgroundColor: 'rgba(201,168,76,0.3)',
    borderWidth: 4,
    borderColor: C.gold,
    borderRadius: 30,
    paddingHorizontal: 40,
    paddingVertical: 25,
    alignItems: 'center',
    gap: 8,
  },
  
  centerIcon: { 
    fontSize: 40, 
    marginBottom: 5,
  },
  
  centerText: { 
    fontSize: 18, 
    fontWeight: '900', 
    color: C.gold,
    letterSpacing: 2,
  },

  centerHint: {
    fontSize: 12,
    color: C.goldDim,
    fontWeight: '600',
  },

  leftZone: {
    position: 'absolute',
    backgroundColor: 'rgba(255,100,100,0.8)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    zIndex: 10,
  },
  
  rightZone: {
    position: 'absolute',
    backgroundColor: 'rgba(100,255,100,0.8)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    zIndex: 10,
  },
  
  zoneArrow: { 
    fontSize: 16, 
    fontWeight: '900', 
    color: '#fff',
  },

  zoneLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: C.gold,
    letterSpacing: 2,
  },
  
  endBadge: {
    backgroundColor: C.gold,
    borderRadius: 15,
    minWidth: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  
  endNumber: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: '#000',
  },

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
    gap: 10 
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
    backgroundColor: 'rgba(201,168,76,0.25)' 
  },
  
  oppAvTxt: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: C.gold 
  },
  
  oppInfo: { 
    flex: 1 
  },
  
  oppName: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: C.text 
  },
  
  oppCount: { 
    fontSize: 10, 
    color: C.dim, 
    marginTop: 1 
  },
  
  turnBadge: {
    backgroundColor: 'rgba(201,168,76,0.2)', 
    borderWidth: 1, 
    borderColor: C.gold,
    borderRadius: 10, 
    paddingHorizontal: 8, 
    paddingVertical: 3,
  },
  
  turnBadgeTxt: { 
    fontSize: 9, 
    fontWeight: '800', 
    color: C.gold, 
    letterSpacing: 1 
  },
  
  turnRing: {
    position: 'absolute', 
    top: -4, 
    left: -4, 
    right: -4, 
    bottom: -4,
    borderRadius: 999, 
    borderWidth: 2.5, 
    borderColor: C.gold,
  },
  
  hiddenRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flexWrap: 'wrap', 
    gap: 2 
  },
  
  hiddenMore: { 
    fontSize: 10, 
    color: C.dim, 
    marginLeft: 4 
  },

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
    backgroundColor: 'rgba(201,168,76,0.25)' 
  },
  
  sideAvTxt: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: C.gold 
  },
  
  sideName: { 
    fontSize: 7, 
    color: C.dim, 
    textAlign: 'center', 
    maxWidth: 38 
  },
  
  sideCount: { 
    fontSize: 10, 
    fontWeight: '700', 
    color: C.gold 
  },
  
  sideHidden: { 
    gap: 2, 
    alignItems: 'center' 
  },
});
