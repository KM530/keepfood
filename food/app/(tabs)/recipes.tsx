import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Layout } from '@/components/ui/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { useFoodList } from '@/hooks/useFoodList';
import { formatRelativeDate, getFoodStatus } from '@/utils/date';
import type { FoodListItem } from '@/types';

interface Recipe {
  name: string;
  ingredients: string[];
  video_url: string;
  matched_ingredients: string[];
  missing_ingredients: string[];
}

export default function RecipesScreen() {
  const { theme } = useTheme();
  const { foods, loading } = useFoodList();
  const [selectedFoods, setSelectedFoods] = useState<Set<number>>(new Set());
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [generatingRecipes, setGeneratingRecipes] = useState(false);

  // 获取即将过期的食物
  const expiringFoods = foods.filter(food => {
    const status = getFoodStatus(food.expiryDate);
    console.log('🔍 食物状态检查:', {
      name: food.name,
      expiryDate: food.expiryDate,
      status: status,
      isExpiring: status === 'expiring_soon' || status === 'expired'
    });
    return status === 'expiring_soon' || status === 'expired';
  });

  // 调试信息
  console.log('📊 菜谱页面数据统计:', {
    totalFoods: foods.length,
    expiringFoods: expiringFoods.length,
    selectedFoods: selectedFoods.size
  });

  // 处理食物选择
  const handleFoodSelect = useCallback((foodId: number) => {
    setSelectedFoods(prev => {
      const newSet = new Set(prev);
      if (newSet.has(foodId)) {
        newSet.delete(foodId);
      } else {
        newSet.add(foodId);
      }
      return newSet;
    });
  }, []);

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedFoods.size === expiringFoods.length) {
      setSelectedFoods(new Set());
    } else {
      setSelectedFoods(new Set(expiringFoods.map(food => food.id)));
    }
  };

  // 生成菜谱
  const handleGenerateRecipes = async () => {
    if (selectedFoods.size === 0) {
      Alert.alert('提示', '请先选择要使用的食物');
      return;
    }

    setGeneratingRecipes(true);
    try {
      const { apiClient } = await import('@/lib/api');
      
      // 获取选中食物的名称
      const selectedFoodNames = foods
        .filter(food => selectedFoods.has(food.id))
        .map(food => food.name);
      
      console.log('🍳 准备生成菜谱，食材:', selectedFoodNames);
      
      const recipes = await apiClient.generateRecipes({
        food_names: selectedFoodNames
      });

      setRecipes(recipes);
      
      Alert.alert(
        '生成完成',
        `为您生成了 ${recipes.length} 道菜谱`
      );
    } catch (error) {
      console.error('Failed to generate recipes:', error);
      
      // 如果API调用失败，回退到模拟数据
      const selectedFoodList = foods.filter(food => selectedFoods.has(food.id));
      const mockRecipes: Recipe[] = selectedFoodList.slice(0, 2).map((food, index) => ({
        name: `${food.name}特色料理`,
        ingredients: [food.name, '盐', '油', '生抽'],
        video_url: 'https://www.bilibili.com/video/BV1ttKxzQEBD',
        matched_ingredients: [food.name],
        missing_ingredients: ['盐', '油', '生抽']
      }));
      
      setRecipes(mockRecipes);
      Alert.alert('生成完成', `为您生成了 ${mockRecipes.length} 道菜谱（使用备用方案）`);
    } finally {
      setGeneratingRecipes(false);
    }
  };

  // 打开视频链接
  const handleOpenVideo = async (videoUrl: string) => {
    try {
      const supported = await Linking.canOpenURL(videoUrl);
      if (supported) {
        await Linking.openURL(videoUrl);
      } else {
        Alert.alert('错误', '无法打开视频链接');
      }
    } catch (error) {
      console.error('Failed to open video:', error);
      Alert.alert('错误', '打开视频失败');
    }
  };

  // 渲染食物项
  const renderFoodItem = ({ item }: { item: FoodListItem }) => {
    const isSelected = selectedFoods.has(item.id);
    const status = getFoodStatus(item.expiryDate);
    const statusColor = status === 'expired' ? '#F44336' : '#FF9800';

    return (
      <TouchableOpacity
        style={[
          styles.foodItem,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
            borderWidth: isSelected ? 2 : 1,
          }
        ]}
        onPress={() => handleFoodSelect(item.id)}
      >
        {item.imageUrl && (
          <Image source={{ uri: Array.isArray(item.imageUrl) ? item.imageUrl[0] : item.imageUrl }} style={styles.foodImage} />
        )}
        <View style={styles.foodInfo}>
          <Text style={[styles.foodName, { color: theme.colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.foodExpiry, { color: statusColor }]}>
            {formatRelativeDate(item.expiryDate)}
          </Text>
          <Text style={[styles.foodQuantity, { color: theme.colors.textSecondary }]}>
            剩余 {item.quantity}{item.unit || ''}
          </Text>
        </View>
        {isSelected && (
          <View style={[styles.selectedBadge, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // 渲染菜谱项
  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <Card style={styles.recipeCard}>
      <View style={styles.recipeHeader}>
        <Text style={[styles.recipeTitle, { color: theme.colors.text }]}>
          {item.name}
        </Text>
        <TouchableOpacity
          style={styles.videoButton}
          onPress={() => handleOpenVideo(item.video_url)}
        >
          <Ionicons name="play-circle" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.recipeIngredients}>
        <Text style={[styles.recipeSection, { color: theme.colors.text }]}>
          所需食材：
        </Text>
        <View style={styles.ingredientsList}>
          {item.ingredients.map((ingredient, index) => (
            <View key={index} style={[styles.ingredientTag, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.ingredientText, { color: theme.colors.text }]}>
                {ingredient}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {item.matched_ingredients.length > 0 && (
        <View style={styles.matchedIngredients}>
          <Text style={[styles.recipeSection, { color: '#4CAF50' }]}>
            ✅ 匹配的食材：
          </Text>
          <View style={styles.ingredientsList}>
            {item.matched_ingredients.map((ingredient, index) => (
              <View key={index} style={[styles.ingredientTag, { backgroundColor: '#E8F5E8' }]}>
                <Text style={[styles.ingredientText, { color: '#4CAF50' }]}>
                  {ingredient}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {item.missing_ingredients.length > 0 && (
        <View style={styles.missingIngredients}>
          <Text style={[styles.recipeSection, { color: '#FF9800' }]}>
            ⚠️ 缺少的食材：
          </Text>
          <View style={styles.ingredientsList}>
            {item.missing_ingredients.map((ingredient, index) => (
              <View key={index} style={[styles.ingredientTag, { backgroundColor: '#FFF3E0' }]}>
                <Text style={[styles.ingredientText, { color: '#FF9800' }]}>
                  {ingredient}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Button
        title="观看视频教程"
        onPress={() => handleOpenVideo(item.video_url)}
        variant="outline"
        style={styles.recipeButton}
      />
    </Card>
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
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            菜谱推荐
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 即将过期食物提示 */}
          <Card style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={24} color="#FF9800" />
              <Text style={[styles.alertTitle, { color: theme.colors.text }]}>
                即将过期的食物
              </Text>
            </View>
            <Text style={[styles.alertDescription, { color: theme.colors.textSecondary }]}>
              您有 {expiringFoods.length} 个食物即将过期，选择它们来生成美味菜谱吧！
            </Text>
          </Card>

          {/* 食物选择区域 */}
          {expiringFoods.length > 0 ? (
            <Card style={styles.foodSection}>
              <View style={styles.foodSectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  选择食物 ({selectedFoods.size}/{expiringFoods.length})
                </Text>
                <TouchableOpacity onPress={toggleSelectAll}>
                  <Text style={[styles.selectAllText, { color: theme.colors.primary }]}>
                    {selectedFoods.size === expiringFoods.length ? '取消全选' : '全选'}
                  </Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={expiringFoods}
                renderItem={renderFoodItem}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                columnWrapperStyle={styles.foodRow}
                scrollEnabled={false}
              />

              <Button
                title={generatingRecipes ? '正在生成菜谱...' : '生成菜谱推荐'}
                onPress={handleGenerateRecipes}
                disabled={selectedFoods.size === 0 || generatingRecipes}
                loading={generatingRecipes}
                style={styles.generateButton}
              />
            </Card>
          ) : (
            <Card style={styles.emptyCard}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                没有即将过期的食物
              </Text>
              <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
                您的食物管理得很好！所有食物都还很新鲜。
              </Text>
            </Card>
          )}

          {/* 菜谱推荐结果 */}
          {recipes.length > 0 && (
            <View style={styles.recipesSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                推荐菜谱 ({recipes.length})
              </Text>
              {recipes.map((recipe, index) => (
                <View key={index}>
                  {renderRecipeItem({ item: recipe })}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  alertCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFF3E0',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  alertDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  foodSection: {
    marginBottom: 16,
    padding: 16,
  },
  foodSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  foodRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  foodItem: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    position: 'relative',
  },
  foodImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  foodInfo: {
    gap: 4,
  },
  foodName: {
    fontSize: 14,
    fontWeight: '600',
  },
  foodExpiry: {
    fontSize: 12,
    fontWeight: '500',
  },
  foodQuantity: {
    fontSize: 12,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButton: {
    marginTop: 16,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    marginBottom: 16,
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
  },
  recipesSection: {
    marginTop: 8,
  },
  recipeCard: {
    marginBottom: 16,
    padding: 16,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  videoButton: {
    padding: 4,
  },
  recipeSection: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  recipeIngredients: {
    marginBottom: 12,
  },
  matchedIngredients: {
    marginBottom: 12,
  },
  missingIngredients: {
    marginBottom: 12,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ingredientText: {
    fontSize: 12,
  },
  recipeButton: {
    marginTop: 8,
  },
});