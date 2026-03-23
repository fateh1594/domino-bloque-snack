// Board.js
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Domino from './Domino';

export default function Board({ board }) {
  const { width, height } = Dimensions.get('window');

  return (
    <View style={[styles.board, { width, height: height * 0.6 }]}>
      {board.map((item, idx) => (
        <View
          key={idx}
          style={{
            position: 'absolute',
            left: item.x,
            top: item.y,
            transform: [{ rotate: `${item.rotation}deg` }],
          }}
        >
          <Domino value={item.piece} rotation={item.rotation} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    backgroundColor: '#004d00', // vert foncé du plateau
    borderColor: '#d4af37',     // doré pour les bordures
    borderWidth: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
});
