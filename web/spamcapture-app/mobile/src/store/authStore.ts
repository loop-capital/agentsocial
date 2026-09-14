/**
 * Authentication Store
 * Manages anonymous user identity and auth state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import uuid from 'react-native-uuid';

import { userAPI } from '../services/api';

interface AuthState {
  userId: string | null;
  deviceToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initializeAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

// Custom secure storage adapter for Zustand
const secureStorage = {
  getItem: async (name: string) => {
    const value = await SecureStore.getItemAsync(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: async (name: string, value: unknown) => {
    await SecureStore.setItemAsync(name, JSON.stringify(value));
  },
  removeItem: async (name: string) => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      userId: null,
      deviceToken: null,
      isLoading: true,
      isAuthenticated: false,

      initializeAuth: async () => {
        try {
          set({ isLoading: true });
          
          let userId = get().userId;
          
          // Create anonymous user if not exists
          if (!userId) {
            userId = uuid.v4() as string;
            
            // Register with backend
            const response = await userAPI.register({
              anonymousId: userId,
            });
            
            if (response.success) {
              set({ 
                userId,
                isAuthenticated: true,
              });
            }
          } else {
            set({ isAuthenticated: true });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          // Still allow app to work even if backend is unreachable
          set({ isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        await SecureStore.deleteItemAsync('auth-storage');
        set({
          userId: null,
          deviceToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ 
        userId: state.userId,
        deviceToken: state.deviceToken,
      }),
    }
  )
);
