import { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api, { SERVER_URL } from '../../services/api';

type Doctor = {
  _id: string;
  name: string;
  specialization: string;
  bio: string;
  consultationFee: number;
  profileImage: string;
  availableDays: string[];
};

const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];

export default function DoctorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [appointmentDate, setAppointmentDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [formErrors, setFormErrors] = useState<{ date?: string; slot?: string }>({});
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const response = await api.get(`/doctors/${id}`);
        setDoctor(response.data);
      } catch (err: any) {
        setError('Could not load this doctor. Please go back and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  const validate = () => {
    const newErrors: { date?: string; slot?: string } = {};
    if (!appointmentDate.trim()) newErrors.date = 'Please enter a date';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate.trim())) newErrors.date = 'Use format YYYY-MM-DD';
    if (!selectedSlot) newErrors.slot = 'Please select a time slot';
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBook = async () => {
    if (!validate()) return;

    setBooking(true);
    try {
      await api.post('/appointments', {
        doctorId: id,
        appointmentDate: appointmentDate.trim(),
        timeSlot: selectedSlot,
        reason,
      });
      Alert.alert('Booked!', 'Your appointment request has been sent.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Something went wrong. Please try again.';
      Alert.alert('Booking failed', message);
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (error || !doctor) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Doctor not found.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {doctor.profileImage ? (
        <Image source={{ uri: `${SERVER_URL}${doctor.profileImage}` }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.imagePlaceholderText}>No Photo</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name}>{doctor.name}</Text>
        <Text style={styles.specialization}>{doctor.specialization}</Text>
        <Text style={styles.fee}>Consultation Fee: Rs. {doctor.consultationFee}</Text>
        {doctor.bio ? <Text style={styles.bio}>{doctor.bio}</Text> : null}
        {doctor.availableDays?.length > 0 ? (
          <Text style={styles.availableDays}>Available: {doctor.availableDays.join(', ')}</Text>
        ) : null}
      </View>

      <View style={styles.bookingSection}>
        <Text style={styles.sectionTitle}>Book an Appointment</Text>

        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD (e.g. 2026-10-15)"
          placeholderTextColor="#999"
          value={appointmentDate}
          onChangeText={setAppointmentDate}
        />
        {formErrors.date ? <Text style={styles.fieldError}>{formErrors.date}</Text> : null}

        <Text style={styles.label}>Time Slot</Text>
        <View style={styles.slotsRow}>
          {TIME_SLOTS.map((slot) => (
            <TouchableOpacity
              key={slot}
              style={[styles.slotButton, selectedSlot === slot && styles.slotButtonSelected]}
              onPress={() => setSelectedSlot(slot)}
            >
              <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextSelected]}>{slot}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {formErrors.slot ? <Text style={styles.fieldError}>{formErrors.slot}</Text> : null}

        <Text style={styles.label}>Reason (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Regular checkup"
          placeholderTextColor="#999"
          value={reason}
          onChangeText={setReason}
        />

        <TouchableOpacity style={styles.bookButton} onPress={handleBook} disabled={booking}>
          {booking ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookButtonText}>Book Appointment</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: 'red', textAlign: 'center' },
  image: { width: '100%', height: 220, backgroundColor: '#eee' },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderText: { color: '#999' },
  info: { padding: 20 },
  name: { fontSize: 24, fontWeight: 'bold' },
  specialization: { fontSize: 16, color: '#666', marginTop: 4 },
  fee: { fontSize: 16, color: '#2563eb', fontWeight: '600', marginTop: 8 },
  bio: { fontSize: 14, color: '#444', marginTop: 12, lineHeight: 20 },
  availableDays: { fontSize: 14, color: '#666', marginTop: 8 },
  bookingSection: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  fieldError: { color: 'red', fontSize: 13, marginTop: 4 },
  slotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotButton: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginRight: 8, marginBottom: 8 },
  slotButtonSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  slotText: { color: '#333' },
  slotTextSelected: { color: '#fff' },
  bookButton: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  bookButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});