/**
 * Block List Item Component
 * Displays a blocked number entry
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../constants/colors';
import { BlockListEntry } from '../types';

interface BlockListItemProps {
  item: BlockListEntry;
}

export default function BlockListItem({ item }: BlockListItemProps) {
  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical':
        return COLORS.danger;
      case 'high':
        return COLORS.warning;
      case 'medium':
        return '#F59E0B'; // amber
      default:
        return COLORS.textSecondary;
    }
  };

  const getThreatLabel = (level: string) => {
    switch (level) {
      case 'critical':
        return 'Critical';
      case 'high':
        return 'High Risk';
      case 'medium':
        return 'Medium Risk';
      default:
        return 'Low Risk';
    }
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.threatBadge, { backgroundColor: getThreatColor(item.threatLevel) + '15' }]} >
          <Ionicons 
            name="warning" 
            size={14} 
            color={getThreatColor(item.threatLevel)} 
          />
          <Text style={[styles.threatText, { color: getThreatColor(item.threatLevel) }]} >
            {getThreatLabel(item.threatLevel)}
          </Text>
        </View>
        
        <Text style={styles.date}>Last: {formatDate(item.lastReported)}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.phoneNumber}>{formatPhone(item.phoneNumber)}</Text>
        
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="document-text" size={14} color={COLORS.textSecondary} />
            <Text style={styles.statText}>{item.reportCount} reports</Text>
          </View>
          
          <View style={styles.stat}>
            <Ionicons name="calendar" size={14} color={COLORS.textSecondary} />
            <Text style={styles.statText}>First: {formatDate(item.firstReported)}</Text>
          </View>
        </View>

        {item.categories && item.categories.length > 0 && (
          <View style={styles.categories}>
            {item.categories.slice(0, 3).map((cat, index) => (
              <View key={index} style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{cat}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  threatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  threatText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  content: {},
  phoneNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
