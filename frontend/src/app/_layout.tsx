import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Register' }} />
      <Stack.Screen name="doctors" options={{ title: 'Doctors', headerBackVisible: false }} />
      <Stack.Screen name="doctor/[id]" options={{ title: 'Doctor Details' }} />
      <Stack.Screen name="appointments" options={{ title: 'My Appointments' }} />
    </Stack>
  );
}