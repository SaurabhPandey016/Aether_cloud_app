'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, getCurrentUser } = useAuthStore();
  const hasAttemptedFetch = useRef(false);

  useEffect(() => {
    // Check auth status on mount (only once)
    if (!hasAttemptedFetch.current) {
      hasAttemptedFetch.current = true;
      // Silently check - don't show errors or redirect
      getCurrentUser().catch(() => {
        // User not authenticated - this is fine for public pages
      });
    }
  }, [getCurrentUser]);

  return { user, isAuthenticated, isLoading };
};

export const useProtectedRoute = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading, getCurrentUser } = useAuthStore();
  const hasAttemptedFetch = useRef(false);

  useEffect(() => {
    // Check authentication status
    if (!hasAttemptedFetch.current) {
      hasAttemptedFetch.current = true;
      getCurrentUser().catch(() => {
        // Error checking auth - component will redirect in next effect
      });
    }
  }, [getCurrentUser]);

  useEffect(() => {
    // Only redirect after loading is complete
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
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
