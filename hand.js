import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { DominoFace, C, HDW, HDH } from './domino';

export function HandArea({ myHand, onSelect, selectedIdx }) {
    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {myHand.map((p, i) => (
                    <TouchableOpacity key={i} onPress={() => onSelect(i)} style={{ marginHorizontal: 5, transform: [{ translateY: selectedIdx === i ? -10 : 0 }] }}>
                        <DominoFace a={p[0]} b={p[1]} w={HDW} h={HDH} vertical={true} borderColor={selectedIdx === i ? C.gold : '#444'} borderWidth={selectedIdx === i ? 2 : 1} />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { height: 120, backgroundColor: '#051005', borderTopWidth: 1, borderColor: '#1a3a1a' },
    scroll: { paddingHorizontal: 10, alignItems: 'center' }
});
