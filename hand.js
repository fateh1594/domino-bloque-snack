import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DominoFace, C, HDW, HDH, HPAD, HGAP } from './domino';
import { GameLogic } from './utils/GameLogic'; // ← Nouvelle logique

export function HiddenDomino({ w, h }) {
  return (
    <View style={[S.hiddenDomino, { width: w, height: h }]}>
      <View style={S.hiddenPattern} />
    </View>
  );
}

export function HandArea({
  myHand, me, isMyTurn, needToDraw, pioireLeft,
  selectedIdx, currentTurn, players, canPlay,
  onSelect, onDraw, onCancelSelect,
}) {
  const currentPlayer = players.find(p => p.id === currentTurn);
  
  // Calculer les statistiques de la main
  const handScore = GameLogic.calculateHandScore(myHand);
  const playableCount = myHand.filter(piece => canPlay(piece)).length;
  
  console.log('🎲 Hand render:', {
    isMyTurn,
    needToDraw,
    pioireLeft,
    selectedIdx,
    handLength: myHand?.length || 0,
    playableCount,
    handScore
  });

  return (
    <View style={S.handArea}>
      <View style={S.playerInfo}>
        <View style={[S.myAvatar, isMyTurn && S.myAvatarActive]}>
          <Text style={S.myAvatarTxt}>{me?.name?.[0]?.toUpperCase() || '?'}</Text>
          {isMyTurn && <View style={S.myTurnRing} />}
        </View>
        
        <View style={S.playerDetails}>
          <Text style={S.myName}>{me?.name || 'Joueur'}</Text>
          <Text style={S.turnInfo}>
            {isMyTurn ? (
              needToDraw ? '🎲 Piochez une carte' : `🎯 À vous (${playableCount} jouables)`
            ) : (
              `Tour de ${currentPlayer?.name || 'adversaire'}`
            )}
          </Text>
          <Text style={S.handStats}>
            {myHand.length} domino{myHand.length > 1 ? 's' : ''} • {handScore} points
          </Text>
        </View>

        {/* Bouton piocher amélioré */}
        {needToDraw && pioireLeft > 0 && (
          <TouchableOpacity 
            style={S.drawBtn} 
            onPress={() => {
              console.log('🎲 Clic pioche - needToDraw:', needToDraw, 'pioireLeft:', pioireLeft);
              onDraw();
            }}
          >
            <Text style={S.drawIcon}>🎲</Text>
            <Text style={S.drawText}>PIOCHER</Text>
            <Text style={S.drawCount}>({pioireLeft})</Text>
          </TouchableOpacity>
        )}

        {/* Bouton annuler amélioré */}
        {selectedIdx !== null && (
          <TouchableOpacity style={S.cancelBtn} onPress={onCancelSelect}>
            <Text style={S.cancelText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main du joueur avec indicateurs améliorés */}
      <View style={S.handRow}>
        {myHand.map((piece, idx) => {
          const isSelected = selectedIdx === idx;
          const isPlayable = canPlay(piece);
          const isDouble = piece[0] === piece[1];
          
          return (
            <TouchableOpacity
              key={`hand-${idx}-${piece[0]}-${piece[1]}`}
              style={[
                S.handPiece,
                isSelected && S.handPieceSelected,
                !isPlayable && S.handPieceDisabled,
              ]}
              onPress={() => {
                console.log('🎯 Clic domino:', { idx, piece, isPlayable, isMyTurn });
                onSelect(idx);
              }}
              disabled={!isMyTurn && !isPlayable}
            >
              <DominoFace
                a={piece[0]}
                b={piece[1]}
                w={HDW}
                h={HDH}
                vertical={true}
                borderColor={isSelected ? C.gold : (isPlayable ? '#333' : '#666')}
                borderWidth={isSelected ? 3 : 2}
                extraStyle={{
                  opacity: isPlayable || isMyTurn ? 1 : 0.4,
                }}
              />
              
              {/* Glow de sélection */}
              {isSelected && <View style={S.selectedGlow} />}
              
              {/* Indicateurs visuels améliorés */}
              {isMyTurn && (
                <>
                  {/* Indicateur de jouabilité */}
                  <View style={[
                    S.playIndicator,
                    { backgroundColor: isPlayable ? C.green : '#666' }
                  ]} />
                  
                  {/* Badge pour les doubles */}
                  {isDouble && (
                    <View style={S.doubleBadge}>
                      <Text style={S.doubleBadgeText}>×2</Text>
                    </View>
                  )}
                  
                  {/* Valeur totale du domino */}
                  <View style={S.valueBadge}>
                    <Text style={S.valueBadgeText}>{piece[0] + piece[1]}</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Aide contextuelle */}
      {isMyTurn && (
        <View style={S.helpRow}>
          {selectedIdx !== null ? (
            <Text style={S.helpText}>
              {myHand[selectedIdx][0] === myHand[selectedIdx][1] 
                ? '🔄 Double - Se place perpendiculairement'
                : '◀️ ▶️ Choisissez le côté pour placer ce domino'
              }
            </Text>
          ) : playableCount === 0 ? (
            <Text style={S.helpTextError}>
              ❌ Aucun domino jouable - {pioireLeft > 0 ? 'Piochez' : 'Passez votre tour'}
            </Text>
          ) : (
            <Text style={S.helpText}>
              ✨ {playableCount} domino{playableCount > 1 ? 's' : ''} jouable{playableCount > 1 ? 's' : ''} - Sélectionnez pour jouer
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const S = StyleSheet.create({
  handArea: {
    backgroundColor: 'rgba(6,14,6,0.95)',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: HPAD,
  },

  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },

  myAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(201,168,76,0.2)',
    borderWidth: 2,
    borderColor: C.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  myAvatarActive: {
    borderColor: C.gold,
    backgroundColor: 'rgba(201,168,76,0.3)',
  },

  myAvatarTxt: {
    fontSize: 18,
    fontWeight: '800',
    color: C.gold,
  },

  myTurnRing: {
    position: 'absolute',
    top: -4, left: -4, right: -4, bottom: -4,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: C.gold,
  },

  playerDetails: {
    flex: 1,
  },

  myName: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
    marginBottom: 2,
  },

  turnInfo: {
    fontSize: 12,
    color: C.dim,
    fontWeight: '600',
  },

  handStats: {
    fontSize: 10,
    color: C.goldDim,
    fontWeight: '600',
    marginTop: 2,
  },

  drawBtn: {
    backgroundColor: C.gold,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 80,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },

  drawIcon: {
    fontSize: 18,
    marginBottom: 2,
  },

  drawText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1a1200',
    letterSpacing: 1,
  },

  drawCount: {
    fontSize: 8,
    color: '#444',
    fontWeight: '600',
  },

  cancelBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(224,92,92,0.8)',
    borderWidth: 1,
    borderColor: '#e05c5c',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },

  handRow: {
    flexDirection: 'row',
    gap: HGAP,
    justifyContent: 'center',
  },

  handPiece: {
    position: 'relative',
  },

  handPieceSelected: {
    transform: [{ translateY: -8 }],
  },

  handPieceDisabled: {
    opacity: 0.4,
  },

  selectedGlow: {
    position: 'absolute',
    top: -4, left: -4, right: -4, bottom: -4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: C.gold,
    backgroundColor: 'rgba(201,168,76,0.1)',
  },

  // Nouveaux indicateurs visuels
  playIndicator: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  doubleBadge: {
    position: 'absolute',
    top: -6,
    left: -6,
    backgroundColor: C.gold,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },

  doubleBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#1a1200',
  },

  valueBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },

  valueBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: C.gold,
  },

  helpRow: {
    paddingTop: 8,
    paddingHorizontal: 4,
  },

  helpText: {
    fontSize: 11,
    color: C.dim,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  helpTextError: {
    fontSize: 11,
    color: C.red,
    textAlign: 'center',
    fontWeight: '600',
  },

  hiddenDomino: {
    backgroundColor: C.goldDim,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: C.gold,
    position: 'relative',
    overflow: 'hidden',
  },

  hiddenPattern: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(201,168,76,0.3)',
  },
});
