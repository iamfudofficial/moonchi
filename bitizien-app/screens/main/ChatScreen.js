import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';
import { AuthContext } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Server-URL für Socket.io - sollte mit der API_URL übereinstimmen
const SERVER_URL = 'http://192.168.178.29:5000';

const ChatScreen = () => {
  const { userData, userToken } = useContext(AuthContext);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  // Socket.io-Verbindung herstellen
  useEffect(() => {
    const connectSocket = async () => {
      try {
        // Token aus Context oder AsyncStorage holen
        const token = userToken || await AsyncStorage.getItem('authToken');
        
        if (!token) {
          setConnectionError('Nicht angemeldet. Bitte logge dich ein, um den Chat zu nutzen.');
          setIsConnecting(false);
          return;
        }
        
        console.log('Versuche Socket.io-Verbindung mit Token:', token.substring(0, 15) + '...');
        
        // Socket initialisieren
        socketRef.current = io(SERVER_URL, {
          auth: {
            token: token
          },
          transports: ['websocket'],
          timeout: 10000
        });
        
        // Verbindungsereignisse
        socketRef.current.on('connect', () => {
          console.log('Socket.io verbunden!');
          setIsConnecting(false);
          setConnectionError(null);
        });
        
        socketRef.current.on('connect_error', (error) => {
          console.error('Socket.io Verbindungsfehler:', error);
          setIsConnecting(false);
          setConnectionError(`Verbindung zum Chat-Server fehlgeschlagen: ${error.message}`);
        });
        
        socketRef.current.on('disconnect', () => {
          console.log('Socket.io getrennt');
        });
        
        // Chat-Ereignisse
        socketRef.current.on('globalMessage', (newMessage) => {
          console.log('Neue globale Nachricht erhalten:', newMessage);
          setMessages((prevMessages) => [newMessage, ...prevMessages]);
        });
        
        socketRef.current.on('userList', (users) => {
          console.log('Aktive Benutzer aktualisiert:', users);
          setActiveUsers(users);
        });
        
        socketRef.current.on('error', (errorMsg) => {
          console.error('Socket.io Fehler:', errorMsg);
          Alert.alert('Fehler', errorMsg);
        });
      } catch (error) {
        console.error('Fehler beim Initialisieren der Socket.io-Verbindung:', error);
        setIsConnecting(false);
        setConnectionError(`Fehler beim Verbinden: ${error.message}`);
      }
    };
    
    connectSocket();
    
    // Aufräumen beim Unmounten
    return () => {
      if (socketRef.current) {
        console.log('Socket.io-Verbindung wird geschlossen');
        socketRef.current.disconnect();
      }
    };
  }, [userToken]);

  // Nachricht senden
  const sendMessage = () => {
    if (!message.trim() || !socketRef.current) return;
    
    console.log('Sende Nachricht:', message);
    socketRef.current.emit('globalMessage', message);
    setMessage('');
  };

  // Formatiere Zeitstempel
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isConnecting) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.statusText}>Verbinde mit dem Chat-Server...</Text>
      </View>
    );
  }

  if (connectionError) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
        <Text style={[styles.statusText, styles.errorText]}>{connectionError}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setIsConnecting(true);
            socketRef.current.connect();
          }}
        >
          <Text style={styles.retryButtonText}>Erneut versuchen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.activeUsersContainer}>
        <Text style={styles.activeUsersTitle}>
          Aktive Benutzer ({activeUsers.length})
        </Text>
        <FlatList
          horizontal
          data={activeUsers}
          keyExtractor={(item) => item.socketId}
          renderItem={({ item }) => (
            <View style={styles.userBadge}>
              <Text style={styles.userBadgeText}>{item.username}</Text>
              {item.role === 'admin' && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
            </View>
          )}
          contentContainerStyle={styles.usersList}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[
            styles.messageContainer,
            item.senderId === userData?.id && styles.ownMessageContainer
          ]}>
            <View style={styles.messageHeader}>
              <Text style={styles.messageSender}>
                {item.sender}
                {item.senderRole === 'admin' && (
                  <Text style={styles.adminTag}> (Admin)</Text>
                )}
              </Text>
              <Text style={styles.messageTime}>
                {formatTimestamp(item.createdAt)}
              </Text>
            </View>
            <Text style={styles.messageContent}>{item.content}</Text>
          </View>
        )}
        contentContainerStyle={styles.messagesList}
        inverted
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nachricht schreiben..."
          placeholderTextColor="#a0a0a0"
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={!message.trim()}
        >
          <Ionicons
            name="send"
            size={24}
            color={message.trim() ? "#fff" : "#666"}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  statusText: {
    marginTop: 15,
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
  },
  errorText: {
    color: '#ff6b6b',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#6200ee',
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeUsersContainer: {
    padding: 15,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  activeUsersTitle: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 10,
  },
  usersList: {
    paddingRight: 10,
  },
  userBadge: {
    backgroundColor: '#2c2c2c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userBadgeText: {
    color: '#fff',
    fontSize: 14,
  },
  adminBadge: {
    backgroundColor: '#6200ee',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 6,
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  messagesList: {
    padding: 15,
  },
  messageContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  ownMessageContainer: {
    backgroundColor: '#6200ee',
    alignSelf: 'flex-end',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  messageSender: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  adminTag: {
    color: '#ff9800',
  },
  messageTime: {
    color: '#a0a0a0',
    fontSize: 12,
    marginLeft: 5,
  },
  messageContent: {
    color: '#fff',
    fontSize: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#1e1e1e',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  input: {
    flex: 1,
    backgroundColor: '#2c2c2c',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#fff',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    backgroundColor: '#6200ee',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});

export default ChatScreen; 