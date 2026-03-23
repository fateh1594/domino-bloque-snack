// Domino.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Domino({ value, rotation = 0, size = 80, isSelected = false }) {
  // value = [valeur1, valeur2]
  const styles = StyleSheet.create({
    domino: {
      width: rotation % 180 === 0 ? size * 2 : size,
      height: rotation % 180 === 0 ? size : size * 2,
      backgroundColor: '#006400', // vert foncé
      borderColor: '#FFD700',     // doré
      borderWidth: 3,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: rotation % 180 === 0 ? 'row' : 'column',
      padding: 5,
      margin: 4,
      opacity: isSelected ? 0.7 : 1,
    },
    half: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      color: '#FFD700',
      fontSize: size / 3,
      fontWeight: 'bold',
    },
  });

  return (
    <View style={styles.domino}>
      <View style={styles.half}>
        <Text style={styles.text}>{value[0]}</Text>
      </View>
      <View style={styles.half}>
        <Text style={styles.text}>{value[1]}</Text>
      </View>
    </View>
  );
}
