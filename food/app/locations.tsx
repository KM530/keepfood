import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Layout } from '@/components/ui/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { useLocations } from '@/hooks/useLocations';
import { apiClient } from '@/lib/api';
import type { Location } from '@/types';

export default function LocationsScreen() {
  const { theme } = useTheme();
  const { locations, loading, refetch } = useLocations();
  const [deleting, setDeleting] = useState<Set<number>>(new Set());

  // 处理添加新位置
  const handleAddLocation = () => {
    Alert.prompt(
      '新增位置',
      '请输入位置名称',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '添加',
          onPress: async (value) => {
            if (!value?.trim()) {
              Alert.alert('错误', '位置名称不能为空');
              return;
            }
            
            try {
              await apiClient.createLocation({ name: value.trim() });
              await refetch();
              Alert.alert('成功', '位置添加成功');
            } catch (error) {
              Alert.alert('添加失败', error instanceof Error ? error.message : '添加位置失败，请重试');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // 处理编辑位置
  const handleEditLocation = (location: Location) => {
    Alert.prompt(
      '编辑位置',
      '请修改位置名称',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '保存',
          onPress: async (value) => {
            if (!value?.trim()) {
              Alert.alert('错误', '位置名称不能为空');
              return;
            }
            
            if (value.trim() === location.name) {
              return; // 没有变化
            }
            
            try {
              // TODO: 实现编辑位置API
              Alert.alert('提示', '编辑功能开发中...');
            } catch (error) {
              Alert.alert('编辑失败', error instanceof Error ? error.message : '编辑位置失败，请重试');
            }
          },
        },
      ],
      'plain-text',
      location.name
    );
  };

  // 处理删除位置
  const handleDeleteLocation = async (location: Location) => {
    Alert.alert(
      '删除位置',
      `确定要删除「${location.name}」位置吗？\n注意：删除后使用此位置的食物将变为未设置位置。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            setDeleting(prev => new Set([...prev, location.id]));
            try {
              // TODO: 实现删除位置API
              Alert.alert('提示', '删除功能开发中...');
            } catch (error) {
              Alert.alert('删除失败', error instanceof Error ? error.message : '删除位置失败，请重试');
            } finally {
              setDeleting(prev => {
                const newSet = new Set(prev);
                newSet.delete(location.id);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  // 渲染位置项
  const renderLocationItem = ({ item }: { item: Location }) => {
    const isDeleting = deleting.has(item.id);

    return (
      <Card style={styles.locationItem}>
        <View style={styles.locationInfo}>
          <View style={styles.locationHeader}>
            <Ionicons name="location" size={24} color={theme.colors.primary} />
            <Text style={[styles.locationName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
          </View>
          
          <Text style={[styles.locationDescription, { color: theme.colors.textSecondary }]}>
            {item.description || '暂无描述'}
          </Text>
          
          <View style={styles.locationStats}>
            <View style={styles.statItem}>
              <Ionicons name="restaurant-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                {item.foodCount || 0} 个食物
              </Text>
            </View>
            <Text style={[styles.createdAt, { color: theme.colors.textSecondary }]}>
              创建时间：{new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.locationActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditLocation(item)}
            disabled={isDeleting}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteLocation(item)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loading size="small" />
            ) : (
              <Ionicons
                name="trash-outline"
                size={20}
                color={theme.colors.error}
              />
            )}
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  // 渲染空状态
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="location-outline"
        size={64}
        color={theme.colors.textSecondary}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        暂无位置
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
        添加您的第一个存放位置
      </Text>
      <Button
        title="添加位置"
        onPress={handleAddLocation}
        style={styles.emptyAddButton}
      />
    </View>
  );

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <SafeAreaView style={styles.container}>
        {/* 头部 */}
        <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            位置管理
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddLocation}
          >
            <Ionicons name="add" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* 统计信息 */}
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {locations.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                总位置数
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                {locations.reduce((sum, loc) => sum + (loc.foodCount || 0), 0)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                存放食物
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#FF9800' }]}>
                {locations.filter(loc => (loc.foodCount || 0) === 0).length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                空置位置
              </Text>
            </View>
          </View>
        </Card>

        {/* 位置列表 */}
        <View style={styles.content}>
          <FlatList
            data={locations}
            renderItem={renderLocationItem}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={[
              styles.listContent,
              locations.length === 0 && styles.emptyListContent
            ]}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  addButton: {
    padding: 4,
  },
  statsCard: {
    margin: 16,
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  locationDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
    marginLeft: 36,
  },
  locationStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 36,
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
  },
  createdAt: {
    fontSize: 12,
  },
  locationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyAddButton: {
    paddingHorizontal: 32,
  },
});