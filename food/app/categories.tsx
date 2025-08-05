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
import { useCategories } from '@/hooks/useCategories';
import { apiClient } from '@/lib/api';
import type { Category } from '@/types';

export default function CategoriesScreen() {
  const { theme } = useTheme();
  const { categories, loading, refetch } = useCategories();
  const [deleting, setDeleting] = useState<Set<number>>(new Set());

  // 处理添加新分类
  const handleAddCategory = () => {
    console.log('Add category button pressed');
    Alert.prompt(
      '新增分类',
      '请输入分类名称',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '添加',
          onPress: async (value) => {
            console.log('Add category onPress called with value:', value);
            if (!value?.trim()) {
              Alert.alert('错误', '分类名称不能为空');
              return;
            }
            
            try {
              console.log('Creating category:', value.trim());
              const result = await apiClient.createCategory({ name: value.trim() });
              console.log('Category created:', result);
              await refetch();
              Alert.alert('成功', '分类添加成功');
            } catch (error) {
              console.error('Create category error:', error);
              Alert.alert('添加失败', error instanceof Error ? error.message : '添加分类失败，请重试');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // 处理编辑分类
  const handleEditCategory = (category: Category) => {
    console.log('Edit category button pressed for:', category.name);
    Alert.prompt(
      '编辑分类',
      '请修改分类名称',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '保存',
          onPress: async (value) => {
            console.log('Edit category onPress called with value:', value);
            if (!value?.trim()) {
              Alert.alert('错误', '分类名称不能为空');
              return;
            }
            
            if (value.trim() === category.name) {
              return; // 没有变化
            }
            
            try {
              console.log('Updating category:', category.id, 'with name:', value.trim());
              const result = await apiClient.updateCategory(category.id, { name: value.trim() });
              console.log('Category updated:', result);
              await refetch();
              Alert.alert('成功', '分类更新成功');
            } catch (error) {
              console.error('Update category error:', error);
              Alert.alert('编辑失败', error instanceof Error ? error.message : '编辑分类失败，请重试');
            }
          },
        },
      ],
      'plain-text',
      category.name
    );
  };

  // 处理删除分类
  const handleDeleteCategory = async (category: Category) => {
    if (category.is_system) {
      Alert.alert('提示', '系统预置分类不能删除');
      return;
    }

    Alert.alert(
      '删除分类',
      `确定要删除「${category.name}」分类吗？\n注意：删除后使用此分类的食物将变为未分类。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            setDeleting(prev => new Set([...prev, category.id]));
            try {
              console.log('Deleting category:', category.id);
              await apiClient.deleteCategory(category.id);
              console.log('Category deleted successfully');
              await refetch();
              Alert.alert('成功', '分类删除成功');
            } catch (error) {
              console.error('Delete category error:', error);
              Alert.alert('删除失败', error instanceof Error ? error.message : '删除分类失败，请重试');
            } finally {
              setDeleting(prev => {
                const newSet = new Set(prev);
                newSet.delete(category.id);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  // 渲染分类项
  const renderCategoryItem = ({ item }: { item: Category }) => {
    const isDeleting = deleting.has(item.id);

    return (
      <Card style={styles.categoryItem}>
        <View style={styles.categoryInfo}>
          <View style={styles.categoryHeader}>
            <Text style={[styles.categoryName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            {item.is_system && (
              <View style={[styles.systemBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.systemBadgeText}>系统</Text>
              </View>
            )}
          </View>
          
          <Text style={[styles.categoryDescription, { color: theme.colors.textSecondary }]}>
            {item.description || '暂无描述'}
          </Text>
          
          <View style={styles.categoryStats}>
            <View style={styles.statItem}>
              <Ionicons name="restaurant-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                {item.foodCount || 0} 个食物
              </Text>
            </View>
            <Text style={[styles.createdAt, { color: theme.colors.textSecondary }]}>
              创建时间：{new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.categoryActions}>
          {!item.is_system && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditCategory(item)}
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
                onPress={() => handleDeleteCategory(item)}
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
            </>
          )}
        </View>
      </Card>
    );
  };

  // 渲染空状态
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="list-outline"
        size={64}
        color={theme.colors.textSecondary}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        暂无分类
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
        添加您的第一个食物分类
      </Text>
      <Button
        title="添加分类"
        onPress={handleAddCategory}
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
            分类管理
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddCategory}
          >
            <Ionicons name="add" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* 统计信息 */}
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {categories.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                总分类数
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                {categories.filter(c => c.is_system).length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                系统分类
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#FF9800' }]}>
                {categories.filter(c => !c.is_system).length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                自定义分类
              </Text>
            </View>
          </View>
        </Card>

        {/* 分类列表 */}
        <View style={styles.content}>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={[
              styles.listContent,
              categories.length === 0 && styles.emptyListContent
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
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  systemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  systemBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  categoryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
  },
  createdAt: {
    fontSize: 12,
  },
  categoryActions: {
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