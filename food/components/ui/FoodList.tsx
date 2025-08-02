// 食物列表组件

import React, { useState, useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  View,
  Text,
  ActivityIndicator,
  ListRenderItem,
} from 'react-native';
import { useTheme } from '@/contexts';
import { FoodCard } from './FoodCard';
import type { FoodListItem } from '@/types';

interface FoodListProps {
  foods: FoodListItem[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  onFoodPress?: (food: FoodListItem) => void;
  onFoodLongPress?: (food: FoodListItem) => void;
  showLocation?: boolean;
  showCategory?: boolean;
  emptyText?: string;
  emptyIcon?: string;
}

export function FoodList({
  foods,
  loading = false,
  refreshing = false,
  onRefresh,
  onLoadMore,
  hasMore = false,
  onFoodPress,
  onFoodLongPress,
  showLocation = true,
  showCategory = true,
  emptyText = '暂无食物',
  emptyIcon = '🍎',
}: FoodListProps) {
  const { theme } = useTheme();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const renderItem: ListRenderItem<FoodListItem> = useCallback(({ item }) => (
    <FoodCard
      food={item}
      onPress={() => onFoodPress?.(item)}
      onLongPress={() => onFoodLongPress?.(item)}
      showLocation={showLocation}
      showCategory={showCategory}
    />
  ), [onFoodPress, onFoodLongPress, showLocation, showCategory]);

  const keyExtractor = useCallback((item: FoodListItem) => item.id.toString(), []);

  const handleLoadMore = useCallback(async () => {
    if (hasMore && !isLoadingMore && !loading) {
      setIsLoadingMore(true);
      try {
        await onLoadMore?.();
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [hasMore, isLoadingMore, loading, onLoadMore]);

  const renderFooter = () => {
    if (!hasMore && foods.length > 0) {
      return (
        <View
          style={{
            padding: theme.spacing.md,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.textHint,
            }}
          >
            没有更多食物了
          </Text>
        </View>
      );
    }

    if (isLoadingMore) {
      return (
        <View
          style={{
            padding: theme.spacing.md,
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      );
    }

    return null;
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: theme.spacing.xxl,
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={{
              fontSize: theme.fontSize.md,
              color: theme.colors.textSecondary,
              marginTop: theme.spacing.md,
            }}
          >
            加载中...
          </Text>
        </View>
      );
    }

    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: theme.spacing.xxl,
        }}
      >
        <Text
          style={{
            fontSize: 48,
            marginBottom: theme.spacing.md,
          }}
        >
          {emptyIcon}
        </Text>
        <Text
          style={{
            fontSize: theme.fontSize.lg,
            color: theme.colors.textSecondary,
            textAlign: 'center',
          }}
        >
          {emptyText}
        </Text>
      </View>
    );
  };

  return (
    <FlatList
      data={foods}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.3}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={{
        flexGrow: 1,
        padding: theme.spacing.md,
      }}
      showsVerticalScrollIndicator={false}
    />
  );
}

// 食物网格组件
interface FoodGridProps extends Omit<FoodListProps, 'foods'> {
  foods: FoodListItem[];
  numColumns?: number;
}

export function FoodGrid({
  foods,
  numColumns = 2,
  ...props
}: FoodGridProps) {
  const { theme } = useTheme();

  const renderItem: ListRenderItem<FoodListItem> = useCallback(({ item, index }) => (
    <View
      style={{
        flex: 1,
        marginLeft: index % numColumns === 0 ? 0 : theme.spacing.sm,
      }}
    >
      <FoodCard
        food={item}
        onPress={() => props.onFoodPress?.(item)}
        onLongPress={() => props.onFoodLongPress?.(item)}
        showLocation={props.showLocation}
        showCategory={props.showCategory}
      />
    </View>
  ), [numColumns, props.onFoodPress, props.onFoodLongPress, props.showLocation, props.showCategory, theme.spacing.sm]);

  return (
    <FoodList
      {...props}
      foods={foods}
      // 重写renderItem以支持网格布局
    />
  );
}