// Hand.js
import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Domino from './Domino';

export default function Hand({ hand, onPlay }) {
  const [selectedIdx, setSelectedIdx] = useState(null);

  const handleSelect = (idx) => {
    setSelectedIdx(idx === selectedIdx ? null : idx);
  };

  const handlePlay = () => {
    if (selectedIdx !== null) {
      onPlay(hand[selectedIdx]);
      setSelectedIdx(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal contentContainerStyle={styles.scroll}>
        {hand.map((domino, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleSelect(idx)}
            onLongPress={handlePlay} // joue le domino avec un appui long
          >
            <Domino value={domino} isSelected={idx === selectedIdx} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 120,
    paddingVertical: 5,
    backgroundColor: '#004d00', // vert foncé pour la main
  },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
});
