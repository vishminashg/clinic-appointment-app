import { Stack } from 'expo-router';
import { COLORS } from '../constants/theme';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.textDark,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Register' }} />
      <Stack.Screen name="doctors" options={{ title: 'Doctors', headerBackVisible: false }} />
      <Stack.Screen name="doctor/[id]" options={{ title: 'Doctor Details' }} />
      <Stack.Screen name="doctor-form" options={{ title: 'Doctor Form' }} />
      <Stack.Screen name="doctor-dashboard" options={{ title: 'Doctor Dashboard', headerBackVisible: false }} />
      <Stack.Screen name="appointments" options={{ title: 'My Appointments' }} />
      <Stack.Screen name="appointment/[id]" options={{ title: 'Appointment Details' }} />
    </Stack>
  );
}
