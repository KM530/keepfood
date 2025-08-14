import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { Layout } from '@/components/ui/Layout';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterSortBar } from '@/components/ui/FilterSortBar';
import { FoodCard } from '@/components/ui/FoodCard';
import { Loading } from '@/components/ui/Loading';
import { useFoodList } from '@/hooks/useFoodList';
import { useCategories } from '@/hooks/useCategories';
import { useLocations } from '@/hooks/useLocations';
import type { FoodListItem } from '@/types';

export default function HomeScreen() {
  const { theme } = useTheme();
  const [searchText, setSearchText] = useState('');
  
  // 获取数据
  const {
    foods,
    loading,
    refreshing,
    error,
    hasMore,
    totalCount,
    sortBy,
    categoryFilter,
    locationFilter,
    statusFilter,
    searchQuery,
    refresh,
    loadMore,
    updateSort,
    updateFilters,
    search,
    clearFilters,
  } = useFoodList();

  const { categories } = useCategories();
  const { locations } = useLocations();

  // 当页面获得焦点时自动刷新数据
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 首页获得焦点，自动刷新数据');
      refresh();
    }, [refresh])
  );

  // 搜索处理
  const handleSearchSubmit = useCallback((text: string) => {
    search(text);
  }, [search]);

  const handleSearchClear = useCallback(() => {
    setSearchText('');
    search('');
  }, [search]);

  // 食物卡片点击
  const handleFoodPress = useCallback((food: FoodListItem) => {
    router.push(`/food/${food.id}`);
  }, []);

  // 消费食物
  const handleConsumeFood = useCallback(async (food: FoodListItem) => {
    Alert.alert(
      '消费食物',
      `确定要消费 ${food.name} 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: () => {
            // TODO: 实现消费逻辑
            console.log('Consume food:', food.id);
          },
        },
      ]
    );
  }, []);

  // 渲染食物项
  const renderFoodItem = useCallback(({ item }: { item: FoodListItem }) => (
    <FoodCard
      food={item}
      onPress={() => handleFoodPress(item)}
      onConsume={() => handleConsumeFood(item)}
    />
  ), [handleFoodPress, handleConsumeFood]);

  // 渲染空状态
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="basket-outline"
        size={64}
        color={theme.colors.textSecondary}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        暂无食物
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
        {searchQuery || categoryFilter || locationFilter || statusFilter
          ? '没有找到符合条件的食物'
          : '添加您的第一个食物吧'
        }
      </Text>
      {!searchQuery && !categoryFilter && !locationFilter && !statusFilter && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => router.push('/food/add')}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>添加食物</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // 渲染错误状态
  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Ionicons
        name="alert-circle-outline"
        size={64}
        color={theme.colors.error}
      />
      <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
        加载失败
      </Text>
      <Text style={[styles.errorDescription, { color: theme.colors.textSecondary }]}>
        {error}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
        onPress={refresh}
      >
        <Text style={styles.retryButtonText}>重试</Text>
      </TouchableOpacity>
    </View>
  );

  // 渲染列表头部
  const renderListHeader = () => (
    <View style={styles.listHeader}>
      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchText}
          onChangeText={setSearchText}
          onSubmit={handleSearchSubmit}
          onClear={handleSearchClear}
        />
      </View>

      {/* 筛选排序栏 */}
      <FilterSortBar
        sortBy={sortBy}
        onSortChange={updateSort}
        categoryFilter={categoryFilter}
        locationFilter={locationFilter}
        statusFilter={statusFilter}
        onFiltersChange={updateFilters}
        categories={categories}
        locations={locations}
        onClearFilters={clearFilters}
      />

      {/* 统计信息 */}
      <View style={styles.statsContainer}>
        <Text style={[styles.statsText, { color: theme.colors.textSecondary }]}>
          共 {totalCount} 个食物
        </Text>
        {(categoryFilter || locationFilter || statusFilter || searchQuery) && (
          <Text style={[styles.filterInfo, { color: theme.colors.primary }]}>
            已筛选
          </Text>
        )}
      </View>
    </View>
  );

  // 渲染列表尾部
  const renderListFooter = () => {
    if (!hasMore) {
      return foods.length > 0 ? (
        <View style={styles.listFooter}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            已显示全部食物
          </Text>
        </View>
      ) : null;
    }

    return loading ? (
      <View style={styles.listFooter}>
        <Loading size="small" />
      </View>
    ) : null;
  };

  if (loading && foods.length === 0) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* 头部标题栏 */}
        <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            我的食物
          </Text>
          <TouchableOpacity
            style={styles.addIconButton}
            onPress={() => router.push('/food/add')}
          >
            <Ionicons
              name="add-circle"
              size={28}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        {error && foods.length === 0 ? (
          renderErrorState()
        ) : (
          <FlatList
            data={foods}
            renderItem={renderFoodItem}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={renderListHeader}
            ListFooterComponent={renderListFooter}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.1}
            contentContainerStyle={[
              styles.listContent,
              foods.length === 0 && styles.emptyListContent
            ]}
            showsVerticalScrollIndicator={false}
          />
        )}
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
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  addIconButton: {
    padding: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  listHeader: {
    paddingBottom: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statsText: {
    fontSize: 14,
  },
  filterInfo: {
    fontSize: 14,
    fontWeight: '500',
  },
  listFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
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
    lineHeight: 24,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
