import { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api, { SERVER_URL } from '../services/api';
import { useAdminAccess } from '../hooks/use-admin-access';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

type Doctor = {
  _id: string;
  name: string;
  specialization: string;
  consultationFee: number;
  profileImage: string;
};

export default function DoctorsScreen() {
  const router = useRouter();
  const access = useAdminAccess();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchDoctors = useCallback(async () => {
    try {
      setError('');
      const response = await api.get('/doctors');
      setDoctors(response.data);
    } catch (err: any) {
      setError('Could not load doctors. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void fetchDoctors();
  }, [fetchDoctors]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchDoctors();
  };

  const ListHeader = () => (
    <View style={styles.headerBlock}>
      <Text style={styles.greeting}>Find a doctor</Text>
      <Text style={styles.greetingSub}>{doctors.length} available for appointments</Text>
      {access === 'admin' && <TouchableOpacity style={styles.myAppointmentsButton} onPress={() => router.push('/doctor-form')}>
        <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
        <Text style={styles.myAppointmentsText}>Add doctor</Text>
      </TouchableOpacity>}
      <TouchableOpacity style={styles.myAppointmentsButton} onPress={() => router.push('/appointments')}>
        <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
        <Text style={styles.myAppointmentsText}>My Appointments</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.myAppointmentsButton} onPress={async () => {
        await AsyncStorage.multiRemove(['token', 'user']);
        router.replace('/');
      }}>
        <Text style={styles.myAppointmentsText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading doctors...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={40} color={COLORS.textMuted} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={doctors}
      keyExtractor={(item) => item._id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={40} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No doctors available yet.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => router.push(`/doctor/${item._id}`)} activeOpacity={0.7}>
          {item.profileImage ? (
            <Image source={{ uri: `${SERVER_URL}${item.profileImage}` }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="person" size={28} color={COLORS.primary} />
            </View>
          )}
          <View style={styles.cardInfo}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.specRow}>
              <Ionicons name="medical-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.specialization}>{item.specialization}</Text>
            </View>
            <Text style={styles.fee}>Rs. {item.consultationFee}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.border} />
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listContent: { padding: SPACING.md, paddingBottom: SPACING.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  loadingText: { marginTop: SPACING.sm, color: COLORS.textMuted },
  errorText: { color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm },
  headerBlock: { marginBottom: SPACING.md },
  greeting: { fontSize: 24, fontWeight: '700', color: COLORS.textDark },
  greetingSub: { fontSize: 14, color: COLORS.textMuted, marginTop: 2, marginBottom: SPACING.md },
  myAppointmentsButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.sm },
  myAppointmentsText: { flex: 1, color: COLORS.primary, fontWeight: '600' },
  card: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.sm, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  image: { width: 60, height: 60, borderRadius: RADIUS.full, backgroundColor: COLORS.primaryLight },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  cardInfo: { marginLeft: SPACING.md, flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  specRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  specialization: { color: COLORS.textMuted, fontSize: 13 },
  fee: { color: COLORS.primary, marginTop: 4, fontWeight: '700', fontSize: 14 },
});
