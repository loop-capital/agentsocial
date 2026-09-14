/**
 * Settings Screen
 * App settings and information
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../constants/colors';
import { useAuthStore } from '../store/authStore';

export default function SettingsScreen() {
  const { userId, logout } = useAuthStore();
  
  const [autoBlock, setAutoBlock] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);
  const [analytics, setAnalytics] = React.useState(true);

  const settingsSections = [
    {
      title: 'Protection',
      items: [
        {
          id: 'auto-block',
          icon: 'shield-checkmark',
          title: 'Auto-blocking',
          subtitle: 'Block calls from reported numbers',
          type: 'toggle',
          value: autoBlock,
          onToggle: setAutoBlock,
        },
        {
          id: 'threshold',
          icon: 'alert-circle',
          title: 'Block Threshold',
          subtitle: 'Minimum reports to auto-block: 5',
          type: 'navigate',
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'notifications',
          icon: 'notifications',
          title: 'Push Notifications',
          subtitle: 'Get alerts about new threats',
          type: 'toggle',
          value: notifications,
          onToggle: setNotifications,
        },
      ],
    },
    {
      title: 'Privacy',
      items: [
        {
          id: 'analytics',
          icon: 'analytics',
          title: 'Analytics',
          subtitle: 'Help improve the app with usage data',
          type: 'toggle',
          value: analytics,
          onToggle: setAnalytics,
        },
        {
          id: 'privacy',
          icon: 'lock-closed',
          title: 'Privacy Policy',
          type: 'link',
          url: 'https://spamcapture.app/privacy',
        },
        {
          id: 'terms',
          icon: 'document-text',
          title: 'Terms of Service',
          type: 'link',
          url: 'https://spamcapture.app/terms',
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          id: 'version',
          icon: 'information-circle',
          title: 'App Version',
          subtitle: '1.0.0',
          type: 'static',
        },
        {
          id: 'user-id',
          icon: 'person',
          title: 'Anonymous ID',
          subtitle: userId ? `${userId.substring(0, 8)}...` : 'Loading...',
          type: 'static',
        },
        {
          id: 'help',
          icon: 'help-circle',
          title: 'Help & Support',
          type: 'link',
          url: 'https://spamcapture.app/help',
        },
      ],
    },
  ];

  const handleLinkPress = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  const renderSettingItem = (item: any) => (
    <View key={item.id} style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={item.icon} size={22} color={COLORS.primary} />
      </View>
      
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{item.title}</Text>
        {item.subtitle && (
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        )}
      </View>

      {item.type === 'toggle' && (
        <Switch
          value={item.value}
          onValueChange={item.onToggle}
          trackColor={{ false: COLORS.border, true: COLORS.primary + '60' }}
          thumbColor={item.value ? COLORS.primary : COLORS.white}
        />
      )}

      {(item.type === 'navigate' || item.type === 'link') && (
        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView>
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item) => {
                if (item.type === 'link') {
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleLinkPress(item.url)}
                      activeOpacity={0.7}
                    >
                      {renderSettingItem(item)}
                    </TouchableOpacity>
                  );
                }
                return <View key={item.id}>{renderSettingItem(item)}</View>;
              })}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Reset Anonymous ID</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>SpamCapture v1.0.0</Text>
          <Text style={styles.footerSubtext}>Made with 💙 by the community</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 12,
  },
  sectionContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '50',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 32,
    paddingVertical: 16,
    backgroundColor: COLORS.danger + '10',
    borderRadius: 12,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.danger,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  footerSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
