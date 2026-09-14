/**
 * App Navigation
 * Main navigation configuration for SpamCapture
 */

import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import ReportScreen from '../screens/ReportScreen';
import BlockListScreen from '../screens/BlockListScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { COLORS } from '../constants/colors';

// Define navigation types
export type RootStackParamList = {
  MainTabs: undefined;
  Report: { type: 'sms' | 'call' };
  BlockList: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Report: { type?: 'sms' | 'call' };
  BlockList: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Deep linking configuration
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['spamcapture://', 'https://spamcapture.app'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          Report: 'report/:type',
          BlockList: 'blocklist',
          Settings: 'settings',
        },
      },
    },
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Report') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'BlockList') {
            iconName = focused ? 'shield' : 'shield-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'SpamCapture' }}
      />
      <Tab.Screen 
        name="Report" 
        component={ReportScreen}
        options={{ 
          title: 'Report Spam',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="BlockList" 
        component={BlockListScreen}
        options={{ title: 'Block List' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Report" 
          component={ReportScreen}
          options={{ 
            title: 'Submit Report',
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
