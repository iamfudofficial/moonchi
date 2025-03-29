import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const API_URL = 'http://192.168.178.29:5000/api';

const WalletScreen = () => {
  const { userData } = useContext(AuthContext);
  const [miningHistory, setMiningHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Mining-Verlauf abrufen
  const fetchMiningHistory = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setIsLoading(true);
      } else if (pageNum > 1) {
        setIsLoadingMore(true);
      }

      const response = await axios.get(`${API_URL}/mining/history?page=${pageNum}&limit=10`);
      
      if (response.data.success) {
        // Prüfen, ob die Daten und Pagination vorhanden sind
        const data = response.data.data || [];
        const pagination = response.data.pagination || { totalPages: 1, currentPage: 1 };
        
        if (refresh || pageNum === 1) {
          setMiningHistory(data);
        } else {
          setMiningHistory(prevHistory => [...prevHistory, ...data]);
        }
        
        setTotalPages(pagination.totalPages);
        setPage(pagination.currentPage);
      }
    } catch (error) {
      console.error('Fehler beim Abrufen des Mining-Verlaufs:', error);
      // Im Fehlerfall ein leeres Array verwenden
      if (refresh || page === 1) {
        setMiningHistory([]);
      }
      Alert.alert(
        'Fehler',
        'Der Mining-Verlauf konnte nicht abgerufen werden.'
      );
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Beim ersten Rendern
  useEffect(() => {
    fetchMiningHistory();
  }, []);

  // Pull-to-Refresh
  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchMiningHistory(1, true);
  };

  // Weitere Einträge laden
  const loadMoreEntries = () => {
    if (isLoadingMore || page >= totalPages) return;
    fetchMiningHistory(page + 1);
  };

  // Formatiere Datum
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unbekannt';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Footer für die FlatList
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color="#6200ee" />
        <Text style={styles.loadingMoreText}>Lade weitere Einträge...</Text>
      </View>
    );
  };

  // Sicherer Zugriff auf numerische Werte
  const safeToFixed = (value, decimals = 2) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.00';
    }
    return Number(value).toFixed(decimals);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Lade Mining-Verlauf...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceTitle}>Wallet-Übersicht</Text>
        </View>
        <View style={styles.balanceContent}>
          <Text style={styles.balanceLabel}>Aktueller Kontostand</Text>
          <Text style={styles.balanceValue}>
            {safeToFixed(userData?.walletBalance)} <Text style={styles.coinText}>Coins</Text>
          </Text>
        </View>
      </View>

      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Mining-Verlauf</Text>
      </View>

      {miningHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#6200ee" />
          <Text style={styles.emptyText}>
            Noch keine Mining-Aktivitäten vorhanden.
          </Text>
          <Text style={styles.emptySubtext}>
            Starte dein erstes Mining auf dem Home-Screen.
          </Text>
        </View>
      ) : (
        <FlatList
          data={miningHistory}
          keyExtractor={(item, index) => item._id || `history-item-${index}`}
          renderItem={({ item }) => (
            <View style={styles.historyItem}>
              <View style={styles.historyItemHeader}>
                <Text style={styles.historyItemDate}>
                  {formatDate(item.timestamp)}
                </Text>
                <View style={styles.rateContainer}>
                  <Ionicons name="speedometer" size={14} color="#6200ee" />
                  <Text style={styles.rateText}>{safeToFixed(item.miningRate)}x</Text>
                </View>
              </View>
              
              <View style={styles.amountContainer}>
                <Text style={styles.amountText}>+{safeToFixed(item.amount)} Coins</Text>
                <View style={styles.bonusContainer}>
                  {item.innerCircleBonus > 0 && (
                    <View style={styles.bonus}>
                      <Ionicons name="people" size={12} color="#fff" />
                      <Text style={styles.bonusText}>
                        +{safeToFixed(item.innerCircleBonus)}
                      </Text>
                    </View>
                  )}
                  
                  {item.otherBonus > 0 && (
                    <View style={styles.bonus}>
                      <Ionicons name="flash" size={12} color="#fff" />
                      <Text style={styles.bonusText}>
                        +{safeToFixed(item.otherBonus)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={styles.historyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6200ee']}
            />
          }
          onEndReached={loadMoreEntries}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    marginTop: 10,
    color: '#a0a0a0',
    fontSize: 16,
  },
  balanceCard: {
    margin: 15,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  balanceHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  balanceContent: {
    padding: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#a0a0a0',
    marginBottom: 5,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  coinText: {
    fontSize: 18,
    color: '#6200ee',
  },
  historyHeader: {
    padding: 15,
    paddingBottom: 10,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  historyList: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  historyItem: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyItemDate: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2c2c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rateText: {
    fontSize: 12,
    color: '#6200ee',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  bonusContainer: {
    flexDirection: 'row',
  },
  bonus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6200ee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  bonusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 10,
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
  },
  loadingMoreContainer: {
    padding: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadingMoreText: {
    marginLeft: 10,
    color: '#a0a0a0',
    fontSize: 14,
  },
});

export default WalletScreen; 