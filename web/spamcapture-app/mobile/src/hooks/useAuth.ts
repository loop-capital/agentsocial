import { useState, useEffect, useCallback } from 'react';
import { storageService } from '@services/storage';
import { apiService } from '@services/api';
import { PermissionStatus, PermissionState } from '@types';
import { useNavigation } from '@react-navigation/native';

export const useAuth = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionState | null>(null);
  const navigation = useNavigation();

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check if we have stored credentials
      const storedUserId = await storageService.getUserId();
      const authToken = await storageService.getAuthToken();

      if (storedUserId && authToken) {
        // We have credentials, verify they're still valid
        setUserId(storedUserId);
        setIsAuthenticated(true);
      } else {
        // No credentials, authenticate anonymously
        await authenticateAnonymous();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const authenticateAnonymous = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.authenticateAnonymous();
      
      if (response.success && response.data) {
        const { userId, token, refreshToken } = response.data;
        
        // Store credentials securely
        await storageService.setUserId(userId);
        await storageService.setAuthToken(token);
        await storageService.setRefreshToken(refreshToken);
        
        setUserId(userId);
        setIsAuthenticated(true);
      } else {
        throw new Error(response.error || 'Anonymous auth failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to authenticate');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const refreshToken = await storageService.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await apiService.authenticateAnonymous(); // Using same endpoint for simplicity
      
      if (response.success && response.data) {
        const { userId, token, refreshToken: newRefreshToken } = response.data;
        
        await storageService.setUserId(userId);
        await storageService.setAuthToken(token);
        await storageService.setRefreshToken(newRefreshToken);
        
        setUserId(userId);
        setIsAuthenticated(true);
      } else {
        throw new Error(response.error || 'Refresh failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh auth');
      await storageService.clearAuth();
      setUserId(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await storageService.clearAuth();
    setUserId(null);
    setIsAuthenticated(false);
    setPermissions(null);
    
    // Navigate to auth screen if needed
    // navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  }, [navigation]);

  const loadPermissions = useCallback(async () => {
    try {
      const permissionsState = await Promise.all([
        // In a real implementation, we'd check actual permissions
        Promise.resolve('granted' as PermissionStatus), // contacts
        Promise.resolve('granted' as PermissionStatus), // phone
        Promise.resolve('granted' as PermissionStatus), // notifications
      ]);
      
      setPermissions({
        contacts: permissionsState[0],
        phone: permissionsState[1],
        notifications: permissionsState[2],
      });
    } catch (err) {
      console.warn('Failed to load permissions:', err);
      setPermissions(null);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadPermissions();
    }
  }, [isAuthenticated, loadPermissions]);

  return {
    userId,
    isAuthenticated,
    isLoading,
    error,
    permissions,
    authenticate: authenticateAnonymous,
    refresh: refreshAuth,
    logout,
    loadPermissions,
  };
};
