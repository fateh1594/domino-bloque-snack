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

  // Algorithme de ligne qui se plie (vraies règles dominos)
  function calculateRealDominoLayout(board, boardSize) {
    if (!board || board.length === 0) return [];
    
    const positions = [];
    const DOMINO_WIDTH = 60;
    const DOMINO_HEIGHT = 30;
    const MARGIN = 5;
    const MAX_WIDTH = (boardSize.w || 800) - 80;
    const MAX_HEIGHT = (boardSize.h || 600) - 80;
    
    // Commencer au centre
    let currentX = MAX_WIDTH / 2 - DOMINO_WIDTH / 2;
    let currentY = 50;
    let direction = 'right'; // 'right', 'left', 'down', 'up'
    
    board.forEach((piece, index) => {
      const values = GameLogic.extractDominoValues ? 
        GameLogic.extractDominoValues(piece) : 
        { a: piece[0], b: piece[1] };
      
      const isDouble = values.a === values.b;
      let width = DOMINO_WIDTH;
      let height = DOMINO_HEIGHT;
      let rotation = 0;
      
      // Doubles sont verticaux
      if (isDouble) {
        width = DOMINO_HEIGHT;
        height = DOMINO_WIDTH;
        rotation = 90;
      }
      
      // Ajuster selon la direction
      if (direction === 'down' || direction === 'up') {
        if (!isDouble) {
          // Domino normal devient vertical dans direction verticale
          const temp = width;
          width = height;
          height = temp;
          rotation = 90;
        }
      }
      
      // Vérifier les limites et changer de direction si nécessaire
      if (direction === 'right' && currentX + width > MAX_WIDTH) {
        // Aller vers le bas
        currentY += height + MARGIN;
        currentX = MAX_WIDTH - width;
        direction = 'left';
      } else if (direction === 'left' && currentX < 0) {
        // Aller vers le bas
        currentY += height + MARGIN;
        currentX = 0;
        direction = 'right';
      } else if (direction === 'down' && currentY + height > MAX_HEIGHT) {
        // Aller vers la gauche
        currentX -= width + MARGIN;
        currentY = MAX_HEIGHT - height;
        direction = 'up';
      } else if (direction === 'up' && currentY < 0) {
        // Aller vers la droite
        currentX += width + MARGIN;
        currentY = 0;
        direction = 'down';
      }
      
      // Placer le domino
      positions.push({
        x: currentX,
        y: currentY,
        width,
        height,
        rotation
      });
      
      // Avancer pour le prochain domino
      switch(direction) {
        case 'right':
          currentX += width + MARGIN;
          break;
        case 'left':
          currentX -= width + MARGIN;
          break;
        case 'down':
          currentY += height + MARGIN;
          break;
        case 'up':
          currentY -= height + MARGIN;
          break;
      }
    });
    
    return positions;
  }

  useEffect(() => {
    if (board && board.length > 0) {
      const positions = calculateRealDominoLayout(board, boardSize);
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
          minHeight: Math.max(600, Math.max(...dominoPositions.map(p => p.y + p.height)) + 100),
          minWidth: Math.max(800, Math.max(...dominoPositions.map(p => p.x + p.width)) + 100)
        }]}
        horizontal={true}
        showsHorizontalScrollIndicator={true}
        showsVerticalScrollIndicator={true}
        minimumZoomScale={0.5}
        maximumZoomScale={2.0}
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
                key={`domino-${i}-${values.a}-${values.b}`}
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
                  vertical={position.rotation === 90}
                  borderColor="#333"
                  borderWidth={2}
                  extraStyle={{
                    backgroundColor: '#ffffff',
                    elevation: 30 + i,
                    shadowColor: '#000',
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 3,
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

      {(showLeft || showRight) && dominoPositions.length > 0 && (
        <>
          {showLeft && dominoPositions[0] && (
            <TouchableOpacity 
              style={[S.playZone, {
                left: Math.max(10, dominoPositions[0].x - 70),
                top: dominoPositions[0].y + 5,
                backgroundColor: 'rgba(255,100,100,0.9)'
              }]} 
              onPress={() => onPlaySide('left')} 
              activeOpacity={0.8}
            >
              <Text style={S.zoneArrow}>◀</Text>
              <Text style={S.zoneNumber}>{boardEnds?.left || 0}</Text>
              <Text style={S.zoneLabel}>GAUCHE</Text>
            </TouchableOpacity>
          )}
          
          {showRight && dominoPositions.length > 0 && (
            <TouchableOpacity 
              style={[S.playZone, {
                left: dominoPositions[dominoPositions.length - 1].x + dominoPositions[dominoPositions.length - 1].width + 10,
                top: dominoPositions[dominoPositions.length - 1].y + 5,
                backgroundColor: 'rgba(100,255,100,0.9)'
              }]} 
              onPress={() => onPlaySide('right')} 
              activeOpacity={0.8}
            >
              <Text style={S.zoneNumber}>{boardEnds?.right || 0}</Text>
              <Text style={S.zoneArrow}>▶</Text>
              <Text style={S.zoneLabel}>DROITE</Text>
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
  const previewWidth = piece[0] === piece[1] ? 30 : 60;
  const previewHeight = piece[0] === piece[1] ? 60 : 30;

  return (
    <>
      {showLeft && positions[0] && (
        <View style={[
          S.previewDomino,
          {
            left: positions[0].x - previewWidth - 15,
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
      
      {showRight && lastPosition && (
        <View style={[
          S.previewDomino,
          {
            left: lastPosition.x + lastPosition.width + 15,
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
    backgroundColor: '#0f5132',
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
    padding: 20,
  },

  gameArea: {
    flex: 1,
    position: 'relative',
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
    minHeight: 400,
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
    opacity: 0.8,
    borderColor: C.gold,
    borderWidth: 3,
    borderStyle: 'dashed',
  },

  orderBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ff4444',
    alignItems: 'center',
    justifyContent: 'center',
  },

  orderText: {
    fontSize: 9,
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

  playZone: {
    position: 'absolute',
    width: 60,
    height: 80,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    zIndex: 50,
    borderWidth: 2,
    borderColor: '#fff',
  },
  
  zoneArrow: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: '#fff',
  },

  zoneNumber: { 
    fontSize: 16, 
    fontWeight: '900', 
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
  },

  zoneLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
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
