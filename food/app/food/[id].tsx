import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Layout } from '@/components/ui/Layout';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { apiClient } from '@/lib/api';
import { formatDate, formatRelativeDate, getFoodStatus } from '@/utils/date';
import type { Food } from '@/types';

export default function FoodDetailScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取食物详情
  const fetchFoodDetail = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getFood(parseInt(id));
      setFood(response);
    } catch (err) {
      console.error('Failed to fetch food detail:', err);
      setError(err instanceof Error ? err.message : '获取食物详情失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFoodDetail();
  }, [fetchFoodDetail]);

  // 编辑食物
  const handleEdit = useCallback(() => {
    if (food) {
      router.push(`/food/edit/${food.id}`);
    }
  }, [food]);

  // 删除食物
  const handleDelete = useCallback(async () => {
    if (!food) return;

    Alert.alert(
      '删除食物',
      `确定要删除「${food.name}」吗？此操作无法撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.deleteFood(food.id);
              Alert.alert('删除成功', '食物已删除', [
                { text: '确定', onPress: () => router.back() }
              ]);
            } catch (err) {
              Alert.alert('删除失败', err instanceof Error ? err.message : '删除食物失败');
            }
          },
        },
      ]
    );
  }, [food]);

  // 消费食物
  const handleConsume = useCallback(async () => {
    if (!food) return;

    Alert.prompt(
      '消费食物',
      `请输入消费的数量（当前剩余：${food.quantity}${food.unit || ''}）`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async (value) => {
            if (!value) return;
            
            const consumeQuantity = parseFloat(value);
            if (isNaN(consumeQuantity) || consumeQuantity <= 0) {
              Alert.alert('错误', '请输入有效的数量');
              return;
            }

            if (consumeQuantity > food.quantity) {
              Alert.alert('错误', '消费数量不能超过剩余数量');
              return;
            }

            try {
              await apiClient.consumeFood(food.id, { quantity: consumeQuantity });
              Alert.alert('消费成功', '食物数量已更新');
              fetchFoodDetail(); // 重新获取数据
            } catch (err) {
              Alert.alert('消费失败', err instanceof Error ? err.message : '消费食物失败');
            }
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  }, [food, fetchFoodDetail]);

  // 获取状态信息
  const getStatusInfo = (food: Food) => {
    const status = getFoodStatus(food.expiry_date);
    const colors = {
      normal: { bg: '#E8F5E8', text: '#2E7D32', icon: 'checkmark-circle' },
      expiring_soon: { bg: '#FFF3E0', text: '#F57C00', icon: 'warning' },
      expired: { bg: '#FFEBEE', text: '#D32F2F', icon: 'close-circle' },
    };
    return colors[status];
  };

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  if (error || !food) {
    return (
      <Layout>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              食物详情
            </Text>
          </View>
          
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={64}
              color={theme.colors.error}
            />
            <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
              加载失败
            </Text>
            <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
              {error || '食物不存在'}
            </Text>
            <Button
              title="重试"
              onPress={fetchFoodDetail}
              style={styles.retryButton}
            />
          </View>
        </SafeAreaView>
      </Layout>
    );
  }

  const statusInfo = getStatusInfo(food);

  return (
    <Layout>
      <SafeAreaView style={styles.container}>
        {/* 头部导航 */}
        <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            食物详情
          </Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEdit}
          >
            <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 食物图片 */}
          {food.image_url && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: food.image_url }}
                style={styles.foodImage}
                resizeMode="cover"
              />
            </View>
          )}

          {/* 基本信息 */}
          <Card style={styles.infoCard}>
            <View style={styles.nameContainer}>
              <Text style={[styles.foodName, { color: theme.colors.text }]}>
                {food.name}
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: statusInfo.bg }
              ]}>
                <Ionicons
                  name={statusInfo.icon as any}
                  size={16}
                  color={statusInfo.text}
                />
                <Text style={[styles.statusText, { color: statusInfo.text }]}>
                  {getFoodStatus(food.expiry_date) === 'normal' ? '正常' :
                   getFoodStatus(food.expiry_date) === 'expiring_soon' ? '即将过期' : '已过期'}
                </Text>
              </View>
            </View>

            {/* {food.description && (
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                {food.description}
              </Text>
            )} */}

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="layers-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  数量
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {food.quantity}{food.unit || ''}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  到期时间
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {formatDate(food.expiry_date)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="pricetag-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  分类
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {food.category?.name || '未分类'}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  位置
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {food.location?.name || '未设置'}
                </Text>
              </View>
            </View>
          </Card>

          {/* 营养信息 */}
          {food.nutritionInfo && (
            <Card style={styles.nutritionCard}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                营养信息
              </Text>
              <View style={styles.nutritionGrid}>
                {food.nutritionInfo.calories && (
                  <View style={styles.nutritionItem}>
                    <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                      {food.nutritionInfo.calories}
                    </Text>
                    <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>
                      卡路里
                    </Text>
                  </View>
                )}
                {food.nutritionInfo.protein && (
                  <View style={styles.nutritionItem}>
                    <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                      {food.nutritionInfo.protein}g
                    </Text>
                    <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>
                      蛋白质
                    </Text>
                  </View>
                )}
                {food.nutritionInfo.carbs && (
                  <View style={styles.nutritionItem}>
                    <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                      {food.nutritionInfo.carbs}g
                    </Text>
                    <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>
                      碳水化合物
                    </Text>
                  </View>
                )}
                {food.nutritionInfo.fat && (
                  <View style={styles.nutritionItem}>
                    <Text style={[styles.nutritionValue, { color: theme.colors.text }]}>
                      {food.nutritionInfo.fat}g
                    </Text>
                    <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>
                      脂肪
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          )}

          {/* 有害成分警告 */}
          {food.harmfulIngredients && food.harmfulIngredients.length > 0 && (
            <Card style={[styles.warningCard, { backgroundColor: '#FFF3E0' }]}>
              <View style={styles.warningHeader}>
                <Ionicons name="warning" size={20} color="#F57C00" />
                <Text style={[styles.warningTitle, { color: '#F57C00' }]}>
                  有害成分提醒
                </Text>
              </View>
              <Text style={[styles.warningText, { color: '#E65100' }]}>
                {food.harmfulIngredients.join('、')}
              </Text>
            </Card>
          )}

          {/* 时间信息 */}
          <Card style={styles.timeCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              时间信息
            </Text>
            <View style={styles.timeInfo}>
              <View style={styles.timeItem}>
                <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>
                  添加时间
                </Text>
                <Text style={[styles.timeValue, { color: theme.colors.text }]}>
                  {formatDate(food.created_at)}
                </Text>
              </View>
              <View style={styles.timeItem}>
                <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>
                  剩余时间
                </Text>
                <Text style={[styles.timeValue, { color: statusInfo.text }]}>
                  {formatRelativeDate(food.expiry_date)}
                </Text>
              </View>
            </View>
          </Card>
        </ScrollView>

        {/* 底部操作按钮 */}
        <View style={[styles.actionBar, { backgroundColor: theme.colors.background }]}>
          <Button
            title="消费"
            onPress={handleConsume}
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            disabled={food.quantity <= 0}
          />
          <Button
            title="删除"
            onPress={handleDelete}
            style={[styles.actionButton, styles.deleteButton]}
            variant="outline"
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
  editButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imageContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  foodImage: {
    width: '100%',
    height: 200,
  },
  infoCard: {
    marginBottom: 16,
    padding: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  foodName: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  nutritionCard: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  nutritionItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  warningCard: {
    marginBottom: 16,
    padding: 16,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timeCard: {
    marginBottom: 16,
    padding: 16,
  },
  timeInfo: {
    gap: 12,
  },
  timeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    borderColor: '#F44336',
  },
  errorContainer: {
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
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
  },
});