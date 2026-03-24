import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { BoardArea } from './board';
import { HandArea } from './hand';
import { C } from './domino';

// Note: Importe ici ton écran d'accueil sublime (Home.js par exemple)
// import HomeScreen from './HomeScreen'; 

export default function App() {
  const [gameState, setGameState] = useState('GAME'); // 'HOME' ou 'GAME'
  const [board, setBoard] = useState([]);
  const [myHand, setMyHand] = useState([[6,6], [6,5], [1,2], [3,3], [0,0]]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [boardSize, setBoardSize] = useState({ w: 0, h: 0 });

  // Simulation d'un tour
  const isMyTurn = true;

  const handleLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setBoardSize({ w: width, h: height });
  };

  const onSelectPiece = (index) => {
    setSelectedIdx(index === selectedIdx ? null : index);
  };

  const canPlay = (piece) => {
    // Logique de validation simple (à lier avec ton server.js)
    return true; 
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      
      {gameState === 'GAME' ? (
        <View style={styles.gameContainer}>
          {/* ZONE DE JEU (PLATEAU) */}
          <BoardArea 
            board={board} 
            boardSize={boardSize} 
            onLayout={handleLayout} 
          />

          {/* ZONE INTERACTIVE (MAIN DU JOUEUR) */}
          <HandArea 
            myHand={myHand}
            isMyTurn={isMyTurn}
            selectedIdx={selectedIdx}
            onSelect={onSelectPiece}
            canPlay={canPlay}
          />
        </View>
      ) : (
        /* Ton écran d'accueil sublime reste ici */
        <View style={{flex: 1, backgroundColor: C.bg}} /> 
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
  },
  gameContainer: {
    flex: 1,
    backgroundColor: '#0f1f0f', // Le vert "Felt" de ta palette
  }
});
