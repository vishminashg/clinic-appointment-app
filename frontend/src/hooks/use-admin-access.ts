import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import api from '../services/api';

export function useAdminAccess() {
  const [access, setAccess] = useState<'checking' | 'admin' | 'doctor' | 'patient' | 'denied'>('checking');

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    setAccess('checking');
    api.get<{ isAdmin?: boolean; isDoctor?: boolean }>('/auth/profile', { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setAccess(data.isAdmin ? 'admin' : data.isDoctor ? 'doctor' : 'patient');
      })
      .catch(() => {
        if (!controller.signal.aborted) setAccess('denied');
      });
    return () => controller.abort();
  }, []));

  return access;
}
