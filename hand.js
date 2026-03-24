import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DominoFace, C, HDW, HDH, HPAD, HGAP } from './domino';

// ── Domino dans la main du joueur ─────────────────────────────────────────────
export function HandDomino({ piece, playable, isMyTurn, selected, onPress }) {
  const borderColor = selected
    ? C.gold
    : (playable && isMyTurn) ? C.green : '#aaa';
  const borderWidth = selected ? 3 : (playable && isMyTurn) ? 2 : 1.5;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{ marginHorizontal: HGAP / 2 }}
    >
      <DominoFace
        a={piece[0]} b={piece[1]}
        w={HDW} h={HDH}
        vertical={true}
        borderColor={borderColor}
        borderWidth={borderWidth}
        extraStyle={{
          opacity:       (!playable && isMyTurn) ? 0.25 : 1,
          transform:     [{ translateY: selected ? -16 : 0 }],
          elevation:     selected ? 16 : 5,
          backgroundColor: selected ? '#fffdf5' : C.domino,
          shadowColor:   selected ? C.gold : '#000',
          shadowOpacity: selected ? 0.55 : 0.22,
          shadowRadius:  selected ? 10 : 4,
          shadowOffset:  { width: 0, height: selected ? 6 : 2 },
        }}
      />
      {/* Indicateur jouable */}
      {playable && isMyTurn && !selected && (
        <View style={S.playableDot} />
      )}
    </TouchableOpacity>
  );
}

// ── Domino pioche (dos) ───────────────────────────────────────────────────────
export function PiocheDomino({ onPress, count }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={S.piocheWrap}>
      {/* Effet pile : 2 dominos décalés derrière */}
      <View style={[S.piocheBack, { top: 4, left: 4 }]} />
      <View style={[S.piocheBack, { top: 2, left: 2 }]} />

      {/* Domino principal */}
      <View style={S.piocheMain}>
        {/* Motif dos */}
        <View style={S.piochePattern}>
          {[...Array(3)].map((_, r) => (
            <View key={r} style={S.piochePatternRow}>
              {[...Array(2)].map((_, c) => (
                <View key={c} style={S.piocheDot} />
              ))}
            </View>
          ))}
        </View>
        <Text style={S.piocheTxt}>PIOCHER</Text>
        {count !== undefined && (
          <View style={S.piocheBadge}>
            <Text style={S.piocheBadgeTxt}>{count}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Domino caché adversaire ───────────────────────────────────────────────────
export function HiddenDomino({ w = 16, h = 30 }) {
  return (
    <View style={{
      width:           w,
      height:          h,
      backgroundColor: '#1a4221',
      borderRadius:    3,
      borderWidth:     1,
      borderColor:     '#2e6e36',
      marginHorizontal:1,
      elevation:       2,
      shadowColor:     '#000',
      shadowOpacity:   0.3,
      shadowRadius:    2,
      shadowOffset:    { width: 0, height: 1 },
    }}>
      {/* Petit reflet */}
      <View style={{
        position:            'absolute',
        top: 1, left: 1, right: 1,
        height:              '35%',
        backgroundColor:     'rgba(255,255,255,0.07)',
        borderTopLeftRadius: 2,
        borderTopRightRadius:2,
      }} />
    </View>
  );
}

// ── Zone main du joueur ───────────────────────────────────────────────────────
export function HandArea({
  myHand, me, isMyTurn, needToDraw, pioireLeft,
  selectedIdx, currentTurn, players,
  canPlay, onSelect, onDraw, onCancelSelect,
}) {
  const infoText = needToDraw
    ? '🂠 Pioche un domino'
    : isMyTurn
      ? selectedIdx !== null
        ? 'Choisissez un côté ⬆'
        : '🎯 Appuyez sur un domino'
      : `Tour de ${players.find(x => x.id === currentTurn)?.name || '…'}`;

  return (
    <View style={S.handArea}>
      {/* Header */}
      <View style={S.handHeader}>
        <View style={[S.myAv, isMyTurn && S.myAvActive]}>
          <Text style={S.myAvTxt}>{me?.name?.[0]?.toUpperCase() || 'M'}</Text>
          {isMyTurn && <View style={S.turnRing} />}
        </View>

        <Text style={S.handInfo} numberOfLines={1}>{infoText}</Text>

        {selectedIdx !== null && (
          <TouchableOpacity style={S.btnCancel} onPress={onCancelSelect}>
            <Text style={S.btnCancelTxt}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Rangée de dominos */}
      <View style={S.handRow}>
        {myHand.map((piece, i) => (
          <HandDomino
            key={`${i}-${piece[0]}-${piece[1]}`}
            piece={piece}
            playable={canPlay(piece)}
            isMyTurn={isMyTurn && !needToDraw}
            selected={selectedIdx === i}
            onPress={() => onSelect(i)}
          />
        ))}
        {needToDraw && (
          <PiocheDomino
            onPress={onDraw}
            count={pioireLeft}
          />
        )}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  playableDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: C.green,
    alignSelf:       'center',
    marginTop:       3,
  },

  piocheWrap: {
    width:    HDW + 6,
    height:   HDH + 6,
    position: 'relative',
    marginHorizontal: HGAP / 2,
  },
  piocheBack: {
    position:        'absolute',
    width:           HDW,
    height:          HDH,
    backgroundColor: '#122e16',
    borderRadius:    Math.max(4, HDW * 0.12),
    borderWidth:     1,
    borderColor:     '#1e4a22',
  },
  piocheMain: {
    position:        'absolute',
    top: 0, left: 0,
    width:           HDW,
    height:          HDH,
    backgroundColor: '#163a1c',
    borderRadius:    Math.max(4, HDW * 0.12),
    borderWidth:     2,
    borderColor:     C.gold,
    alignItems:      'center',
    justifyContent:  'center',
    elevation:       6,
    shadowColor:     C.gold,
    shadowOpacity:   0.3,
    shadowRadius:    6,
    shadowOffset:    { width: 0, height: 2 },
  },
  piochePattern: {
    gap:         4,
    marginBottom:6,
  },
  piochePatternRow: {
    flexDirection: 'row',
    gap:           6,
  },
  piocheDot: {
    width:           5,
    height:          5,
    borderRadius:    3,
    backgroundColor: 'rgba(201,168,76,0.4)',
  },
  piocheTxt: {
    color:       C.gold,
    fontSize:    8,
    fontWeight:  '700',
    letterSpacing:2,
  },
  piocheBadge: {
    position:        'absolute',
    top:             6,
    right:           6,
    backgroundColor: C.gold,
    borderRadius:    8,
    minWidth:        16,
    height:          16,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal:3,
  },
  piocheBadgeTxt: {
    color:      '#1a1200',
    fontSize:   9,
    fontWeight: '900',
  },

  handArea: {
    backgroundColor: 'rgba(6,14,6,0.95)',
    borderTopWidth:  1,
    borderTopColor:  C.border,
    paddingTop:      10,
    paddingBottom:   16,
  },
  handHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 14,
    marginBottom:   10,
    gap:            10,
  },
  myAv: {
    width:           34,
    height:          34,
    borderRadius:    17,
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderWidth:     2,
    borderColor:     C.goldDim,
    alignItems:      'center',
    justifyContent:  'center',
    position:        'relative',
  },
  myAvActive: {
    borderColor:     C.gold,
    backgroundColor: 'rgba(201,168,76,0.25)',
  },
  myAvTxt: {
    fontSize:   13,
    fontWeight: '700',
    color:      C.gold,
  },
  turnRing: {
    position:     'absolute',
    top: -4, left: -4, right: -4, bottom: -4,
    borderRadius: 999,
    borderWidth:  2,
    borderColor:  C.gold,
  },
  handInfo: {
    flex:       1,
    fontSize:   11,
    color:      C.text,
    fontWeight: '600',
  },
  btnCancel: {
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: 'rgba(200,60,60,0.25)',
    borderWidth:     1,
    borderColor:     C.red,
    alignItems:      'center',
    justifyContent:  'center',
  },
  btnCancelTxt: {
    fontSize:   16,
    fontWeight: '900',
    color:      C.red,
  },
  handRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'flex-end',
    paddingHorizontal: HPAD,
    flexWrap:       'wrap',
    gap:            2,
  },
});
