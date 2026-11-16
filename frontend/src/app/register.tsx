import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

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
      Alert.alert('Account created', 'You can now log in with your new account.');
      router.replace('/');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Something went wrong. Please try again.';
      Alert.alert('Registration failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Book appointments with trusted doctors in minutes</Text>

        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={COLORS.textMuted} value={name} onChangeText={setName} />
        </View>
        {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}

        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor={COLORS.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        </View>
        {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor={COLORS.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
        </View>
        {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/')} style={styles.linkWrapper}>
          <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Log in</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, justifyContent: 'center', padding: SPACING.lg },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.textDark, textAlign: 'center' },
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