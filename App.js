import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Text } from 'react-native';
import { BoardArea } from './board';
import { HandArea } from './hand';
import { C } from './domino';

export default function App() {
  const [screen, setScreen] = useState('HOME'); 
  const [board, setBoard] = useState([]); 
  const [myHand, setMyHand] = useState([[6,6], [6,1], [4,3], [2,2], [5,0]]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [boardSize, setBoardSize] = useState({ w: 0, h: 0 });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {screen === 'HOME' ? (
        <View style={styles.homeContainer}>
          {/* COLLE TON DESIGN D'ACCUEIL SUBLIME ICI */}
          <Text style={{color: C.gold, fontSize: 30, marginBottom: 40}}>DOMINO ROYAL</Text>
          <TouchableOpacity style={styles.playBtn} onPress={() => setScreen('GAME')}>
            <Text style={styles.playText}>COMMENCER</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.gameContainer}>
          <BoardArea 
            board={board} 
            boardSize={boardSize} 
            onLayout={(e) => setBoardSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })} 
          />
          <HandArea 
            myHand={myHand}
            isMyTurn={true}
            selectedIdx={selectedIdx}
            onSelect={(idx) => setSelectedIdx(idx)}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  homeContainer: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  gameContainer: { flex: 1, backgroundColor: C.bg },
  playBtn: { padding: 20, borderColor: C.gold, borderWidth: 2, borderRadius: 10 },
  playText: { color: C.gold, fontWeight: 'bold', fontSize: 20 }
});
