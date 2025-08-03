import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Layout } from '@/components/ui/Layout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MultiImagePicker } from '@/components/ui/MultiImagePicker';
import { Picker } from '@/components/ui/Picker';
import { InputModal } from '@/components/ui/InputModal';
import { useCategories } from '@/hooks/useCategories';
import { useLocations } from '@/hooks/useLocations';
import { apiClient } from '@/lib/api';
import type { CreateFoodRequest, AIFoodAnalysisResponse } from '@/types';

interface FormData {
  name: string;
  quantity: string;
  unit: string;
  expiryDate: string;
  categoryId?: number;
  locationId?: number;
  images: string[];
  productionDate: string;
  shelfLifeValue: string;
  shelfLifeUnit: 'day' | 'month' | 'year';
  ingredientsText: string;
  harmfulIngredients: string[];
  caloriesKcal: string;
  energyOffsetInfo: string;
}

interface FormErrors {
  name?: string;
  quantity?: string;
  expiryDate?: string;
  categoryId?: string;
}

export default function AddFoodScreen() {
  const { theme } = useTheme();
  const { categories } = useCategories();
  const { locations } = useLocations();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    quantity: '',
    unit: '',
    expiryDate: '',
    images: [],
    productionDate: '',
    shelfLifeValue: '',
    shelfLifeUnit: 'month',
    ingredientsText: '',
    harmfulIngredients: [],
    caloriesKcal: '',
    energyOffsetInfo: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  
  // 模态框状态
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  
  // AI分析状态
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);

  // 检查AI服务状态
  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        const status = await apiClient.getAIStatus();
        setAiAvailable(status.available);
      } catch (error) {
        console.log('AI service check failed:', error);
        setAiAvailable(false);
      }
    };
    
    checkAIStatus();
  }, []);

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入食物名称';
    }

    if (!formData.quantity.trim()) {
      newErrors.quantity = '请输入数量';
    } else if (isNaN(parseFloat(formData.quantity)) || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = '请输入有效的数量';
    }

    if (!formData.expiryDate.trim()) {
      newErrors.expiryDate = '请选择到期日期';
    } else {
      const expiryDate = new Date(formData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (expiryDate < today) {
        newErrors.expiryDate = '到期日期不能早于今天';
      }
    }

    if (!formData.categoryId) {
      newErrors.categoryId = '请选择分类';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 更新表单数据
  const updateFormData = useCallback((field: keyof FormData, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // AI分析图片
  const handleAIAnalysis = async () => {
    if (!aiAvailable) {
      Alert.alert('提示', 'AI分析服务暂时不可用');
      return;
    }

    if (formData.images.length === 0) {
      Alert.alert('提示', '请先上传食物图片');
      return;
    }

    setAiAnalyzing(true);
    
    try {
      // 将图片URI转换为File对象（这里需要处理React Native的特殊情况）
      const imageFiles: File[] = [];
      for (const imageUri of formData.images) {
        // 在React Native中，我们需要创建一个FormData兼容的对象
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
        imageFiles.push(file);
      }

      const analysisResult = await apiClient.analyzeFoodImages(imageFiles);
      
      // 自动填充分析结果
      setFormData(prev => ({
        ...prev,
        ingredientsText: analysisResult.ingredients?.join(', ') || prev.ingredientsText,
        harmfulIngredients: analysisResult.potential_concerns?.items || prev.harmfulIngredients,
        productionDate: analysisResult.production_date || prev.productionDate,
        shelfLifeValue: analysisResult.shelf_life?.match(/\d+/)?.[0] || prev.shelfLifeValue,
        shelfLifeUnit: analysisResult.shelf_life?.includes('年') ? 'year' : 
                      analysisResult.shelf_life?.includes('月') ? 'month' : 
                      analysisResult.shelf_life?.includes('天') ? 'day' : prev.shelfLifeUnit,
        expiryDate: analysisResult.expiration_date || prev.expiryDate,
        caloriesKcal: analysisResult.calories_kcal?.toString() || prev.caloriesKcal,
        energyOffsetInfo: analysisResult.energy_offset_info || prev.energyOffsetInfo,
      }));

      Alert.alert('AI分析完成', '已自动填充识别到的信息，请检查并确认');
    } catch (error) {
      console.error('AI analysis failed:', error);
      Alert.alert('AI分析失败', error instanceof Error ? error.message : '分析失败，请重试');
    } finally {
      setAiAnalyzing(false);
    }
  };

  // 处理图片选择
  const handleImagesSelected = useCallback((images: string[]) => {
    updateFormData('images', images);
  }, [updateFormData]);

  // 处理日期选择
  const handleDatePress = () => {
    setDateModalVisible(true);
  };

  const handleDateConfirm = (value: string) => {
    if (value && value.trim()) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value.trim())) {
        Alert.alert('格式错误', '请输入正确的日期格式 (YYYY-MM-DD)');
        return;
      }
      
      const inputDate = new Date(value.trim());
      if (isNaN(inputDate.getTime())) {
        Alert.alert('日期无效', '请输入有效的日期');
        return;
      }
      
      updateFormData('expiryDate', value.trim());
    }
    setDateModalVisible(false);
  };

  // 处理新增分类
  const handleAddCategory = () => {
    setCategoryModalVisible(true);
  };

  const handleCategoryConfirm = async (value: string) => {
    if (!value?.trim()) {
      setCategoryModalVisible(false);
      return;
    }
    
    try {
      const newCategory = await apiClient.createCategory({ name: value.trim() });
      updateFormData('categoryId', newCategory.id);
      Alert.alert('成功', '分类添加成功');
    } catch (error) {
      console.error('Create category error:', error);
      Alert.alert('添加失败', '创建分类失败，请重试');
    }
    setCategoryModalVisible(false);
  };

  // 处理新增位置
  const handleAddLocation = () => {
    setLocationModalVisible(true);
  };

  const handleLocationConfirm = async (value: string) => {
    if (!value?.trim()) {
      setLocationModalVisible(false);
      return;
    }
    
    try {
      const newLocation = await apiClient.createLocation({ name: value.trim() });
      updateFormData('locationId', newLocation.id);
      Alert.alert('成功', '位置添加成功');
    } catch (error) {
      console.error('Create location error:', error);
      Alert.alert('添加失败', '创建位置失败，请重试');
    }
    setLocationModalVisible(false);
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('quantity', formData.quantity);
      formDataToSend.append('unit', formData.unit.trim());
      formDataToSend.append('expiry_date', formData.expiryDate);
      
      if (formData.categoryId) {
        formDataToSend.append('category_id', formData.categoryId.toString());
      }
      
      if (formData.locationId) {
        formDataToSend.append('location_id', formData.locationId.toString());
      }

      // 添加可选字段
      if (formData.productionDate) {
        formDataToSend.append('production_date', formData.productionDate);
      }
      
      if (formData.shelfLifeValue) {
        formDataToSend.append('shelf_life_value', formData.shelfLifeValue);
        formDataToSend.append('shelf_life_unit', formData.shelfLifeUnit);
      }
      
      if (formData.ingredientsText.trim()) {
        formDataToSend.append('ingredients_text', formData.ingredientsText.trim());
      }
      
      if (formData.harmfulIngredients.length > 0) {
        formDataToSend.append('harmful_ingredients', JSON.stringify(formData.harmfulIngredients));
      }
      
      if (formData.caloriesKcal) {
        formDataToSend.append('calories_kcal', formData.caloriesKcal);
      }
      
      if (formData.energyOffsetInfo.trim()) {
        formDataToSend.append('energy_offset_info', formData.energyOffsetInfo.trim());
      }

      // 处理图片上传
      for (const imageUri of formData.images) {
        const filename = imageUri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formDataToSend.append('images', {
          uri: imageUri,
          name: filename,
          type,
        } as any);
      }
      
      await apiClient.createFood(formDataToSend);
      
      Alert.alert(
        '添加成功',
        '食物已成功添加到您的清单中',
        [
          {
            text: '确定',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to create food:', error);
      Alert.alert('添加失败', error instanceof Error ? error.message : '添加食物失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = categories.map(cat => ({ label: cat.name, value: cat.id }));
  const locationOptions = locations.map(loc => ({ label: loc.name, value: loc.id }));

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
            添加食物
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 图片上传 */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              食物图片
            </Text>
            <MultiImagePicker
              value={formData.images}
              onImagesSelected={handleImagesSelected}
              maxImages={5}
            />
          </Card>

          {/* 基本信息 */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              基本信息
            </Text>
            
            <Input
              label="食物名称"
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              placeholder="请输入食物名称"
              required
              error={errors.name}
            />

            <View style={styles.row}>
              <View style={styles.flex}>
                <Input
                  label="数量"
                  value={formData.quantity}
                  onChangeText={(value) => updateFormData('quantity', value)}
                  placeholder="请输入数量"
                  keyboardType="numeric"
                  required
                  error={errors.quantity}
                />
              </View>
              <View style={styles.unitContainer}>
                <Input
                  label="单位"
                  value={formData.unit}
                  onChangeText={(value) => updateFormData('unit', value)}
                  placeholder="如：个、kg"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.dateButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: errors.expiryDate ? theme.colors.error : theme.colors.border,
                }
              ]}
              onPress={handleDatePress}
            >
              <View style={styles.dateButtonContent}>
                <Text style={[styles.dateLabel, { color: theme.colors.text }]}>
                  到期日期 <Text style={{ color: theme.colors.error }}>*</Text>
                </Text>
                <View style={styles.dateValue}>
                  <Text style={[
                    styles.dateText,
                    {
                      color: formData.expiryDate ? theme.colors.text : theme.colors.textSecondary,
                    }
                  ]}>
                    {formData.expiryDate || '请选择到期日期'}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </View>
              </View>
            </TouchableOpacity>
            {errors.expiryDate && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.expiryDate}
              </Text>
            )}
          </Card>

          {/* 分类和位置 */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              分类与位置
            </Text>
            
            <Picker
              label="分类"
              value={formData.categoryId}
              options={categoryOptions}
              onValueChange={(value) => updateFormData('categoryId', value as number)}
              onAddNew={handleAddCategory}
              placeholder="请选择分类"
              required
              error={errors.categoryId}
            />

            <Picker
              label="存放位置"
              value={formData.locationId}
              options={locationOptions}
              onValueChange={(value) => updateFormData('locationId', value as number)}
              onAddNew={handleAddLocation}
              placeholder="请选择存放位置"
            />
          </Card>

          {/* AI分析和详细信息 */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                详细信息
              </Text>
              <Button
                title={aiAnalyzing ? '分析中...' : 'AI识别'}
                onPress={handleAIAnalysis}
                variant="outline"
                size="small"
                loading={aiAnalyzing}
                disabled={!aiAvailable || formData.images.length === 0}
                style={styles.aiButton}
              />
            </View>

            <Input
              label="生产日期"
              value={formData.productionDate}
              onChangeText={(value) => updateFormData('productionDate', value)}
              placeholder="YYYY-MM-DD"
            />

            <View style={styles.row}>
              <View style={styles.flex}>
                <Input
                  label="保质期"
                  value={formData.shelfLifeValue}
                  onChangeText={(value) => updateFormData('shelfLifeValue', value)}
                  placeholder="请输入保质期"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.unitContainer}>
                <Picker
                  label="单位"
                  value={formData.shelfLifeUnit}
                  options={[
                    { label: '天', value: 'day' },
                    { label: '月', value: 'month' },
                    { label: '年', value: 'year' },
                  ]}
                  onValueChange={(value) => updateFormData('shelfLifeUnit', value as 'day' | 'month' | 'year')}
                />
              </View>
            </View>

            <Input
              label="配料表"
              value={formData.ingredientsText}
              onChangeText={(value) => updateFormData('ingredientsText', value)}
              placeholder="请输入或AI识别配料表"
              multiline
              numberOfLines={3}
            />

            <Input
              label="卡路里 (千卡)"
              value={formData.caloriesKcal}
              onChangeText={(value) => updateFormData('caloriesKcal', value)}
              placeholder="每100g热量"
              keyboardType="numeric"
            />

            <Input
              label="运动消耗建议"
              value={formData.energyOffsetInfo}
              onChangeText={(value) => updateFormData('energyOffsetInfo', value)}
              placeholder="AI分析的运动建议"
              multiline
              numberOfLines={2}
            />

            {formData.harmfulIngredients.length > 0 && (
              <View style={styles.harmfulIngredientsContainer}>
                <Text style={[styles.harmfulTitle, { color: theme.colors.error }]}>
                  检测到的需要注意的成分：
                </Text>
                {formData.harmfulIngredients.map((ingredient, index) => (
                  <Text key={index} style={[styles.harmfulItem, { color: theme.colors.error }]}>
                    • {ingredient}
                  </Text>
                ))}
              </View>
            )}
          </Card>
        </ScrollView>

        {/* 底部按钮 */}
        <View style={[styles.footer, { backgroundColor: theme.colors.background }]}>
          <Button
            title="取消"
            onPress={() => router.back()}
            variant="outline"
            style={styles.footerButton}
          />
          <Button
            title="添加食物"
            onPress={handleSubmit}
            loading={loading}
            style={styles.footerButton}
          />
        </View>
      </SafeAreaView>

      {/* 日期输入模态框 */}
      <InputModal
        visible={dateModalVisible}
        title="选择到期日期"
        message="请输入到期日期 (格式: YYYY-MM-DD)"
        placeholder="例如: 2025-12-31"
        defaultValue={formData.expiryDate || new Date().toISOString().split('T')[0]}
        onConfirm={handleDateConfirm}
        onCancel={() => setDateModalVisible(false)}
      />

      {/* 新增分类模态框 */}
      <InputModal
        visible={categoryModalVisible}
        title="新增分类"
        message="请输入分类名称"
        placeholder="例如: 蔬菜、水果"
        onConfirm={handleCategoryConfirm}
        onCancel={() => setCategoryModalVisible(false)}
      />

      {/* 新增位置模态框 */}
      <InputModal
        visible={locationModalVisible}
        title="新增存放位置"
        message="请输入存放位置名称"
        placeholder="例如: 冰箱、冷冻室"
        onConfirm={handleLocationConfirm}
        onCancel={() => setLocationModalVisible(false)}
      />
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  aiButton: {
    paddingHorizontal: 16,
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
  dateButton: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
  },
  dateButtonContent: {
    gap: 8,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  harmfulIngredientsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
  },
  harmfulTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  harmfulItem: {
    fontSize: 12,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  footerButton: {
    flex: 1,
  },
});