import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DominoFace } from './domino';

export const BoardArea = ({ board, boardSize, onLayout }) => {
  const scale = boardSize.w > 0 ? Math.min(boardSize.w / 1000, boardSize.h / 600) : 1;
  const offX = (boardSize.w - 1000 * scale) / 2;
  const offY = (boardSize.h - 600 * scale) / 2;

  return (
    <View style={styles.container} onLayout={onLayout}>
      {board.map((tile, i) => {
        const isVert = tile.rotation === 90;
        return (
          <View key={i} style={{ position: 'absolute', left: (tile.x * scale) + offX, top: (tile.y * scale) + offY }}>
            <DominoFace a={tile.piece[0]} b={tile.piece[1]} w={(isVert ? 100 : 200) * scale} h={(isVert ? 200 : 100) * scale} vertical={isVert} />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 15, margin: 10 }
});
