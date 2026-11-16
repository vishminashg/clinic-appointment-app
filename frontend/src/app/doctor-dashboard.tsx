import { useCallback, useState } from 'react';
import { ActivityIndicator, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import api from '../services/api';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

type DoctorAppointment = {
  _id: string;
  patientId: { name: string } | null;
  appointmentDate: string;
  timeSlot: string;
  reason?: string;
  status: string;
};

type Dashboard = {
  doctor: { name: string; specialization: string };
  appointments: DoctorAppointment[];
};

export default function DoctorDashboard() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Dashboard>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get<Dashboard>('/appointments/doctor', { signal });
      if (!signal?.aborted) setDashboard(data);
    } catch (err) {
      if (signal?.aborted) return;
      setDashboard(undefined);
      setError(axios.isAxiosError(err) ? err.response?.data?.message || 'Could not load appointments.' : 'Could not load appointments.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]));

  async function decide(id: string, status: 'Confirmed' | 'Rejected') {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.put<{ status: string }>(`/appointments/doctor/${id}/decision`, { status });
      setDashboard(current => current && {
        ...current,
        appointments: current.appointments.map(item => item._id === id ? { ...item, status: data.status } : item),
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) await load();
      setError(axios.isAxiosError(err) ? err.response?.data?.message || 'Could not save the decision.' : 'Could not save the decision.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <FlatList
      style={styles.screen} contentContainerStyle={styles.content}
      data={dashboard?.appointments ?? []} keyExtractor={item => item._id}
      refreshing={loading && Boolean(dashboard)} onRefresh={() => void load()}
      ListHeaderComponent={<View style={styles.card}>
        {dashboard && <>
          <Text style={styles.title}>{dashboard.doctor.name}</Text>
          <Text>{dashboard.doctor.specialization}</Text>
        </>}
        <Button title="Sign out" disabled={busy} onPress={async () => {
          await AsyncStorage.multiRemove(['token', 'user']);
          router.replace('/');
        }} />
        {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
      </View>}
      ListEmptyComponent={loading
        ? <ActivityIndicator color={COLORS.primary} />
        : dashboard ? <Text>No appointments yet.</Text> : undefined}
      renderItem={({ item }) => <View style={styles.card}>
        <Text style={styles.title}>{item.patientId?.name ?? 'Patient unavailable'}</Text>
        <Text>{new Date(item.appointmentDate).toLocaleDateString(undefined, { timeZone: 'UTC' })} at {item.timeSlot}</Text>
        <Text>{item.status}</Text>
        {item.reason ? <Text>{item.reason}</Text> : null}
        {item.status === 'Pending' && <View style={styles.actions}>
          <Button title="Accept" disabled={busy} onPress={() => void decide(item._id, 'Confirmed')} />
          <Button title="Reject" color={COLORS.danger} disabled={busy} onPress={() => void decide(item._id, 'Rejected')} />
        </View>}
      </View>}
    />
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.background },
  content: { padding: SPACING.md, gap: SPACING.sm },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.sm },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textDark },
  error: { color: COLORS.danger },
  actions: { flexDirection: 'row', gap: SPACING.md },
});
