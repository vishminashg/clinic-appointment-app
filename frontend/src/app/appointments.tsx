import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import api from '../services/api';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

export type Appointment = {
  _id: string;
  doctorId: { _id: string; name: string; specialization: string; consultationFee: number } | null;
  appointmentDate: string;
  timeSlot: string;
  status: string;
  reason: string;
};

const STATUS_STYLES: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  Pending: { color: COLORS.warning, icon: 'time-outline' },
  Confirmed: { color: COLORS.success, icon: 'checkmark-circle-outline' },
  Cancelled: { color: COLORS.danger, icon: 'close-circle-outline' },
  Rejected: { color: COLORS.danger, icon: 'close-circle-outline' },
  Completed: { color: COLORS.textMuted, icon: 'checkmark-done-outline' },
};

export default function AppointmentsScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = async () => {
    try {
      setError('');
      const response = await api.get('/appointments');
      setAppointments(response.data);
    } catch (err: any) {
      setError('Could not load your appointments. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const handleCancel = (id: string) => {
    Alert.alert('Cancel Appointment', 'Are you sure you want to cancel this appointment?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.put(`/appointments/${id}/status`, { status: 'Cancelled' });
            fetchAppointments();
          } catch (err: any) {
            Alert.alert('Error', 'Could not cancel the appointment. Please try again.');
          }
        },
      },
    ]);
  };

  const handleShareReceipt = async (item: Appointment) => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;

      const html = `
        <html>
          <body style="font-family: -apple-system, sans-serif; padding: 32px; color: #1A2E2B;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="width: 56px; height: 56px; background: #0F6E62; border-radius: 28px; margin: 0 auto 12px;"></div>
              <h1 style="color: #0F6E62; font-size: 20px; margin: 0;">MediCare Clinic</h1>
              <p style="color: #6B7A77; font-size: 12px; margin-top: 4px;">Appointment Confirmation</p>
            </div>
            <hr style="border: none; border-top: 1px solid #E4E7E6; margin: 24px 0;" />
            <table style="width: 100%; font-size: 14px; line-height: 2;">
              <tr><td style="color: #6B7A77;">Patient</td><td style="text-align: right; font-weight: 600;">${user?.name || 'N/A'}</td></tr>
              <tr><td style="color: #6B7A77;">Doctor</td><td style="text-align: right; font-weight: 600;">${item.doctorId?.name || 'Unknown'}</td></tr>
              <tr><td style="color: #6B7A77;">Specialization</td><td style="text-align: right;">${item.doctorId?.specialization || '-'}</td></tr>
              <tr><td style="color: #6B7A77;">Date</td><td style="text-align: right;">${new Date(item.appointmentDate).toLocaleDateString()}</td></tr>
              <tr><td style="color: #6B7A77;">Time</td><td style="text-align: right;">${item.timeSlot}</td></tr>
              <tr><td style="color: #6B7A77;">Status</td><td style="text-align: right; font-weight: 600;">${item.status}</td></tr>
              <tr><td style="color: #6B7A77;">Fee</td><td style="text-align: right;">Rs. ${item.doctorId?.consultationFee ?? '-'}</td></tr>
              ${item.reason ? `<tr><td style="color: #6B7A77;">Reason</td><td style="text-align: right;">${item.reason}</td></tr>` : ''}
            </table>
            <hr style="border: none; border-top: 1px solid #E4E7E6; margin: 24px 0;" />
            <p style="color: #6B7A77; font-size: 11px; text-align: center;">Booking ID: ${item._id}</p>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (err) {
      Alert.alert('Error', 'Could not generate the receipt. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your appointments...</Text>
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

  if (appointments.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="calendar-outline" size={40} color={COLORS.textMuted} />
        <Text style={styles.emptyText}>You haven't booked any appointments yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={appointments}
      keyExtractor={(item) => item._id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      renderItem={({ item }) => {
        const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES.Pending;
        return (
          <View style={[styles.card, { borderLeftColor: statusStyle.color }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.doctorName}>{item.doctorId?.name || 'Unknown Doctor'}</Text>
              <View style={styles.statusRow}>
                <Ionicons name={statusStyle.icon} size={14} color={statusStyle.color} />
                <Text style={[styles.statusText, { color: statusStyle.color }]}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.specialization}>{item.doctorId?.specialization}</Text>
            <View style={styles.dateTimeRow}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.dateTime}>
                {new Date(item.appointmentDate).toLocaleDateString()} at {item.timeSlot}
              </Text>
            </View>
            {item.reason ? <Text style={styles.reason}>"{item.reason}"</Text> : null}

            <TouchableOpacity style={styles.shareButton} onPress={() => router.push({ pathname: '/appointment/[id]', params: { id: item._id } })}>
              <Text style={styles.shareButtonText}>View details</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareButton} onPress={() => handleShareReceipt(item)}>
              <Ionicons name="share-outline" size={16} color={COLORS.primary} />
              <Text style={styles.shareButtonText}>Share Receipt</Text>
            </TouchableOpacity>

            {(item.status === 'Pending' || item.status === 'Confirmed') && (
              <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancel(item._id)}>
                <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listContent: { padding: SPACING.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  loadingText: { marginTop: SPACING.sm, color: COLORS.textMuted },
  errorText: { color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  doctorName: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  specialization: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  dateTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.sm },
  dateTime: { color: COLORS.textDark, fontWeight: '600', fontSize: 13 },
  reason: { color: COLORS.textMuted, marginTop: SPACING.xs, fontStyle: 'italic', fontSize: 13 },
  shareButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: SPACING.md, borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.md, padding: 10 },
  shareButtonText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  cancelButton: { marginTop: SPACING.sm, borderWidth: 1, borderColor: COLORS.danger, borderRadius: RADIUS.md, padding: 10, alignItems: 'center' },
  cancelButtonText: { color: COLORS.danger, fontWeight: '700', fontSize: 13 },
});
