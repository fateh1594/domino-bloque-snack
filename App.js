// App.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, SafeAreaView } from 'react-native';
import io from 'socket.io-client';
import Hand from './Hand';
import Board from './Board';

// ─── Configuration du serveur ─────────────────────────────
const SERVER_URL = 'https://domino-bloque-server.onrender.com';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [hand, setHand] = useState([]);
  const [board, setBoard] = useState([]);
  const [boardEnds, setBoardEnds] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [joined, setJoined] = useState(false);
  const [roomCode, setRoomCode] = useState(null);

  // ─── Connexion Socket.IO ────────────────────────────────
  useEffect(() => {
    const s = io(SERVER_URL);
    setSocket(s);

    s.on('connect', () => {
      setPlayerId(s.id);
      console.log('Connecté au serveur avec id:', s.id);
    });

    s.on('room_joined', ({ hand: h, board: b, currentTurn: ct }) => {
      setJoined(true);
      setHand(h);
      setBoard(b);
      setBoardEnds(null);
      setCurrentTurn(ct);
    });

    s.on('manche_start', ({ hand: h, board: b, boardEnds: be, currentTurn: ct }) => {
      setHand(h);
      setBoard(b);
      setBoardEnds(be);
      setCurrentTurn(ct);
    });

    s.on('piece_played', ({ board: b, boardEnds: be, handCounts }) => {
      setBoard(b);
      setBoardEnds(be);
      // Mettre à jour la main locale si c'est le joueur
      if (hand.length !== handCounts[playerId]) {
        setHand(prev => prev.filter((_, i) => i < handCounts[playerId]));
      }
    });

    s.on('hand_update', ({ hand: h }) => setHand(h));
    s.on('turn_change', ({ currentTurn: ct }) => setCurrentTurn(ct));

    s.on('game_over', ({ winTeam, scores }) => {
      Alert.alert('Partie terminée', `Équipe gagnante: ${winTeam}\nScores: ${JSON.stringify(scores)}`);
    });

    return () => s.disconnect();
  }, []);

  // ─── Fonctions jeu ─────────────────────────────────────
  const joinRoom = () => {
    if (!socket) return;
    const name = 'Player';
    const code = 'ROOM1'; // exemple de code fixe
    setRoomCode(code);
    socket.emit('join_room', { name, code });
  };

  const playDomino = (piece) => {
    if (!socket || currentTurn !== playerId) return;
    socket.emit('play_piece', { code: roomCode, piece, side: 'right' });
  };

  const drawDomino = () => {
    if (!socket || currentTurn !== playerId) return;
    socket.emit('draw_piece', { code: roomCode });
  };

  return (
    <SafeAreaView style={styles.container}>
      {!joined ? (
        <Button title="Rejoindre la salle" onPress={joinRoom} />
      ) : (
        <>
          <Text style={styles.info}>
            {currentTurn === playerId ? 'Votre tour' : "Tour de l'adversaire"}
          </Text>
          <Board board={board} />
          <Hand hand={hand} onPlay={playDomino} />
          {currentTurn === playerId && <Button title="Piocher un domino" onPress={drawDomino} />}
        </>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#004d00', // vert foncé
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 30,
  },
  info: {
    color: '#FFD700', // doré
    fontSize: 18,
    marginVertical: 5,
    fontWeight: 'bold',
  },
});
