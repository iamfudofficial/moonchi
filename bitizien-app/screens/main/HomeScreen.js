import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
  StatusBar,
  Image,
  ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.178.29:5000/api';

const HomeScreen = () => {
  const { userData, updateUserData, userToken } = useContext(AuthContext);
  const [miningStats, setMiningStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMining, setIsMining] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState('');

  // Mining-Statistiken abrufen
  const fetchMiningStats = async () => {
    try {
      setIsLoading(true);
      // Auth-Token aus dem Kontext holen
      const token = userToken || await AsyncStorage.getItem('authToken');
      
      console.log('Fetching Mining Stats with token:', token?.substring(0, 15) + '...');
      console.log('API URL:', `${API_URL}/mining/stats`);
      
      const response = await axios.get(`${API_URL}/mining/stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Mining Stats Response:', response.data);
      
      if (response.data.success) {
        const data = response.data.data;
        
        // Sicherstellen, dass die Daten im richtigen Format sind
        const formattedData = {
          walletBalance: typeof data.walletBalance === 'number' ? data.walletBalance : 0,
          miningRate: typeof data.miningRate === 'number' ? data.miningRate : 1,
          innerCircleCount: typeof data.innerCircleCount === 'number' ? data.innerCircleCount : 0,
          innerCircleBonus: typeof data.innerCircleBonus === 'number' ? data.innerCircleBonus : 0,
          miningBoost: typeof data.miningBoost === 'number' ? data.miningBoost : 1,
          lastMiningTime: data.lastMiningTime || new Date().toISOString(),
          canMineNow: typeof data.canMineNow === 'boolean' ? data.canMineNow : true,
          timeUntilNextMining: typeof data.timeUntilNextMining === 'number' ? data.timeUntilNextMining : 0
        };
        
        setMiningStats(formattedData);
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Mining-Statistiken:', error);
      console.error('Error Response:', error.response?.data);
      console.error('Error Status:', error.response?.status);
      
      // Im Fehlerfall Default-Werte verwenden
      setMiningStats({
        walletBalance: 0,
        miningRate: 1,
        innerCircleCount: 0,
        innerCircleBonus: 0,
        miningBoost: 1,
        lastMiningTime: new Date().toISOString(),
        canMineNow: true,
        timeUntilNextMining: 0
      });
      
      Alert.alert(
        'Fehler',
        'Die Mining-Statistiken konnten nicht abgerufen werden. Standardwerte werden verwendet.'
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Mining starten
  const startMining = async () => {
    try {
      setIsMining(true);
      // Auth-Token aus dem Kontext holen
      const token = userToken || await AsyncStorage.getItem('authToken');
      
      console.log('Starting Mining with token:', token?.substring(0, 15) + '...');
      
      const response = await axios.post(`${API_URL}/mining/mine`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Mining Response:', response.data);
      
      if (response.data.success) {
        const { reward, newBalance } = response.data.data;
        
        // Erfolgsmeldung anzeigen
        Alert.alert(
          'Mining erfolgreich!',
          `Du hast ${reward.toFixed(2)} Coins gemined!\nNeuer Kontostand: ${newBalance.toFixed(2)} Coins`
        );
        
        // Benutzerdaten aktualisieren
        updateUserData({ walletBalance: newBalance });
        
        // Mining-Statistiken neu laden
        fetchMiningStats();
      }
    } catch (error) {
      console.error('Mining-Fehler:', error);
      console.error('Error Response:', error.response?.data);
      console.error('Error Status:', error.response?.status);
      Alert.alert(
        'Mining-Fehler',
        error.response?.data?.message || 'Es ist ein Fehler beim Mining aufgetreten.'
      );
    } finally {
      setIsMining(false);
    }
  };

  // Countdown-Timer Funktion
  const updateCountdown = () => {
    if (!miningStats?.lastMiningTime) return;

    const lastMining = new Date(miningStats.lastMiningTime);
    const nextMiningTime = new Date(lastMining.getTime() + 24 * 60 * 60 * 1000); // 24 Stunden
    const now = new Date();
    const diff = nextMiningTime - now;

    if (diff <= 0) {
      setCountdown('Bereit');
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setCountdown(`${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
  };

  // Countdown-Timer starten
  useEffect(() => {
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [miningStats?.lastMiningTime]);

  // Beim ersten Rendern und wenn userData sich ändert
  useEffect(() => {
    fetchMiningStats();
  }, [userData]);

  // Pull-to-Refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchMiningStats();
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#4A148C', '#880E4F']} style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#F9B233" />
        <Text style={styles.loadingText}>Lade Mining-Statistiken...</Text>
      </LinearGradient>
    );
  }

  // Default-Werte für den Fall, dass keine Mining-Statistiken verfügbar sind
  const miningRate = miningStats?.miningRate?.toFixed(2) || '1.00';
  const innerCircleCount = miningStats?.innerCircleCount || 0;
  const maxCircleCount = 5;
  const miningBoost = ((miningStats?.miningBoost || 1) * 100).toFixed(0);
  const walletBalance = userData?.walletBalance || 0;
  const canMineNow = miningStats?.canMineNow || true;
  const timeUntilNextMining = miningStats?.timeUntilNextMining || 0;

  return (
    <ImageBackground 
      source={require('../../public/images/homebild/ChatGPT Image 29. März 2025, 16_06_05.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.header}>
          <View style={styles.headerCard}>
            <View style={styles.tokenInfo}>
              <View style={styles.tokenContainer}>
                <Text style={styles.tokenAmount}>{walletBalance.toFixed(2)}</Text>
                <View style={styles.symbolContainer}>
                  <Text style={styles.tokenSymbol}>π</Text>
                </View>
              </View>
              <Text style={styles.tokenLabel}>MOONCHI TOKEN</Text>
            </View>
          </View>
        </View>

        <View style={styles.mainContainer}>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={14} color="#F9B233" />
              <Text style={styles.statValue}>{miningRate}x</Text>
              <Text style={styles.statLabel}>Mining Rate</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="people" size={14} color="#F9B233" />
              <Text style={styles.statValue}>{innerCircleCount}/{maxCircleCount}</Text>
              <Text style={styles.statLabel}>Inner Circle</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="flash" size={14} color="#F9B233" />
              <Text style={styles.statValue}>{miningBoost}%</Text>
              <Text style={styles.statLabel}>Boost</Text>
            </View>
          </View>

          <View style={styles.centerContainer}>
            <TouchableOpacity 
              style={[
                styles.logoCircle,
                (!canMineNow || countdown !== 'Bereit') && styles.logoCircleDisabled
              ]}
              onPress={startMining}
              disabled={!canMineNow || countdown !== 'Bereit' || isMining}
            >
              {isMining ? (
                <ActivityIndicator size="large" color="#F9B233" />
              ) : (
                <Text style={styles.logoText}>B</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.countdownText}>
              {countdown === 'Bereit' ? 'Bereit zum Mining!' : countdown}
            </Text>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(74, 20, 140, 0.2)',
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  headerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  tokenInfo: {
    alignItems: 'center',
  },
  tokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginRight: 5,
  },
  symbolContainer: {
    backgroundColor: '#F9B233',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  tokenSymbol: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tokenLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 1,
  },
  mainContainer: {
    flex: 1,
  },
  statsContainer: {
    position: 'absolute',
    right: 15,
    top: 10,
    alignItems: 'flex-end',
    zIndex: 1,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
    width: 70,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 9,
    marginTop: 2,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
  },
  logoCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: 'rgba(249, 178, 51, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  logoCircleDisabled: {
    borderColor: 'rgba(249, 178, 51, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  logoText: {
    fontSize: 64,
    color: '#F9B233',
    fontWeight: 'bold',
  },
  countdownText: {
    color: '#F9B233',
    fontSize: 18,
    marginTop: 15,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: 'white',
    fontSize: 16,
  },
});

export default HomeScreen; 