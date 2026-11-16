import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAdminAccess } from '../../hooks/use-admin-access';
import { BookingCalendar, clinicToday } from '../../components/booking-calendar';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api, { SERVER_URL } from '../../services/api';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

type Doctor = {
  _id: string;
  name: string;
  specialization: string;
  bio: string;
  consultationFee: number;
  profileImage: string;
  availableDays: string[];
  availableDates?: string[];
};

const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];

export default function DoctorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const access = useAdminAccess();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [appointmentDate, setAppointmentDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [formErrors, setFormErrors] = useState<{ date?: string; slot?: string }>({});
  const [booking, setBooking] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    const fetchDoctor = async () => {
      try {
        setError('');
        const response = await api.get(`/doctors/${id}`, { signal: controller.signal });
        setDoctor(response.data);
      } catch (err: any) {
        if (!controller.signal.aborted) setError('Could not load this doctor. Please go back and try again.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchDoctor();
    return () => controller.abort();
  }, [id]));

  async function deleteDoctor() {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/doctors/${id}`);
      router.back();
    } catch (err) {
      setDeleteError(axios.isAxiosError(err) ? err.response?.data?.message ?? 'Could not delete doctor.' : 'Could not delete doctor.');
    } finally {
      setDeleting(false);
    }
  }

  const validate = () => {
    const newErrors: { date?: string; slot?: string } = {};
    if (!appointmentDate || appointmentDate < clinicToday()) newErrors.date = 'Choose today or a future date';
    if (!selectedSlot) newErrors.slot = 'Please select a time slot';
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBook = async () => {
    if (access !== 'patient' || !validate()) return;
    setBooking(true);
    try {
      await api.post('/appointments', {
        doctorId: id,
        appointmentDate: appointmentDate.trim(),
        timeSlot: selectedSlot,
        reason,
      });
      Alert.alert('Appointment Requested', 'Your booking has been sent and is pending confirmation.', [
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
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !doctor) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={40} color={COLORS.textMuted} />
        <Text style={styles.errorText}>{error || 'Doctor not found.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: SPACING.xl }}>
      <View style={styles.heroSection}>
        {doctor.profileImage ? (
          <Image source={{ uri: `${SERVER_URL}${doctor.profileImage}` }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="person" size={48} color={COLORS.primary} />
          </View>
        )}
        <Text style={styles.name}>{doctor.name}</Text>
        <View style={styles.specPill}>
          <Ionicons name="medical-outline" size={14} color={COLORS.primary} />
          <Text style={styles.specialization}>{doctor.specialization}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="cash-outline" size={18} color={COLORS.primary} />
          <Text style={styles.infoLabel}>Consultation Fee</Text>
          <Text style={styles.infoValue}>Rs. {doctor.consultationFee}</Text>
        </View>
        {doctor.availableDays?.length > 0 && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
            <Text style={styles.infoLabel}>Available</Text>
            <Text style={styles.infoValue}>{doctor.availableDays.join(', ')}</Text>
          </View>
        )}
        {doctor.bio ? <Text style={styles.bio}>{doctor.bio}</Text> : null}
      </View>

      {access === 'patient' && <View style={styles.bookingSection}>
        <Text style={styles.sectionTitle}>Book an Appointment</Text>

        <Text style={styles.label}>Date</Text>
        {doctor.availableDates && !doctor.availableDates.some(date => date >= clinicToday())
          ? <Text style={styles.fieldError}>No upcoming dates are available.</Text>
          : <BookingCalendar values={appointmentDate ? [appointmentDate] : []}
              allowedDates={doctor.availableDates} onSelect={setAppointmentDate} />}
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
          placeholderTextColor={COLORS.textMuted}
          value={reason}
          onChangeText={setReason}
        />

        <TouchableOpacity style={styles.bookButton} onPress={handleBook} disabled={booking}>
          {booking ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.bookButtonText}>Book Appointment</Text>}
        </TouchableOpacity>
      </View>}
      {access === 'admin' && <View style={{ padding: SPACING.md, gap: 12 }}>
        <TouchableOpacity disabled={deleting} onPress={() => router.push({ pathname: '/doctor-form', params: { id } })}>
          <Text style={{ color: COLORS.primary }}>Edit doctor</Text>
        </TouchableOpacity>
        {confirmDelete ? (
          <>
            <Text>Delete {doctor.name}?</Text>
            <TouchableOpacity disabled={deleting} onPress={deleteDoctor}>
              <Text style={{ color: '#a62222' }}>{deleting ? 'Deleting…' : 'Confirm delete'}</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={deleting} onPress={() => setConfirmDelete(false)}>
              <Text>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={() => setConfirmDelete(true)}>
            <Text style={{ color: '#a62222' }}>Delete doctor</Text>
          </TouchableOpacity>
        )}
        {deleteError ? <Text accessibilityLiveRegion="polite">{deleteError}</Text> : null}
      </View>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  errorText: { color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm },
  heroSection: { alignItems: 'center', paddingVertical: SPACING.xl, backgroundColor: COLORS.surface },
  image: { width: 110, height: 110, borderRadius: RADIUS.full, backgroundColor: COLORS.primaryLight, marginBottom: SPACING.md },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 22, fontWeight: '700', color: COLORS.textDark },
  specPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 6, marginTop: SPACING.sm },
  specialization: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  infoCard: { backgroundColor: COLORS.surface, margin: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  infoLabel: { color: COLORS.textMuted, fontSize: 14, flex: 1 },
  infoValue: { color: COLORS.textDark, fontWeight: '600', fontSize: 14 },
  bio: { fontSize: 14, color: COLORS.textDark, lineHeight: 20, marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  bookingSection: { padding: SPACING.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginBottom: SPACING.md },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textDark, marginBottom: SPACING.sm, marginTop: SPACING.md },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 14, fontSize: 15, color: COLORS.textDark },
  fieldError: { color: COLORS.danger, fontSize: 13, marginTop: 4 },
  slotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  slotButton: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, paddingVertical: 10, paddingHorizontal: 14 },
  slotButtonSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  slotText: { color: COLORS.textDark, fontSize: 13, fontWeight: '600' },
  slotTextSelected: { color: COLORS.white },
  bookButton: { backgroundColor: COLORS.accent, paddingVertical: 16, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.lg },
  bookButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});
