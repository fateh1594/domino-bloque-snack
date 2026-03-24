import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { DominoFace, C, HDW, HDH } from './domino';

export function HandArea({ myHand, onSelect, selectedIdx, isMyTurn }) {
    return (
        <View style={styles.container}>
            <Text style={styles.status}>{isMyTurn ? "À VOUS DE JOUER" : "ATTENTE..."}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {myHand.map((p, i) => (
                    <TouchableOpacity 
                        key={i} 
                        onPress={() => onSelect(i)}
                        style={{ marginHorizontal: 5, transform: [{ translateY: selectedIdx === i ? -15 : 0 }] }}
                    >
                        <DominoFace a={p[0]} b={p[1]} w={HDW} h={HDH} vertical={true} borderColor={selectedIdx === i ? C.gold : '#444'} borderWidth={selectedIdx === i ? 3 : 1} />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { height: 140, backgroundColor: '#0a140a', borderTopWidth: 1, borderColor: '#2e5c34' },
    status: { color: C.gold, textAlign: 'center', fontSize: 10, fontWeight: 'bold', marginVertical: 8 },
    scroll: { paddingHorizontal: 15, alignItems: 'center' }
});
