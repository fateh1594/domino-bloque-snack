import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { DominoFace, C, HDW, HDH, HPAD, HGAP } from './domino';

export function HandArea({ myHand, onSelect, selectedIdx, isMyTurn, canPlay }) {
  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        {isMyTurn ? "À VOTRE TOUR" : "ATTENTE DE L'ADVERSAIRE..."}
      </Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scroll}
      >
        {myHand.map((piece, i) => {
          const isSelected = selectedIdx === i;
          const isPlayable = canPlay ? canPlay(piece) : true;
          
          return (
            <TouchableOpacity 
              key={i} 
              onPress={() => onSelect(i)}
              activeOpacity={0.8}
              style={[
                styles.dominoWrapper, 
                { transform: [{ translateY: isSelected ? -15 : 0 }] }
              ]}
            >
              <DominoFace 
                a={piece[0]} 
                b={piece[1]} 
                w={HDW} 
                h={HDH} 
                vertical={true}
                borderColor={isSelected ? C.gold : isPlayable ? '#444' : '#222'}
                borderWidth={isSelected ? 3 : 1}
                extraStyle={{ opacity: !isPlayable && isMyTurn ? 0.5 : 1 }}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 150,
    backgroundColor: 'rgba(10, 25, 10, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#2e5c34',
    paddingBottom: 10,
  },
  status: {
    color: C.gold,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  scroll: {
    paddingHorizontal: HPAD,
    alignItems: 'center',
    gap: HGAP,
  },
  dominoWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  }
});
