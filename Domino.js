import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Domino({ board }) {
  return (
    <View style={styles.board}>
      {board.map((d, i) => (
        <View
          key={i}
          style={[
            styles.domino,
            { 
              left: d.x, 
              top: d.y, 
              width: d.rotation === 90 ? 100 : 200,
              height: d.rotation === 90 ? 200 : 100,
              transform: [{ rotate: `${d.rotation}deg` }]
            }
          ]}
        >
          <Text style={styles.pip}>{d.piece[0]} | {d.piece[1]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    flex: 1,
    backgroundColor: '#0a5',
    position: 'relative',
  },
  domino: {
    position: 'absolute',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
  pip: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
