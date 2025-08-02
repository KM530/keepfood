// 食物卡片组件

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/contexts';
import { formatDate, getFoodStatusText } from '@/utils/date';
import { formatQuantity } from '@/utils/format';
import type { FoodListItem } from '@/types';

interface FoodCardProps {
  food: FoodListItem;
  onPress?: () => void;
  onLongPress?: () => void;
  showLocation?: boolean;
  showCategory?: boolean;
}

export function FoodCard({
  food,
  onPress,
  onLongPress,
  showLocation = true,
  showCategory = true,
}: FoodCardProps) {
  const { theme } = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expired':
        return theme.colors.foodExpired;
      case 'expiring_soon':
        return theme.colors.foodExpiringSoon;
      case 'normal':
        return theme.colors.foodNormal;
      default:
        return theme.colors.foodNormal;
    }
  };

  const cardStyle = {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  };

  const statusIndicatorStyle = {
    position: 'absolute' as const,
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: getStatusColor(food.status),
  };

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* 状态指示器 */}
      <View style={statusIndicatorStyle} />

      <View style={{ flexDirection: 'row' }}>
        {/* 食物图片 */}
        {food.imageUrl ? (
          <Image
            source={{ uri: food.imageUrl }}
            style={{
              width: 60,
              height: 60,
              borderRadius: theme.borderRadius.md,
              marginRight: theme.spacing.md,
            }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.colors.surface,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: theme.spacing.md,
            }}
          >
            <Text style={{
              fontSize: theme.fontSize.lg,
              color: theme.colors.textSecondary,
            }}>
              🍎
            </Text>
          </View>
        )}

        {/* 食物信息 */}
        <View style={{ flex: 1 }}>
          {/* 食物名称 */}
          <Text
            style={{
              fontSize: theme.fontSize.lg,
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.text,
              marginBottom: theme.spacing.xs,
            }}
            numberOfLines={1}
          >
            {food.name}
          </Text>

          {/* 数量信息 */}
          <Text
            style={{
              fontSize: theme.fontSize.md,
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing.xs,
            }}
          >
            {formatQuantity(food.quantity, food.unit)}
          </Text>

          {/* 分类和位置 */}
          <View style={{ flexDirection: 'row', marginBottom: theme.spacing.xs }}>
            {showCategory && food.categoryName && (
              <View
                style={{
                  backgroundColor: theme.colors.surface,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  borderRadius: theme.borderRadius.sm,
                  marginRight: theme.spacing.sm,
                }}
              >
                <Text
                  style={{
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.textSecondary,
                  }}
                >
                  {food.categoryName}
                </Text>
              </View>
            )}

            {showLocation && food.locationName && (
              <View
                style={{
                  backgroundColor: theme.colors.surface,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  borderRadius: theme.borderRadius.sm,
                }}
              >
                <Text
                  style={{
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.textSecondary,
                  }}
                >
                  📍 {food.locationName}
                </Text>
              </View>
            )}
          </View>

          {/* 过期信息 */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: getStatusColor(food.status),
                fontWeight: theme.fontWeight.medium,
              }}
            >
              {food.statusText || getFoodStatusText(food.expiryDate)}
            </Text>
            
            <Text
              style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.textHint,
                marginLeft: theme.spacing.sm,
              }}
            >
              {formatDate(food.expiryDate, 'MM-dd')}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// 食物状态指示器组件
interface FoodStatusIndicatorProps {
  status: string;
  size?: number;
}

export function FoodStatusIndicator({ status, size = 12 }: FoodStatusIndicatorProps) {
  const { theme } = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expired':
        return theme.colors.foodExpired;
      case 'expiring_soon':
        return theme.colors.foodExpiringSoon;
      case 'normal':
        return theme.colors.foodNormal;
      default:
        return theme.colors.foodNormal;
    }
  };

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: getStatusColor(status),
      }}
    />
  );
}

// 食物状态标签组件
interface FoodStatusBadgeProps {
  status: string;
  text?: string;
}

export function FoodStatusBadge({ status, text }: FoodStatusBadgeProps) {
  const { theme } = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expired':
        return theme.colors.foodExpired;
      case 'expiring_soon':
        return theme.colors.foodExpiringSoon;
      case 'normal':
        return theme.colors.foodNormal;
      default:
        return theme.colors.foodNormal;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'expired':
        return '已过期';
      case 'expiring_soon':
        return '即将过期';
      case 'normal':
        return '新鲜';
      default:
        return '未知';
    }
  };

  const statusColor = getStatusColor(status);

  return (
    <View
      style={{
        backgroundColor: statusColor + '20', // 添加透明度
        borderWidth: 1,
        borderColor: statusColor,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.sm,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          fontSize: theme.fontSize.xs,
          color: statusColor,
          fontWeight: theme.fontWeight.medium,
        }}
      >
        {text || getStatusText(status)}
      </Text>
    </View>
  );
}