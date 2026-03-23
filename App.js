import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import io from 'socket.io-client';

// ─── URL de ton serveur Render ───────────────────────────────────────────────
const SERVER_URL = 'https://domino-bloque-server.onrender.com';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [hand, setHand] = useState([]);
  const [board, setBoard] = useState([]);
  const [boardEnds, setBoardEnds] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [players, setPlayers] = useState([]);
  const [roomCode, setRoomCode] = useState('');
  const [name, setName] = useState('Player');

  useEffect(() => {
    const s = io(SERVER_URL);
    setSocket(s);

    // ─── Événements du serveur ─────────────────────────────────────────────
    s.on('room_created', ({ code, player, players }) => {
      setRoomCode(code);
      setPlayers(players);
      console.log('Salle créée:', code);
    });

    s.on('room_joined', ({ player, players }) => {
      setPlayers(players);
      console.log('Salle rejointe:', player);
    });

    s.on('player_joined', ({ players }) => {
      setPlayers(players);
    });

    s.on('manche_start', ({ hand, currentTurn, board, boardEnds, scores }) => {
      setHand(hand);
      setBoard(board);
      setBoardEnds(boardEnds);
      setCurrentTurn(currentTurn);
    });

    s.on('piece_played', ({ board, boardEnds, handCounts }) => {
      setBoard(board);
      setBoardEnds(boardEnds);
      console.log('Mains mises à jour:', handCounts);
    });

    s.on('hand_update', ({ hand }) => {
      setHand(hand);
    });

    s.on('turn_change', ({ currentTurn }) => {
      setCurrentTurn(currentTurn);
    });

    s.on('game_over', ({ winTeam, scores }) => {
      alert(`Fin de partie ! Équipe gagnante : ${winTeam}`);
    });

    return () => s.disconnect();
  }, []);

  // ─── Fonctions pour créer / rejoindre salle ───────────────────────────────
  const createRoom = () => {
    if (!socket) return;
    socket.emit('create_room', { name, maxPlayers: 2 });
  };

  const joinRoom = (code) => {
    if (!socket) return;
    socket.emit('join_room', { name, code });
  };

  // ─── Jouer un domino ───────────────────────────────────────────────────────
  const playPiece = (piece) => {
    if (!socket || currentTurn !== socket.id) return;
    socket.emit('play_piece', { code: roomCode, piece, side: 'right' });
  };

  // ─── Tirer un domino ───────────────────────────────────────────────────────
  const drawPiece = () => {
    if (!socket) return;
    socket.emit('draw_piece', { code: roomCode });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Domino Bloqué</Text>
      <Button title="Créer salle" onPress={createRoom} />
      <Button title="Rejoindre salle" onPress={() => joinRoom(roomCode)} />
      <Text>Code salle : {roomCode}</Text>
      <Text>Joueurs : {players.map(p => p.name).join(', ')}</Text>
      <Text>Tour actuel : {currentTurn}</Text>

      <Text style={styles.subtitle}>Votre main :</Text>
      <FlatList
        data={hand}
        horizontal
        keyExtractor={(item, idx) => idx.toString()}
        renderItem={({ item }) => (
          <Button
            title={`${item[0]}|${item[1]}`}
            onPress={() => playPiece(item)}
          />
        )}
      />

      <Button title="Piocher" onPress={drawPiece} />

      <Text style={styles.subtitle}>Plateau :</Text>
      <View style={styles.board}>
        {board.map((d, idx) => (
          <Text key={idx}>{`${d.piece[0]}|${d.piece[1]}`}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, marginTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  subtitle: { fontSize: 18, marginTop: 20 },
  board: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap' },
});
