import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      router.replace(response.data.user.isDoctor ? '/doctor-dashboard' : '/doctors');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Something went wrong. Please try again.';
      Alert.alert('Login failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <View style={styles.logoCircle}>
          <Ionicons name="medical" size={36} color={COLORS.white} />
        </View>
        <Text style={styles.brand}>MEDICARE CLINIC</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to book and manage your appointments</Text>

        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Log In</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/register')} style={styles.linkWrapper}>
          <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Register</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, justifyContent: 'center', padding: SPACING.lg },
  logoCircle: { width: 72, height: 72, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: SPACING.md },
  brand: { textAlign: 'center', color: COLORS.primary, fontWeight: '700', fontSize: 13, letterSpacing: 1.5, marginBottom: SPACING.lg },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textDark, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xs, marginBottom: SPACING.xl },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, marginBottom: SPACING.xs },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: COLORS.textDark },
  error: { color: COLORS.danger, fontSize: 13, marginBottom: SPACING.sm, marginLeft: SPACING.xs },
  button: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.md },
  buttonText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  linkWrapper: { marginTop: SPACING.lg, alignItems: 'center' },
  link: { color: COLORS.textMuted, fontSize: 14 },
  linkBold: { color: COLORS.primary, fontWeight: '700' },
});
