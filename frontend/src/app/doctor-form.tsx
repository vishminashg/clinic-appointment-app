import { useEffect, useState } from 'react';
import { Button, Image, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import api, { SERVER_URL } from '../services/api';
import { useAdminAccess } from '../hooks/use-admin-access';
import { BookingCalendar, clinicToday } from '../components/booking-calendar';

const emptyFields = { name: '', specialization: '', consultationFee: '', bio: '' };
const labels = { name: 'Name', specialization: 'Specialization', consultationFee: 'Consultation fee', bio: 'Bio' };
const fieldNames = Object.keys(emptyFields) as (keyof typeof emptyFields)[];
const specializations = [
  'General Medicine', 'Cardiology', 'Dermatology', 'ENT', 'Gastroenterology',
  'Neurology', 'Obstetrics and Gynecology', 'Ophthalmology', 'Orthopedics',
  'Pediatrics', 'Psychiatry', 'Urology',
];

export default function DoctorForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const access = useAdminAccess();
  const [fields, setFields] = useState(emptyFields);
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset>();
  const [existingPhoto, setExistingPhoto] = useState('');
  const [ready, setReady] = useState(!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSpecializations, setShowSpecializations] = useState(false);
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [linkExisting, setLinkExisting] = useState(false);
  const [linkedEmail, setLinkedEmail] = useState('');
  const [availableDates, setAvailableDates] = useState<string[] | undefined>(id ? undefined : []);

  useEffect(() => {
    if (!id || access !== 'admin' || ready) return;
    const controller = new AbortController();
    const config = { signal: controller.signal };
    Promise.all([
      api.get(`/doctors/${id}`, config),
      api.get<{ email: string | null }>(`/doctors/${id}/login`, config),
    ]).then(([{ data }, { data: login }]) => {
      setFields({
        name: data.name,
        specialization: data.specialization,
        consultationFee: String(data.consultationFee),
        bio: data.bio ?? '',
      });
      setLinkedEmail(login.email ?? '');
      setAccountEmail(login.email ?? '');
      setAvailableDates(data.availableDates?.filter((date: string) => date >= clinicToday()));
      setExistingPhoto(data.profileImage ? SERVER_URL + data.profileImage : '');
      setReady(true);
    }).catch(() => {
      if (!controller.signal.aborted) setError('Could not load this doctor.');
    });
    return () => controller.abort();
  }, [access, id, ready]);

  async function choosePhoto() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(asset.mimeType ?? '') ||
          (asset.fileSize ?? 0) > 5 * 1024 * 1024) {
        setError('Choose a JPEG, PNG, or WebP image up to 5 MB.');
        return;
      }
      setPhoto(asset);
      setError('');
    } catch {
      setError('Could not open the photo library.');
    }
  }

  async function save() {
    const fee = fields.consultationFee.trim();
    const email = accountEmail.trim();
    if ((!id || linkedEmail || email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid doctor email.');
      return;
    }
    if (!id && !linkExisting && accountPassword.trim().length < 8) {
      setError('Enter a password with at least 8 characters.');
      return;
    }
    if (!fields.name.trim() || !fields.specialization.trim() || !fee ||
        !Number.isFinite(Number(fee)) || Number(fee) < 0) {
      setError('Enter a name, specialization, and valid consultation fee.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = new FormData();
      for (const field of fieldNames) {
        data.append(field, fields[field].trim());
      }
      if (availableDates !== undefined) data.append('availableDates', availableDates.join(','));
      if (email && email !== linkedEmail) data.append('accountEmail', email);
      if (!id && !linkExisting) data.append('accountPassword', accountPassword);
      if (photo) {
        if (Platform.OS === 'web' && photo.file) {
          data.append('profileImage', photo.file);
        } else {
          data.append('profileImage', {
            uri: photo.uri,
            name: photo.fileName ?? `doctor.${photo.mimeType?.split('/')[1]}`,
            type: photo.mimeType,
          } as unknown as Blob);
        }
      }
      if (id) await api.putForm(`/doctors/${id}`, data);
      else await api.postForm('/doctors', data);
      router.back();
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      setError(message === 'Enter the email of an existing account without admin access'
        ? 'No eligible login matches that email. Check the address or choose Create new login.'
        : message ?? 'Could not save doctor.');
    } finally {
      setSaving(false);
    }
  }

  const preview = photo?.uri || existingPhoto;
  if (access !== 'admin') {
    return <Text style={{ padding: 20 }}>{access === 'checking' ? 'Checking access…' : 'Doctor management requires an admin account.'}</Text>;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }} keyboardShouldPersistTaps="handled">
      {ready && <>
        {fieldNames.map(field => (
          <View key={field} style={{ gap: 6 }}>
          <Text>{labels[field]}{field === 'bio' ? ' (optional)' : ' *'}</Text>
          {field === 'specialization' ? <>
            <Button title={fields.specialization || 'Choose specialization'} disabled={saving}
              onPress={() => setShowSpecializations(current => !current)} />
            {showSpecializations && specializations.map(option => (
              <TouchableOpacity key={option} accessibilityRole="button"
                accessibilityState={{ selected: fields.specialization === option, disabled: saving }}
                disabled={saving} style={{ padding: 10 }} onPress={() => {
                  setFields(current => ({ ...current, specialization: option }));
                  setShowSpecializations(false);
                }}>
                <Text>{option}</Text>
              </TouchableOpacity>
            ))}
          </> : <TextInput
            accessibilityLabel={labels[field]}
            placeholder={labels[field]}
            value={fields[field]}
            onChangeText={value => setFields(current => ({ ...current, [field]: value }))}
            keyboardType={field === 'consultationFee' ? 'decimal-pad' : 'default'}
            editable={!saving}
            style={{ borderWidth: 1, borderColor: '#8695a3', borderRadius: 8, padding: 12 }}
          />}
          </View>
        ))}
        <Text>Doctor email{!id || linkedEmail ? ' *' : ' (optional)'}</Text>
        <TextInput accessibilityLabel="Doctor email" placeholder="doctor@example.com" value={accountEmail}
          onChangeText={setAccountEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address"
          editable={!saving} style={{ borderWidth: 1, borderColor: '#8695a3', borderRadius: 8, padding: 12 }} />
        {id ? <Text>Use the email of an existing clinic app account.</Text> : <>
          {!linkExisting && <>
            <Text>Doctor password *</Text>
            <TextInput accessibilityLabel="Doctor password" placeholder="At least 8 characters"
              value={accountPassword} onChangeText={setAccountPassword} secureTextEntry
              autoCapitalize="none" autoCorrect={false} autoComplete="new-password"
              editable={!saving} style={{ borderWidth: 1, borderColor: '#8695a3', borderRadius: 8, padding: 12 }} />
          </>}
          <Button title={linkExisting ? 'Create new login' : 'Link existing login'} disabled={saving}
            onPress={() => {
              setLinkExisting(current => !current);
              setAccountPassword('');
              setError('');
            }} />
        </>}
        <Text>Available dates</Text>
        <BookingCalendar multiple values={availableDates ?? []} onSelect={date => {
          setAvailableDates(current => current?.includes(date)
            ? current.filter(item => item !== date)
            : [...(current ?? []), date].sort());
        }} />
        <Text>{availableDates === undefined ? 'No date restrictions set' : availableDates.join(', ') || 'Patients cannot book until you select dates.'}</Text>
        {preview ? <Image source={{ uri: preview }} style={{ width: 112, height: 112, borderRadius: 12 }} /> : null}
        <Button title="Choose photo" onPress={choosePhoto} disabled={saving} />
        <Button title={saving ? 'Saving…' : 'Save doctor'} onPress={save} disabled={saving} />
      </>}
      {!ready && !error ? <Text>Loading doctor…</Text> : null}
      {error ? <Text accessibilityLiveRegion="polite" style={{ color: '#a62222' }}>{error}</Text> : null}
    </ScrollView>
  );
}
