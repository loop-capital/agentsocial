/**
 * Mobile App Entry Point
 * SpamCapture - Community-powered spam reporting
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize authentication
        await initializeAuth();

        // Load fonts
        await Font.loadAsync({
          // Add any custom fonts here
          // 'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
        });
      } catch (e) {
        console.warn('Error loading app resources:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppNavigator />
        <StatusBar style="auto" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
