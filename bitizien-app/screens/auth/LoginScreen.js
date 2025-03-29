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
  ScrollView,
  ImageBackground,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { login, isLoading, error } = useContext(AuthContext);
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Fehler', 'Bitte geben Sie E-Mail und Passwort ein.');
      return;
    }
    
    const success = await login(email, password);
    
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
                <Text style={styles.subtitle}>Beginne deine Mining-Reise</Text>
              </View>
              
              <View style={styles.formContainer}>
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
                
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.loginButtonText}>GET STARTED</Text>
                  )}
                </TouchableOpacity>
                
                <View style={styles.registerContainer}>
                  <Text style={styles.registerText}>
                    Noch kein Konto?
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Register')}
                  >
                    <Text style={styles.registerLink}>Registrieren</Text>
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
    marginBottom: 40,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#F9C04B',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
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
  loginButton: {
    backgroundColor: '#F9C04B',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#4A148C',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#ffffff',
    marginRight: 5,
  },
  registerLink: {
    color: '#F9C04B',
    fontWeight: 'bold',
  },
});

export default LoginScreen; 