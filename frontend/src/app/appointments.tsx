import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import api from '../services/api';

type Appointment = {
  _id: string;
  doctorId: { _id: string; name: string; specialization: string; consultationFee: number };
  appointmentDate: string;
  timeSlot: string;
  status: string;
  reason: string;
};

const STATUS_COLORS: Record<string, string> = {
  Pending: '#f59e0b',
  Confirmed: '#10b981',
  Cancelled: '#ef4444',
  Completed: '#6b7280',
};

export default function AppointmentsScreen() {
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading your appointments...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (appointments.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>You haven't booked any appointments yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={appointments}
      keyExtractor={(item) => item._id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.doctorName}>{item.doctorId?.name || 'Unknown Doctor'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || '#999' }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.specialization}>{item.doctorId?.specialization}</Text>
          <Text style={styles.dateTime}>
            {new Date(item.appointmentDate).toLocaleDateString()} at {item.timeSlot}
          </Text>
          {item.reason ? <Text style={styles.reason}>{item.reason}</Text> : null}

          {(item.status === 'Pending' || item.status === 'Confirmed') && (
            <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancel(item._id)}>
              <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#666' },
  errorText: { color: 'red', textAlign: 'center' },
  emptyText: { color: '#666', textAlign: 'center' },
  card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 12, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  doctorName: { fontSize: 18, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  specialization: { color: '#666', marginTop: 2 },
  dateTime: { color: '#333', marginTop: 8, fontWeight: '500' },
  reason: { color: '#666', marginTop: 4, fontStyle: 'italic' },
  cancelButton: { marginTop: 12, borderWidth: 1, borderColor: '#ef4444', borderRadius: 8, padding: 10, alignItems: 'center' },
  cancelButtonText: { color: '#ef4444', fontWeight: '600' },
});