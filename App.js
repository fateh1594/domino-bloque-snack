import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Text } from 'react-native';
import { BoardArea } from './board';
import { HandArea } from './hand';
import { C } from './domino';

export default function App() {
    const [screen, setScreen] = useState('HOME'); 
    const [board, setBoard] = useState([]); 
    const [myHand, setMyHand] = useState([[6,6], [6,5], [4,2], [3,1], [0,0]]);
    const [selectedIdx, setSelectedIdx] = useState(null);
    const [boardSize, setBoardSize] = useState({ w: 0, h: 0 });

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" />

            {screen === 'HOME' ? (
                /* --- TON DESIGN D'ACCUEIL RESTE ICI --- */
                <View style={styles.homeContainer}>
                    <Text style={styles.logoText}>DOMINO ROYAL</Text>
                    <TouchableOpacity style={styles.playBtn} onPress={() => setScreen('GAME')}>
                        <Text style={styles.playBtnText}>JOUER MAINTENANT</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                /* --- MODE JEU --- */
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
    logoText: { color: C.gold, fontSize: 32, fontWeight: 'bold', marginBottom: 50 },
    playBtn: { paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, borderWidth: 2, borderColor: C.gold },
    playBtnText: { color: C.gold, fontSize: 18, fontWeight: 'bold' }
});
