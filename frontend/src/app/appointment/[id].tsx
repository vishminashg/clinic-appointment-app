import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import api from '../../services/api';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import type { Appointment } from '../appointments';

export default function AppointmentDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment>();
  const [action, setAction] = useState<'cancel' | 'delete'>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    api.get<Appointment>(`/appointments/${id}`, { signal: controller.signal })
      .then(({ data }) => setAppointment(data))
      .catch(err => {
        if (!controller.signal.aborted) setError(err.response?.data?.message ?? 'Could not load this appointment.');
      });
    return () => controller.abort();
  }, [id]);

  async function confirm() {
    setBusy(true);
    setError('');
    try {
      if (action === 'delete') {
        await api.delete(`/appointments/${id}`);
        router.back();
      } else {
        const { data } = await api.put<Appointment>(`/appointments/${id}/status`, { status: 'Cancelled' });
        setAppointment(current => current && { ...current, status: data.status });
      }
      setAction(undefined);
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message ?? 'Could not update your appointment.' : 'Could not update your appointment.');
    } finally {
      setBusy(false);
    }
  }

  const canCancel = appointment?.status === 'Pending' || appointment?.status === 'Confirmed';
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {appointment ? (
        <>
          <View style={styles.card}>
            <Text style={styles.title}>{appointment.doctorId?.name ?? 'Doctor unavailable'}</Text>
            {appointment.doctorId && <Text>{appointment.doctorId.specialization}</Text>}
            <Text>{new Date(appointment.appointmentDate).toLocaleDateString(undefined, { timeZone: 'UTC' })} at {appointment.timeSlot}</Text>
            <Text>Status: {appointment.status}</Text>
            {appointment.doctorId && <Text>Consultation fee: Rs. {appointment.doctorId.consultationFee}</Text>}
            {appointment.reason ? <Text>Reason: {appointment.reason}</Text> : null}
          </View>
          {action ? (
            <View style={styles.card}>
              <Text>{action === 'delete' ? 'Permanently delete this appointment?' : 'Cancel this appointment?'}</Text>
              <Button color={COLORS.danger} disabled={busy} title={busy ? 'Saving…' : action === 'delete' ? 'Confirm delete' : 'Confirm cancellation'} onPress={confirm} />
              <Button disabled={busy} title="Keep appointment" onPress={() => setAction(undefined)} />
            </View>
          ) : (
            <>
              {canCancel && <Button title="Cancel appointment" color={COLORS.primary} onPress={() => setAction('cancel')} />}
              <Button title="Delete appointment" color={COLORS.danger} onPress={() => setAction('delete')} />
            </>
          )}
        </>
      ) : !error && <ActivityIndicator color={COLORS.primary} />}
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.background },
  content: { padding: SPACING.md, gap: SPACING.sm },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.sm },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textDark },
  error: { color: COLORS.danger },
});
