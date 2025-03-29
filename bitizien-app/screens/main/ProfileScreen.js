import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
  Alert,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Clipboard from 'expo-clipboard';
import { AuthContext } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.178.29:5000/api';

const ProfileScreen = () => {
  const { userData, logout, userToken } = useContext(AuthContext);
  const [innerCircle, setInnerCircle] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [referrals, setReferrals] = useState([]);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(true);

  // Inner Circle-Daten abrufen
  const fetchInnerCircle = async () => {
    try {
      setIsLoading(true);
      // Auth-Token aus dem Kontext holen
      const token = userToken || await AsyncStorage.getItem('authToken');
      
      console.log('Fetching Inner Circle with token:', token?.substring(0, 15) + '...');
      console.log('API URL:', `${API_URL}/mining/inner-circle`);
      
      const response = await axios.get(`${API_URL}/mining/inner-circle`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Inner Circle Response:', response.data);
      
      if (response.data.success) {
        setInnerCircle(response.data.data);
      }
    } catch (error) {
      console.error('Fehler beim Abrufen des Inner Circle:', error);
      console.error('Error Response:', error.response?.data);
      console.error('Error Status:', error.response?.status);
      Alert.alert(
        'Fehler',
        'Der Inner Circle konnte nicht abgerufen werden.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Referral-Daten abrufen
  const fetchReferrals = async () => {
    try {
      setIsLoadingReferrals(true);
      // Auth-Token aus dem Kontext holen
      const token = userToken || await AsyncStorage.getItem('authToken');
      
      const response = await axios.get(`${API_URL}/users/referral`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setReferrals(response.data.data.referrals);
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Referrals:', error);
    } finally {
      setIsLoadingReferrals(false);
    }
  };

  // Beim ersten Rendern
  useEffect(() => {
    fetchInnerCircle();
    fetchReferrals();
  }, []);

  // Benutzernamen (Einladungscode) in die Zwischenablage kopieren
  const copyInviteCode = async () => {
    if (!userData?.username) return;
    
    await Clipboard.setStringAsync(userData.username);
    Alert.alert('Kopiert!', 'Dein Benutzername als Einladungscode wurde in die Zwischenablage kopiert.');
  };

  // Teilen-Dialog öffnen
  const shareInviteCode = async () => {
    if (!userData?.username) return;
    
    try {
      await Share.share({
        message: `Tritt Bitizien bei und fange an zu minen! Benutze meinen Benutzernamen als Einladungscode: ${userData.username}`
      });
    } catch (error) {
      console.error('Fehler beim Teilen:', error);
    }
  };

  // Logout-Bestätigung
  const confirmLogout = () => {
    Alert.alert(
      'Abmelden',
      'Möchtest du dich wirklich abmelden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Abmelden', onPress: logout, style: 'destructive' }
      ]
    );
  };

  // Formatiere Datum
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.profileImage}>
          <Text style={styles.profileInitial}>
            {userData?.username ? userData.username.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={styles.username}>{userData?.username}</Text>
        <Text style={styles.email}>{userData?.email}</Text>
        <Text style={styles.memberSince}>
          Mitglied seit: {userData?.createdAt ? formatDate(userData.createdAt) : 'N/A'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dein Einladungscode</Text>
        <View style={styles.referralContainer}>
          <Text style={styles.referralCode}>{userData?.username}</Text>
          <View style={styles.referralActions}>
            <TouchableOpacity 
              style={styles.referralAction}
              onPress={copyInviteCode}
            >
              <Ionicons name="copy-outline" size={20} color="#6200ee" />
              <Text style={styles.referralActionText}>Kopieren</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.referralAction}
              onPress={shareInviteCode}
            >
              <Ionicons name="share-social-outline" size={20} color="#6200ee" />
              <Text style={styles.referralActionText}>Teilen</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.referralHelp}>
          Teile deinen Benutzernamen als Einladungscode, um Freunde einzuladen und Boosts zu erhalten
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dein Inner Circle ({innerCircle.length}/5)</Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6200ee" />
            <Text style={styles.loadingText}>Lade Inner Circle...</Text>
          </View>
        ) : innerCircle.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Dein Inner Circle ist leer. Lade Freunde mit deinem Benutzernamen als Einladungscode ein, um einen 20% Boost pro Freund zu erhalten (max. 5 Freunde)!
            </Text>
          </View>
        ) : (
          <View style={styles.innerCircleList}>
            {innerCircle.map((member, index) => (
              <View key={member._id || index} style={styles.memberItem}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>
                    {member.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.username}</Text>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                </View>
                <View style={styles.boostBadge}>
                  <Text style={styles.boostText}>+20%</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Eingeladene Benutzer</Text>
        
        {isLoadingReferrals ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6200ee" />
            <Text style={styles.loadingText}>Lade Referrals...</Text>
          </View>
        ) : referrals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Du hast noch niemanden eingeladen. Teile deinen Benutzernamen als Einladungscode! Jeder Eingeladene erhöht deinen Mining-Boost.
            </Text>
          </View>
        ) : (
          <FlatList
            data={referrals}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.referralItem}>
                <View style={styles.referralAvatar}>
                  <Text style={styles.referralInitial}>
                    {item.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.referralInfo}>
                  <Text style={styles.referralName}>{item.username}</Text>
                  <Text style={styles.referralDate}>
                    Beigetreten: {formatDate(item.createdAt)}
                  </Text>
                </View>
              </View>
            )}
            scrollEnabled={false}
            nestedScrollEnabled
            style={styles.referralsList}
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={confirmLogout}
      >
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutButtonText}>Abmelden</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#1e1e1e',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#a0a0a0',
    marginBottom: 5,
  },
  memberSince: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  section: {
    margin: 15,
    padding: 15,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  referralContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2c2c2c',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  referralCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  referralActions: {
    flexDirection: 'row',
  },
  referralAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
  },
  referralActionText: {
    marginLeft: 5,
    color: '#6200ee',
    fontSize: 14,
  },
  referralHelp: {
    fontSize: 14,
    color: '#a0a0a0',
    fontStyle: 'italic',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#a0a0a0',
    marginTop: 10,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#2c2c2c',
    borderRadius: 8,
  },
  emptyText: {
    color: '#a0a0a0',
    textAlign: 'center',
    fontSize: 14,
  },
  innerCircleList: {
    backgroundColor: '#2c2c2c',
    borderRadius: 8,
    overflow: 'hidden',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberEmail: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  boostBadge: {
    backgroundColor: '#6200ee',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  boostText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  referralsList: {
    backgroundColor: '#2c2c2c',
    borderRadius: 8,
    maxHeight: 300,
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  referralAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  referralInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  referralInfo: {
    flex: 1,
    marginLeft: 12,
  },
  referralName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  referralDate: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  logoutButton: {
    margin: 15,
    marginTop: 5,
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
});

export default ProfileScreen; 