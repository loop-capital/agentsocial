/**
 * Stats Card Component
 * Displays statistics with icon
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../constants/colors';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  suffix?: string;
}

export default function StatsCard({ title, value, icon, color, suffix = '' }: StatsCardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return (val / 1000000).toFixed(1) + 'M';
      }
      if (val >= 1000) {
        return (val / 1000).toFixed(1) + 'K';
      }
    }
    return val.toString();
  };

  return (
    <View style={[styles.container, { borderLeftColor: color }]} >
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]} >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.value}>
          {formatValue(value)}{suffix}
        </Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginLeft: 10,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  title: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
