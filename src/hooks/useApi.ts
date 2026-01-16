import { useAuth } from '@/contexts/AuthContext';
import { BASE_URL } from '@/utils/constants';
import { useEffect } from 'react';



export function useApi() {
  const { token } = useAuth();

  const authFetch = async (endpoint: string, options: RequestInit = {}) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return res.json();
  };

  return { authFetch };
}
