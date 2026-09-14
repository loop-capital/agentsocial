/**
 * Permissions Service
 * Handle runtime permissions for iOS and Android
 */

import * as Permissions from 'expo-permissions';
import * as Notifications from 'expo-notifications';
import * as Contacts from 'expo-contacts';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export const permissionsService = {
  async requestNotificationPermission() {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      return finalStatus === 'granted';
    } else {
      alert('Must use physical device for push notifications');
      return false;
    }
  },

  async requestContactPermission() {
    const { status } = await Contacts.requestPermissionsAsync();
    return status === 'granted';
  },

  async checkNotificationPermission() {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  },

  async requestPhoneStatePermission() {
    if (Platform.OS === 'android') {
      const { status } = await Permissions.getAsync(Permissions.PHONE_STATE);
      if (status !== 'granted') {
        const { status: newStatus } = await Permissions.requestAsync(Permissions.PHONE_STATE);
        return newStatus === 'granted';
      }
      return true;
    }
    return true; // iOS doesn't require explicit phone state permission
  },
};
