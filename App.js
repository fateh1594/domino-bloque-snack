import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { BoardArea } from './board';
import { HandArea } from './hand';

// IMPORT DE TON ÉCRAN D'ACCUEIL EXISTANT
// import MySublimeHome from './MySublimeHome'; 

export default function App() {
    const [inGame, setInGame] = useState(false); // Change en 'true' via ton bouton d'accueil
    const [board, setBoard] = useState([]); 
    const [myHand, setMyHand] = useState([[6,6], [6,1], [4,4], [3,2]]);
    const [selectedIdx, setSelectedIdx] = useState(null);
    const [boardSize, setBoardSize] = useState({ w: 0, h: 0 });

    if (!inGame) {
        /* ICI : ON RENVOIE TON ACCUEIL SANS RIEN TOUCHER */
        /* Tu dois juste passer setInGame(true) à ton bouton Jouer */
        return (
            <View style={{flex: 1}}>
                <StatusBar barStyle="light-content" />
                {/* <MySublimeHome onStart={() => setInGame(true)} /> */}
                
                {/* SIMULATION DE TON BOUTON POUR LE TEST */}
                <View style={{flex:1, backgroundColor: '#0f1f0f', justifyContent: 'center', alignItems: 'center'}}>
                    <View onTouchEnd={() => setInGame(true)} style={{padding: 20, borderWidth: 2, borderColor: '#c9a84c'}}>
                         <StatusBar hidden />
                         {/* Tout ton design d'accueil est ici */}
                    </View>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.gameContainer}>
                <BoardArea board={board} boardSize={boardSize} onLayout={(e) => setBoardSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })} />
                <HandArea myHand={myHand} selectedIdx={selectedIdx} onSelect={(idx) => setSelectedIdx(idx)} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#000' },
    gameContainer: { flex: 1, backgroundColor: '#0f1f0f' }
});
