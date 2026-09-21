import { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import api, { SERVER_URL } from '../services/api';

type Doctor = {
  _id: string;
  name: string;
  specialization: string;
  consultationFee: number;
  profileImage: string;
};

export default function DoctorsScreen() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchDoctors = async () => {
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
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDoctors();
  };

  const ListHeader = () => (
    <TouchableOpacity style={styles.myAppointmentsButton} onPress={() => router.push('/appointments')}>
      <Text style={styles.myAppointmentsText}>My Appointments →</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading doctors...</Text>
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

  return (
    <FlatList
      style={styles.container}
      data={doctors}
      keyExtractor={(item) => item._id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No doctors available yet.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => router.push(`/doctor/${item._id}`)}>
          {item.profileImage ? (
            <Image source={{ uri: `${SERVER_URL}${item.profileImage}` }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={styles.imagePlaceholderText}>No Photo</Text>
            </View>
          )}
          <View style={styles.cardInfo}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.specialization}>{item.specialization}</Text>
            <Text style={styles.fee}>Rs. {item.consultationFee}</Text>
          </View>
        </TouchableOpacity>
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
  myAppointmentsButton: { backgroundColor: '#eef2ff', margin: 12, marginBottom: 0, borderRadius: 12, padding: 14, alignItems: 'center' },
  myAppointmentsText: { color: '#2563eb', fontWeight: '600' },
  card: { flexDirection: 'row', backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 12, padding: 12, alignItems: 'center' },
  image: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#eee' },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderText: { fontSize: 10, color: '#999' },
  cardInfo: { marginLeft: 16, flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold' },
  specialization: { color: '#666', marginTop: 2 },
  fee: { color: '#2563eb', marginTop: 4, fontWeight: '600' },
});