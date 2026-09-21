import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: { name?: string; email?: string; password?: string } = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await api.post('/auth/register', { name, email, password });
      Alert.alert('Success', 'Account created! Please log in.');
      router.replace('/');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Something went wrong. Please try again.';
      Alert.alert('Registration failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor="#999"
        value={name}
        onChangeText={setName}
      />
      {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/')}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, marginBottom: 4, fontSize: 16 },
  error: { color: 'red', fontSize: 13, marginBottom: 12 },
  button: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#2563eb', textAlign: 'center', marginTop: 20 },
});