import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Layout } from '@/components/ui/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { useFoodList } from '@/hooks/useFoodList';
import { apiClient } from '@/lib/api';
import type { Food } from '@/types';

interface NutritionAnalysis {
  nutrition_summary: {
    total_nutrition: {
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
      fiber: number;
      sugar: number;
      sodium: number;
      potassium: number;
      calcium: number;
      iron: number;
      vitamin_c: number;
      vitamin_a: number;
    };
    food_details: Array<{
      name: string;
      quantity: number;
      unit: string;
      nutrition: any;
    }>;
    macros_percentage: {
      protein: number;
      fat: number;
      carbs: number;
    };
  };
  recommendations: string[];
  health_assessment: {
    score: number;
    level: string;
    color: string;
    issues: string[];
    strengths: string[];
  };
  analysis_date: string;
  total_foods: number;
}

interface CalorieResult {
  food_name: string;
  quantity: number;
  unit: string;
  nutrition: any;
  calories: number;
  nutrition_density: number;
}

interface DailyGoal {
  user_info: {
    gender: string;
    age: number;
    weight: number;
    height: number;
    activity_level: string;
    health_goal: string;
  };
  calculated_values: {
    bmr: number;
    tdee: number;
    bmi: number;
    health_status: string;
  };
  daily_goals: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
    sodium: number;
    potassium: number;
    calcium: number;
    iron: number;
    vitamin_c: number;
    vitamin_a: number;
  };
  recommendations: string[];
}

export default function NutritionScreen() {
  const { theme } = useTheme();
  const { foods } = useFoodList();
  
  const [activeTab, setActiveTab] = useState<'analyze' | 'calculator' | 'goals'>('analyze');
  const [selectedFoods, setSelectedFoods] = useState<Set<number>>(new Set());
  const [analyzing, setAnalyzing] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<NutritionAnalysis | null>(null);
  const [calorieResult, setCalorieResult] = useState<CalorieResult | null>(null);
  const [dailyGoalResult, setDailyGoalResult] = useState<DailyGoal | null>(null);
  
  // 卡路里计算器状态
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('g');
  
  // 每日目标计算器状态
  const [userInfo, setUserInfo] = useState({
    gender: 'male',
    age: '30',
    weight: '70',
    height: '170',
    activity_level: 'moderate',
    health_goal: 'maintenance'
  });
  const [showGoalModal, setShowGoalModal] = useState(false);

  // 切换食物选择
  const toggleFoodSelection = useCallback((foodId: number) => {
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

  // 分析营养成分
  const analyzeNutrition = async () => {
    if (selectedFoods.size === 0) {
      Alert.alert('提示', '请先选择要分析的食物');
      return;
    }

    setAnalyzing(true);
    try {
      const selectedFoodList = foods.filter(food => selectedFoods.has(food.id));
      const foodsData = selectedFoodList.map(food => ({
        name: food.name,
        quantity: food.quantity,
        unit: food.unit || 'g'
      }));

      const response = await apiClient.post('/nutrition/analyze', {
        foods: foodsData
      });

      setAnalysisResult(response.data);
      Alert.alert('分析完成', '营养分析已完成，请查看结果');
    } catch (error) {
      console.error('Nutrition analysis failed:', error);
      Alert.alert('分析失败', error instanceof Error ? error.message : '营养分析失败，请重试');
    } finally {
      setAnalyzing(false);
    }
  };

  // 计算卡路里
  const calculateCalories = async () => {
    if (!foodName.trim() || !quantity.trim()) {
      Alert.alert('提示', '请填写完整的食物信息');
      return;
    }

    setCalculating(true);
    try {
      const response = await apiClient.post('/nutrition/calculate-calories', {
        name: foodName.trim(),
        quantity: parseFloat(quantity),
        unit: unit
      });

      setCalorieResult(response.data);
    } catch (error) {
      console.error('Calorie calculation failed:', error);
      Alert.alert('计算失败', error instanceof Error ? error.message : '卡路里计算失败，请重试');
    } finally {
      setCalculating(false);
    }
  };

  // 计算每日目标
  const calculateDailyGoal = async () => {
    try {
      const response = await apiClient.post('/nutrition/daily-goal', {
        gender: userInfo.gender,
        age: parseInt(userInfo.age),
        weight: parseFloat(userInfo.weight),
        height: parseFloat(userInfo.height),
        activity_level: userInfo.activity_level,
        health_goal: userInfo.health_goal
      });

      setDailyGoalResult(response.data);
      setShowGoalModal(false);
      Alert.alert('计算完成', '每日营养目标已计算完成');
    } catch (error) {
      console.error('Daily goal calculation failed:', error);
      Alert.alert('计算失败', error instanceof Error ? error.message : '目标计算失败，请重试');
    }
  };

  // 渲染食物选择项
  const renderFoodItem = ({ item }: { item: Food }) => {
    const isSelected = selectedFoods.has(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.foodItem,
          {
            backgroundColor: isSelected ? theme.colors.primary + '20' : theme.colors.surface,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          }
        ]}
        onPress={() => toggleFoodSelection(item.id)}
      >
        <View style={styles.foodInfo}>
          <Text style={[styles.foodName, { color: theme.colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.foodQuantity, { color: theme.colors.textSecondary }]}>
            {item.quantity}{item.unit || 'g'}
          </Text>
        </View>
        <View style={[
          styles.checkbox,
          {
            backgroundColor: isSelected ? theme.colors.primary : 'transparent',
            borderColor: theme.colors.primary,
          }
        ]}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color="#fff" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // 渲染营养成分圆环
  const renderNutritionRing = (label: string, value: number, percentage: number, color: string) => (
    <View style={styles.nutritionRing}>
      <View style={[styles.ringContainer, { borderColor: color + '30' }]}>
        <View style={[
          styles.ringFill,
          {
            backgroundColor: color,
            transform: [{ rotate: `${percentage * 3.6}deg` }]
          }
        ]} />
        <View style={styles.ringCenter}>
          <Text style={[styles.ringPercentage, { color }]}>
            {percentage.toFixed(0)}%
          </Text>
        </View>
      </View>
      <Text style={[styles.ringLabel, { color: theme.colors.text }]}>
        {label}
      </Text>
      <Text style={[styles.ringValue, { color: theme.colors.textSecondary }]}>
        {value.toFixed(1)}g
      </Text>
    </View>
  );

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
            营养分析
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tab切换 */}
        <View style={[styles.tabContainer, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'analyze' && { backgroundColor: theme.colors.primary }
            ]}
            onPress={() => setActiveTab('analyze')}
          >
            <Text style={[
              styles.tabText,
              {
                color: activeTab === 'analyze' ? '#fff' : theme.colors.text
              }
            ]}>
              营养分析
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'calculator' && { backgroundColor: theme.colors.primary }
            ]}
            onPress={() => setActiveTab('calculator')}
          >
            <Text style={[
              styles.tabText,
              {
                color: activeTab === 'calculator' ? '#fff' : theme.colors.text
              }
            ]}>
              卡路里计算
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'goals' && { backgroundColor: theme.colors.primary }
            ]}
            onPress={() => setActiveTab('goals')}
          >
            <Text style={[
              styles.tabText,
              {
                color: activeTab === 'goals' ? '#fff' : theme.colors.text
              }
            ]}>
              每日目标
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 营养分析页面 */}
          {activeTab === 'analyze' && (
            <>
              {/* 食物选择 */}
              <Card style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  选择要分析的食物
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
                  已选择 {selectedFoods.size} 个食物
                </Text>
                
                <FlatList
                  data={foods}
                  renderItem={renderFoodItem}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.foodList}
                  scrollEnabled={false}
                />

                <Button
                  title="分析营养成分"
                  onPress={analyzeNutrition}
                  loading={analyzing}
                  disabled={selectedFoods.size === 0}
                  style={styles.analyzeButton}
                />
              </Card>

              {/* 分析结果 */}
              {analysisResult && (
                <>
                  {/* 营养摘要 */}
                  <Card style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                      营养摘要
                    </Text>
                    
                    <View style={styles.caloriesContainer}>
                      <Text style={[styles.caloriesValue, { color: theme.colors.primary }]}>
                        {analysisResult.nutrition_summary.total_nutrition.calories.toFixed(0)}
                      </Text>
                      <Text style={[styles.caloriesLabel, { color: theme.colors.textSecondary }]}>
                        卡路里
                      </Text>
                    </View>

                    <View style={styles.macrosContainer}>
                      {renderNutritionRing(
                        '蛋白质',
                        analysisResult.nutrition_summary.total_nutrition.protein,
                        analysisResult.nutrition_summary.macros_percentage.protein,
                        '#4CAF50'
                      )}
                      {renderNutritionRing(
                        '脂肪',
                        analysisResult.nutrition_summary.total_nutrition.fat,
                        analysisResult.nutrition_summary.macros_percentage.fat,
                        '#FF9800'
                      )}
                      {renderNutritionRing(
                        '碳水',
                        analysisResult.nutrition_summary.total_nutrition.carbs,
                        analysisResult.nutrition_summary.macros_percentage.carbs,
                        '#2196F3'
                      )}
                    </View>
                  </Card>

                  {/* 健康评估 */}
                  <Card style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                      健康评估
                    </Text>
                    
                    <View style={styles.healthScore}>
                      <Text style={[
                        styles.scoreValue,
                        { color: analysisResult.health_assessment.color }
                      ]}>
                        {analysisResult.health_assessment.score}
                      </Text>
                      <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>
                        健康评分
                      </Text>
                      <Text style={[
                        styles.scoreLevel,
                        { color: analysisResult.health_assessment.color }
                      ]}>
                        {analysisResult.health_assessment.level}
                      </Text>
                    </View>

                    {analysisResult.health_assessment.issues.length > 0 && (
                      <View style={styles.issues}>
                        <Text style={[styles.issuesTitle, { color: theme.colors.text }]}>
                          需要注意：
                        </Text>
                        {analysisResult.health_assessment.issues.map((issue, index) => (
                          <Text key={index} style={[styles.issueText, { color: theme.colors.error }]}>
                            • {issue}
                          </Text>
                        ))}
                      </View>
                    )}
                  </Card>

                  {/* 营养建议 */}
                  <Card style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                      营养建议
                    </Text>
                    
                    {analysisResult.recommendations.map((rec, index) => (
                      <Text key={index} style={[styles.recommendationText, { color: theme.colors.textSecondary }]}>
                        {rec}
                      </Text>
                    ))}
                  </Card>
                </>
              )}
            </>
          )}

          {/* 卡路里计算器页面 */}
          {activeTab === 'calculator' && (
            <>
              <Card style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  卡路里计算器
                </Text>
                
                <Input
                  label="食物名称"
                  value={foodName}
                  onChangeText={setFoodName}
                  placeholder="如：苹果、香蕉、大米"
                />

                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Input
                      label="数量"
                      value={quantity}
                      onChangeText={setQuantity}
                      placeholder="请输入数量"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.unitContainer}>
                    <Input
                      label="单位"
                      value={unit}
                      onChangeText={setUnit}
                      placeholder="g"
                    />
                  </View>
                </View>

                <Button
                  title="计算卡路里"
                  onPress={calculateCalories}
                  loading={calculating}
                  style={styles.calculateButton}
                />
              </Card>

              {calorieResult && (
                <Card style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    计算结果
                  </Text>
                  
                  <View style={styles.calorieResult}>
                    <Text style={[styles.resultFood, { color: theme.colors.text }]}>
                      {calorieResult.food_name} ({calorieResult.quantity}{calorieResult.unit})
                    </Text>
                    <Text style={[styles.resultCalories, { color: theme.colors.primary }]}>
                      {calorieResult.calories.toFixed(1)} 卡路里
                    </Text>
                    <Text style={[styles.resultDensity, { color: theme.colors.textSecondary }]}>
                      营养密度：{calorieResult.nutrition_density.toFixed(1)} 卡/g
                    </Text>
                  </View>
                </Card>
              )}
            </>
          )}

          {/* 每日目标页面 */}
          {activeTab === 'goals' && (
            <>
              <Card style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  每日营养目标
                </Text>
                
                <Button
                  title="设置个人信息"
                  onPress={() => setShowGoalModal(true)}
                  variant="outline"
                  style={styles.setInfoButton}
                />
              </Card>

              {dailyGoalResult && (
                <>
                  {/* 基础信息 */}
                  <Card style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                      个人信息
                    </Text>
                    
                    <View style={styles.userInfoGrid}>
                      <View style={styles.infoItem}>
                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                          BMI
                        </Text>
                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                          {dailyGoalResult.calculated_values.bmi}
                        </Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                          健康状态
                        </Text>
                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                          {dailyGoalResult.calculated_values.health_status}
                        </Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                          基础代谢
                        </Text>
                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                          {dailyGoalResult.calculated_values.bmr} 卡
                        </Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                          总消耗
                        </Text>
                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                          {dailyGoalResult.calculated_values.tdee} 卡
                        </Text>
                      </View>
                    </View>
                  </Card>

                  {/* 营养目标 */}
                  <Card style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                      每日营养目标
                    </Text>
                    
                    <View style={styles.goalItem}>
                      <Text style={[styles.goalLabel, { color: theme.colors.text }]}>
                        卡路里
                      </Text>
                      <Text style={[styles.goalValue, { color: theme.colors.primary }]}>
                        {dailyGoalResult.daily_goals.calories} 卡
                      </Text>
                    </View>
                    <View style={styles.goalItem}>
                      <Text style={[styles.goalLabel, { color: theme.colors.text }]}>
                        蛋白质
                      </Text>
                      <Text style={[styles.goalValue, { color: theme.colors.text }]}>
                        {dailyGoalResult.daily_goals.protein} g
                      </Text>
                    </View>
                    <View style={styles.goalItem}>
                      <Text style={[styles.goalLabel, { color: theme.colors.text }]}>
                        脂肪
                      </Text>
                      <Text style={[styles.goalValue, { color: theme.colors.text }]}>
                        {dailyGoalResult.daily_goals.fat} g
                      </Text>
                    </View>
                    <View style={styles.goalItem}>
                      <Text style={[styles.goalLabel, { color: theme.colors.text }]}>
                        碳水化合物
                      </Text>
                      <Text style={[styles.goalValue, { color: theme.colors.text }]}>
                        {dailyGoalResult.daily_goals.carbs} g
                      </Text>
                    </View>
                  </Card>

                  {/* 建议 */}
                  <Card style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                      个性化建议
                    </Text>
                    
                    {dailyGoalResult.recommendations.map((rec, index) => (
                      <Text key={index} style={[styles.recommendationText, { color: theme.colors.textSecondary }]}>
                        {rec}
                      </Text>
                    ))}
                  </Card>
                </>
              )}
            </>
          )}
        </ScrollView>

        {/* 个人信息设置模态框 */}
        <Modal
          visible={showGoalModal}
          onClose={() => setShowGoalModal(false)}
          title="设置个人信息"
        >
          <ScrollView style={styles.modalContent}>
            <Input
              label="年龄"
              value={userInfo.age}
              onChangeText={(value) => setUserInfo(prev => ({ ...prev, age: value }))}
              keyboardType="numeric"
            />
            <Input
              label="体重 (kg)"
              value={userInfo.weight}
              onChangeText={(value) => setUserInfo(prev => ({ ...prev, weight: value }))}
              keyboardType="numeric"
            />
            <Input
              label="身高 (cm)"
              value={userInfo.height}
              onChangeText={(value) => setUserInfo(prev => ({ ...prev, height: value }))}
              keyboardType="numeric"
            />
            
            <View style={styles.modalButtons}>
              <Button
                title="取消"
                onPress={() => setShowGoalModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="计算目标"
                onPress={calculateDailyGoal}
                style={styles.modalButton}
              />
            </View>
          </ScrollView>
        </Modal>
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
  placeholder: {
    width: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 4,
    margin: 16,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  foodList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  foodQuantity: {
    fontSize: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeButton: {
    marginTop: 8,
  },
  caloriesContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  caloriesValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  caloriesLabel: {
    fontSize: 16,
    marginTop: 4,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionRing: {
    alignItems: 'center',
  },
  ringContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  ringFill: {
    position: 'absolute',
    width: 4,
    height: 36,
    top: 4,
    transformOrigin: '2px 36px',
  },
  ringCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercentage: {
    fontSize: 14,
    fontWeight: '700',
  },
  ringLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  ringValue: {
    fontSize: 12,
  },
  healthScore: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 16,
    marginTop: 4,
  },
  scoreLevel: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  issues: {
    marginTop: 16,
  },
  issuesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  issueText: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  recommendationText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  unitContainer: {
    width: 100,
  },
  calculateButton: {
    marginTop: 16,
  },
  calorieResult: {
    alignItems: 'center',
    padding: 16,
  },
  resultFood: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  resultCalories: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  resultDensity: {
    fontSize: 14,
  },
  setInfoButton: {
    marginTop: 8,
  },
  userInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  goalLabel: {
    fontSize: 16,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    maxHeight: 400,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
  },
});