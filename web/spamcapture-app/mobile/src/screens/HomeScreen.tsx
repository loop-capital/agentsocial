/**
 * Home Screen
 * Dashboard showing stats and quick actions
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../constants/colors';
import StatsCard from '../components/StatsCard';
import TrendingNumbers from '../components/TrendingNumbers';
import { useStats } from '../hooks/useStats';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { stats, isLoading, refetch } = useStats();

  const quickActions = [
    {
      id: 'report-sms',
      title: 'Report Text',
      subtitle: 'SMS/MMS spam',
      icon: 'chatbubble-ellipses' as const,
      color: COLORS.warning,
      onPress: () => navigation.navigate('Report', { type: 'sms' }),
    },
    {
      id: 'report-call',
      title: 'Report Call',
      subtitle: 'Robocalls & scams',
      icon: 'call' as const,
      color: COLORS.danger,
      onPress: () => navigation.navigate('Report', { type: 'call' }),
    },
    {
      id: 'block-list',
      title: 'Block List',
      subtitle: 'Community blocks',
      icon: 'shield-checkmark' as const,
      color: COLORS.success,
      onPress: () => navigation.navigate('BlockList'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>SpamCapture</Text>
            <Text style={styles.headerSubtitle}>Community-powered protection</Text>
          </View>
          <View style={styles.shieldIcon}>
            <Ionicons name="shield" size={40} color={COLORS.primary} />
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Stats</Text>
          <View style={styles.statsGrid}>
            <StatsCard
              title="Reports Today"
              value={stats?.todayReports || 0}
              icon="document-text"
              color={COLORS.primary}
            />
            <StatsCard
              title="Active Blocks"
              value={stats?.activeBlocks || 0}
              icon="shield"
              color={COLORS.success}
            />
            <StatsCard
              title="Protected Users"
              value={stats?.protectedUsers || 0}
              icon="people"
              color={COLORS.warning}
              suffix="+"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]} >
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trending Numbers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending Spam Numbers</Text>
          <TrendingNumbers />
        </View>

        {/* Protection Status */}
        <View style={[styles.section, styles.protectionSection]}>
          <View style={styles.protectionCard}>
            <View style={styles.protectionHeader}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.protectionTitle}>Protection Active</Text>
            </View>
            <Text style={styles.protectionText}>
              Your device is protected by SpamCapture community intelligence.
            </Text>
          </View>
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
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  shieldIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionsContainer: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  actionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  protectionSection: {
    marginTop: 24,
  },
  protectionCard: {
    backgroundColor: COLORS.success + '10',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  protectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  protectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success,
    marginLeft: 8,
  },
  protectionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
