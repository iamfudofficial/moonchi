import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../../context/AuthContext';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  
  const { register, isLoading, error } = useContext(AuthContext);
  
  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Fehler', 'Die Passwörter stimmen nicht überein.');
      return;
    }
    
    const success = await register(username, email, password, inviteCode);
    
    if (!success && error) {
      Alert.alert('Fehler', error);
    }
  };
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4A148C', '#880E4F']}
        style={styles.backgroundGradient}
      >
        <StatusBar style="light" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.overlay}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../../assets/images/icon.png')} 
                  style={styles.logo} 
                  resizeMode="contain"
                />
                <Text style={styles.title}>MOONCHI TOKEN</Text>
                <Text style={styles.subtitle}>Registriere dich und starte deine Mining-Reise</Text>
              </View>
              
              <View style={styles.formContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Benutzername"
                  placeholderTextColor="#a0a0a0"
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="E-Mail"
                  placeholderTextColor="#a0a0a0"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Passwort"
                  placeholderTextColor="#a0a0a0"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Passwort bestätigen"
                  placeholderTextColor="#a0a0a0"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Einladungscode (optional)"
                  placeholderTextColor="#a0a0a0"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                />
                
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.registerButtonText}>Registrieren</Text>
                  )}
                </TouchableOpacity>
                
                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>
                    Bereits ein Konto?
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Login')}
                  >
                    <Text style={styles.loginLink}>Anmelden</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  keyboardContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(72, 6, 86, 0.2)',
    padding: 20,
    justifyContent: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F9C04B',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(72, 6, 86, 0.7)',
    borderRadius: 10,
    padding: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(249, 192, 75, 0.3)',
  },
  registerButton: {
    backgroundColor: '#F9C04B',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    color: '#4A148C',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#ffffff',
    marginRight: 5,
  },
  loginLink: {
    color: '#F9C04B',
    fontWeight: 'bold',
  },
});

export default RegisterScreen; 