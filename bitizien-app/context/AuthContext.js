import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Basis-URL für die API
const API_URL = 'http://192.168.178.29:5000/api';

// Kontext erstellen
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  // Beim Start prüfen, ob ein Token im AsyncStorage existiert
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        setIsLoading(true);
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUser = await AsyncStorage.getItem('userData');
        
        if (storedToken && storedUser) {
          console.log('Gespeicherter Token gefunden:', storedToken.substring(0, 15) + '...');
          setUserToken(storedToken);
          setUserData(JSON.parse(storedUser));
          // Axios-Header setzen
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } else {
          console.log('Kein Token im AsyncStorage gefunden');
        }
      } catch (error) {
        console.error('Fehler beim Laden des Storage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStorageData();
  }, []);

  // Registrierung
  const register = async (username, email, password, inviteCode) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Registrierungsversuch mit:', { username, email, inviteCode: inviteCode || 'keine' });
      
      // Token löschen, falls vorhanden (um Konflikte zu vermeiden)
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      delete axios.defaults.headers.common['Authorization'];
      
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password,
        inviteCode
      });
      
      console.log('Registrierungsantwort:', response.data);
      
      if (response.data.success) {
        // Überprüfe das Format der Antwort
        let token, user;
        
        if (response.data.token && response.data.user) {
          // Direktes Format
          token = response.data.token;
          user = response.data.user;
        } else if (response.data.data && response.data.data.token && response.data.data.user) {
          // Verschachteltes Format
          token = response.data.data.token;
          user = response.data.data.user;
        } else {
          throw new Error('Unerwartetes Antwortformat vom Server');
        }
        
        // Token und Benutzerdaten speichern
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        
        console.log('Token gespeichert:', token.substring(0, 15) + '...');
        
        // State aktualisieren
        setUserToken(token);
        setUserData(user);
        
        // Axios-Header setzen
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        return true;
      }
    } catch (error) {
      console.error('Registrierungsfehler:', error);
      console.error('Fehlerdetails:', error.response?.data);
      setError(
        error.response?.data?.message || 
        'Fehler bei der Registrierung. Bitte versuchen Sie es später erneut.'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Login
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Login-Versuch mit:', { email });
      
      // Token löschen, falls vorhanden (um Konflikte zu vermeiden)
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      delete axios.defaults.headers.common['Authorization'];
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      console.log('Login-Antwort:', response.data);
      
      if (response.data.success) {
        // Überprüfe das Format der Antwort
        let token, user;
        
        if (response.data.token && response.data.user) {
          // Direktes Format
          token = response.data.token;
          user = response.data.user;
        } else if (response.data.data && response.data.data.token && response.data.data.user) {
          // Verschachteltes Format
          token = response.data.data.token;
          user = response.data.data.user;
        } else {
          throw new Error('Unerwartetes Antwortformat vom Server');
        }
        
        // Token und Benutzerdaten speichern
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        
        console.log('Token gespeichert:', token.substring(0, 15) + '...');
        
        // State aktualisieren
        setUserToken(token);
        setUserData(user);
        
        // Axios-Header setzen
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        return true;
      }
    } catch (error) {
      console.error('Login-Fehler:', error);
      console.error('Fehlerdetails:', error.response?.data);
      setError(
        error.response?.data?.message || 
        'Ungültige Anmeldedaten oder Server-Fehler. Bitte versuchen Sie es später erneut.'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    setIsLoading(true);
    
    try {
      // Token und Benutzerdaten aus dem Storage entfernen
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      
      // State zurücksetzen
      setUserToken(null);
      setUserData(null);
      
      // Axios-Header entfernen
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Fehler beim Logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Benutzerdaten aktualisieren
  const updateUserData = async (newData) => {
    setUserData({
      ...userData,
      ...newData
    });
    
    // Aktualisierte Daten im AsyncStorage speichern
    await AsyncStorage.setItem('userData', JSON.stringify({
      ...userData,
      ...newData
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        userToken,
        userData,
        error,
        login,
        register,
        logout,
        updateUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 