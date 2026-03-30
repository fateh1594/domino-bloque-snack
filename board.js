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

  // Fonction pour calculer la VRAIE prochaine position collée
  function getNextPosition(currentEnd, dominoWidth, dominoHeight, isDouble, boardSize, margin, spacing) {
    let { x, y, direction } = currentEnd;
    let width = dominoWidth;
    let height = dominoHeight;
    let rotation = 0;
    let newDirection = direction;
    
    // Ajuster pour les doubles
    if (isDouble) {
      if (direction === 'left' || direction === 'right') {
        width = dominoHeight;
        height = dominoWidth;
        rotation = 90;
      }
    } else {
      // Domino normal selon la direction
      if (direction === 'up' || direction === 'down') {
        width = dominoHeight; 
        height = dominoWidth;
        rotation = 90;
      }
    }
    
    // Calculer position COLLÉE selon direction
    let newX, newY;
    
    switch (direction) {
      case 'right':
        newX = x + spacing;
        newY = y - height / 2;
        // Vérifier limite droite
        if (newX + width > boardSize.w - margin) {
          newDirection = 'down';
          newX = x - width / 2;
          newY = y + spacing;
          width = dominoHeight;
          height = dominoWidth; 
          rotation = 90;
        }
        break;
        
      case 'left':
        newX = x - width - spacing;
        newY = y - height / 2;
        // Vérifier limite gauche
        if (newX < margin) {
          newDirection = 'down';
          newX = x - width / 2;
          newY = y + spacing;
          width = dominoHeight;
          height = dominoWidth;
          rotation = 90;
        }
        break;
        
      case 'down':
        newX = x - width / 2;
        newY = y + spacing;
        // Vérifier limite bas
        if (newY + height > boardSize.h - margin) {
          newDirection = direction === 'right' ? 'left' : 'right';
          newX = direction === 'right' ? x - width - spacing : x + spacing;
          newY = y - height / 2;
          width = dominoWidth;
          height = dominoHeight;
          rotation = 0;
        }
        break;
        
      case 'up':
        newX = x - width / 2;
        newY = y - height - spacing;
        // Vérifier limite haut
        if (newY < margin) {
          newDirection = direction === 'right' ? 'left' : 'right';
          newX = direction === 'right' ? x - width - spacing : x + spacing;
          newY = y - height / 2;
          width = dominoWidth;
          height = dominoHeight;
          rotation = 0;
        }
        break;
    }
    
    // Calculer la nouvelle extrémité RÉELLE
    let newEnd;
    switch (newDirection) {
      case 'right':
        newEnd = { x: newX + width, y: newY + height / 2, direction: newDirection };
        break;
      case 'left':
        newEnd = { x: newX, y: newY + height / 2, direction: newDirection };
        break;
      case 'down':
        newEnd = { x: newX + width / 2, y: newY + height, direction: newDirection };
        break;
      case 'up':
        newEnd = { x: newX + width / 2, y: newY, direction: newDirection };
        break;
    }
    
    return {
      x: newX,
      y: newY, 
      width,
      height,
      rotation,
      newEnd
    };
  }

  // Algorithme de chaîne réelle qui se colle
  function calculateRealChainLayout(board, boardSize) {
    if (!board || board.length === 0) return [];
    
    const positions = [];
    const DOMINO_WIDTH = 60;
    const DOMINO_HEIGHT = 30;
    const SPACING = 2; // Très petit espace pour que ça se touche
    const MARGIN = 40;
    
    // Commencer au centre
    const centerX = boardSize.w / 2;
    const centerY = boardSize.h / 2;
    
    // Suivre les vraies extrémités de la chaîne
    let leftEnd = { x: centerX, y: centerY, direction: 'left' };
    let rightEnd = { x: centerX, y: centerY, direction: 'right' };
    
    board.forEach((piece, index) => {
      const values = GameLogic.extractDominoValues ? 
        GameLogic.extractDominoValues(piece) : 
        { a: piece[0], b: piece[1] };
      
      const isDouble = values.a === values.b;
      
      let width = isDouble ? DOMINO_HEIGHT : DOMINO_WIDTH;
      let height = isDouble ? DOMINO_WIDTH : DOMINO_HEIGHT;
      let rotation = isDouble ? 90 : 0;
      let x, y;
      
      if (index === 0) {
        // Premier domino au centre
        x = centerX - width / 2;
        y = centerY - height / 2;
        
        // Initialiser les extrémités réelles
        leftEnd = { x: x, y: y + height / 2, direction: 'left' };
        rightEnd = { x: x + width, y: y + height / 2, direction: 'right' };
        
      } else {
        // Alterner entre gauche et droite pour équilibrer
        const addToRight = index % 2 === 1;
        
        if (addToRight) {
          // Ajouter à droite - SE COLLER au dernier domino
          const result = getNextPosition(rightEnd, width, height, isDouble, boardSize, MARGIN, SPACING);
          x = result.x;
          y = result.y;
          rotation = result.rotation;
          width = result.width;
          height = result.height;
          
          // Mettre à jour l'extrémité droite RÉELLE
          rightEnd = result.newEnd;
          
        } else {
          // Ajouter à gauche - SE COLLER au premier domino  
          const result = getNextPosition(leftEnd, width, height, isDouble, boardSize, MARGIN, SPACING);
          x = result.x;
          y = result.y; 
          rotation = result.rotation;
          width = result.width;
          height = result.height;
          
          // Mettre à jour l'extrémité gauche RÉELLE
          leftEnd = result.newEnd;
        }
      }
      
      positions.push({ x, y, width, height, rotation });
    });
    
    return positions;
  }

  useEffect(() => {
    if (board && board.length > 0) {
      console.log('🎯 Calcul positions avec chaîne réelle:', { board, boardSize });
      
      // Utiliser la logique de chaîne réelle
      const positions = calculateRealChainLayout(board, boardSize);
      
      setDominoPositions(positions);
      console.log('✅ Positions calculées:', positions.length);
    } else {
      setDominoPositions([]);
    }
  }, [board, boardSize]);

  console.log('🎲 Board (Real Chain):', { 
    boardLength: board?.length, 
    boardSize, 
    positionsCount: dominoPositions.length 
  });

  const isEmpty = !board || board.length === 0;

  return (
    <View style={S.boardArea} onLayout={onLayout}>
      
      <View style={S.debugInfo} pointerEvents="none">
        <Text style={S.debugText}>
          🔗 {board?.length || 0} dominos (chaîne) | {boardSize.w?.toFixed(0)}×{boardSize.h?.toFixed(0)}
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
          minHeight: Math.max(600, dominoPositions.length > 0 ? Math.max(...dominoPositions.map(p => p.y + p.height)) + 100 : 600),
          minWidth: Math.max(800, dominoPositions.length > 0 ? Math.max(...dominoPositions.map(p => p.x + p.width)) + 100 : 800)
        }]}
        horizontal={true}
        showsHorizontalScrollIndicator={true}
        showsVerticalScrollIndicator={true}
        minimumZoomScale={0.3}
        maximumZoomScale={3.0}
        bouncesZoom
      >
        <View style={S.gameArea}>
          
          {isEmpty && (
            <View style={S.emptyBoard}>
              <View style={S.emptyIcon}>
                <Text style={S.emptyIconTxt}>🔗</Text>
              </View>
              <Text style={S.emptyTxt}>Posez le premier domino</Text>
              <Text style={S.emptyHint}>
                {isMyTurn 
                  ? 'Les dominos formeront une chaîne'
                  : 'En attente du premier joueur...'
                }
              </Text>
            </View>
          )}

          {dominoPositions.map((position, i) => {
            const tile = board[i];
            if (!tile) return null;
            
            const values = GameLogic.extractDominoValues ? 
              GameLogic.extractDominoValues(tile) : 
              { a: tile[0], b: tile[1] };

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
              board={board}
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
            <Text style={S.centerIcon}>🔗</Text>
            <Text style={S.centerText}>COMMENCER LA CHAÎNE</Text>
            <Text style={S.centerHint}>Premier domino au centre</Text>
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

function DominoPreview({ piece, boardEnds, showLeft, showRight, positions, board }) {
  if (!piece || !positions || positions.length === 0) return null;

  const lastPosition = positions[positions.length - 1];
  const firstPosition = positions[0];
  
  const values = GameLogic.extractDominoValues ? 
    GameLogic.extractDominoValues(piece) : 
    { a: piece[0], b: piece[1] };
  
  const isDouble = values.a === values.b;
  const previewWidth = isDouble ? 30 : 60;
  const previewHeight = isDouble ? 60 : 30;

  return (
    <>
      {showLeft && firstPosition && (
        <View style={[
          S.previewDomino,
          {
            left: firstPosition.x - previewWidth - 15,
            top: firstPosition.y,
          }
        ]}>
          <DominoFace
            a={values.a}
            b={values.b}
            w={previewWidth}
            h={previewHeight}
            vertical={isDouble}
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
            a={values.a}
            b={values.b}
            w={previewWidth}
            h={previewHeight}
            vertical={isDouble}
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
