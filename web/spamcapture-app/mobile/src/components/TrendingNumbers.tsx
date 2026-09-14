/**
 * Trending Numbers Component
 * Shows top reported spam numbers
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../constants/colors';
import { useStats } from '../hooks/useStats';

interface TrendingItemProps {
  rank: number;
  phoneNumber: string;
  reportCount: number;
  category: string;
}

function TrendingItem({ rank, phoneNumber, reportCount, category }: TrendingItemProps) {
  const getThreatColor = (count: number) => {
    if (count >= 100) return COLORS.danger;
    if (count >= 50) return COLORS.warning;
    return COLORS.textSecondary;
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 10) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  return (
    <View style={styles.item}>
      <View style={styles.rankContainer}>
        <Text style={styles.rank}>#{rank}</Text>
      </View>
      
      <View style={styles.info}>
        <Text style={styles.phoneNumber}>{formatPhone(phoneNumber)}</Text>
        <View style={styles.meta}>
          <Ionicons name="alert-circle" size={12} color={getThreatColor(reportCount)} />
          <Text style={[styles.count, { color: getThreatColor(reportCount) }]} >
            {reportCount} reports
          </Text>
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
    </View>
  );
}

export default function TrendingNumbers() {
  const { trending, isLoading } = useStats();

  // Mock data for display
  const mockData = [
    { phoneNumber: '5551234567', reportCount: 156, category: 'robocall' },
    { phoneNumber: '5559876543', reportCount: 89, category: 'scam' },
    { phoneNumber: '5554567890', reportCount: 67, category: 'spam' },
    { phoneNumber: '5557890123', reportCount: 45, category: 'telemarketing' },
    { phoneNumber: '5552345678', reportCount: 34, category: 'phishing' },
  ];

  const data = trending?.length > 0 ? trending : mockData;

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.phoneNumber}
        renderItem={({ item, index }) => (
          <TrendingItem
            rank={index + 1}
            phoneNumber={item.phoneNumber}
            reportCount={item.reportCount}
            category={item.category}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  rankContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  count: {
    fontSize: 12,
    marginLeft: 4,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
});
