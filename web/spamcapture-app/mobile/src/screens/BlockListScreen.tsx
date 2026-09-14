/**
 * Block List Screen
 * View and manage community block list
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../constants/colors';
import { useBlockList } from '../hooks/useBlockList';
import BlockListItem from '../components/BlockListItem';

export default function BlockListScreen() {
  const { blockList, isLoading, hasMore, refetch, loadMore } = useBlockList({ limit: 50 });
  const [filter, setFilter] = useState<'all' | 'high' | 'critical'>('all');

  const filteredList = blockList.filter((item) => {
    if (filter === 'all') return true;
    return item.threatLevel === filter;
  });

  const renderItem = useCallback(({ item }) => (
    <BlockListItem item={item} />
  ), []);

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Community Block List</Text>
          <Text style={styles.headerSubtitle}>
            {blockList.length.toLocaleString()} numbers blocked
          </Text>
        </View>
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="download-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        {[
          { id: 'all', label: 'All', count: blockList.length },
          { id: 'high', label: 'High Risk', count: blockList.filter(i => i.threatLevel === 'high').length },
          { id: 'critical', label: 'Critical', count: blockList.filter(i => i.threatLevel === 'critical').length },
        ].map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterButton, filter === f.id && styles.filterButtonActive]}
            onPress={() => setFilter(f.id as any)}
          >
            <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>
              {f.label}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{f.count}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark" size={64} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No blocked numbers yet</Text>
            <Text style={styles.emptyText}>
              The block list will populate as the community reports spam.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.white,
  },
  badge: {
    marginLeft: 6,
    backgroundColor: COLORS.textSecondary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 8,
  },
  footerLoader: {
    paddingVertical: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});
