'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, getCurrentUser } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      getCurrentUser().catch(() => {
        router.push('/login');
      });
    }
  }, []);

  return { user, isAuthenticated, isLoading };
};

export const useProtectedRoute = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading, getCurrentUser } = useAuthStore();

  useEffect(() => {
    getCurrentUser().catch(() => {
      router.push('/login');
    });
  }, []);

  if (isLoading) {
    return { isReady: false };
  }

  if (!isAuthenticated) {
    router.push('/login');
    return { isReady: false };
  }

  return { isReady: true };
};
