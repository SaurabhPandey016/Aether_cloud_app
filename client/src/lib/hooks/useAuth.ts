'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, getCurrentUser } = useAuthStore();
  const hasAttemptedFetch = useRef(false);

  useEffect(() => {
    // Only fetch user once on component mount if not already fetching
    if (!isLoading && !isAuthenticated && !hasAttemptedFetch.current) {
      hasAttemptedFetch.current = true;
      getCurrentUser().catch(() => {
        // Silently fail - let the app show content, user can authenticate when needed
      });
    }
  }, []);

  return { user, isAuthenticated, isLoading };
};

export const useProtectedRoute = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading, getCurrentUser } = useAuthStore();
  const hasAttemptedFetch = useRef(false);

  useEffect(() => {
    // Try to get current user if not already attempting
    if (!hasAttemptedFetch.current) {
      hasAttemptedFetch.current = true;
      getCurrentUser().catch(() => {
        // User not authenticated, redirect to login
      });
    }
  }, []);

  useEffect(() => {
    // After loading is done, check if authenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return { isReady: false };
  }

  if (!isAuthenticated) {
    return { isReady: false };
  }

  return { isReady: true };
};
