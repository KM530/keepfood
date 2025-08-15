import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Layout } from '@/components/ui/Layout';
import { Loading } from '@/components/ui/Loading';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MultiImagePicker } from '@/components/ui/MultiImagePicker';
import { Picker } from '@/components/ui/Picker';
import { InputModal } from '@/components/ui/InputModal';
import { useCategories } from '@/hooks/useCategories';
import { useLocations } from '@/hooks/useLocations';
import { apiClient } from '@/lib/api';
import { formatDate } from '@/utils/date';
import type { Food, CreateFoodRequest } from '@/types';

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

export default function EditFoodScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);

  const { categories, loading: categoriesLoading } = useCategories();
  const { locations, loading: locationsLoading } = useLocations();

  // 表单数据
  const [formData, setFormData] = useState<FormData>({
    name: '',
    quantity: '',
    unit: '',
    expiryDate: '',
    categoryId: undefined,
    locationId: undefined,
    images: [],
    productionDate: '',
    shelfLifeValue: '',
    shelfLifeUnit: 'day',
    ingredientsText: '',
    harmfulIngredients: [],
    caloriesKcal: '',
    energyOffsetInfo: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showDateModal, setShowDateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // 获取食物详情
  const fetchFoodDetail = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getFood(parseInt(id));
      setFood(response);
      
      // 填充表单数据
      setFormData({
        name: response.name,
        quantity: response.quantity.toString(),
        unit: response.unit,
        expiryDate: response.expiry_date,
        categoryId: response.category_id,
        locationId: response.location_id,
        images: (response.image_url || []).map(url => {
          // 如果是网络URL，需要转换为本地URI格式
          if (url.startsWith('http')) {
            return url; // 暂时保持原样，后续会修复MultiImagePicker
          }
          return url;
        }),
        productionDate: response.production_date || '',
        shelfLifeValue: response.shelf_life_value?.toString() || '',
        shelfLifeUnit: response.shelf_life_unit || 'day',
        ingredientsText: response.ingredients_text || '',
        harmfulIngredients: response.harmful_ingredients_json || [],
        caloriesKcal: response.calories_kcal?.toString() || '',
        energyOffsetInfo: response.energy_offset_info || '',
      });
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

  // 检查AI服务状态
  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        const status = await apiClient.getAIStatus();
        setAiAvailable(status.available);
      } catch (error) {
        console.error('Failed to get AI status:', error);
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

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = '请输入有效数量';
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = '请选择到期日期';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = '请选择分类';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 更新表单数据
  const updateFormData = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除对应字段的错误
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // 日期选择
  const handleDatePress = () => {
    setShowDateModal(true);
  };

  const handleDateConfirm = (value: string) => {
    setShowDateModal(false);
    if (value) {
      updateFormData('expiryDate', value);
    }
  };

  // 分类选择
  const handleAddCategory = () => {
    setShowCategoryModal(true);
  };

  const handleCategoryConfirm = async (value: string) => {
    setShowCategoryModal(false);
    if (value.trim()) {
      try {
        const newCategory = await apiClient.createCategory({ name: value.trim() });
        updateFormData('categoryId', newCategory.id);
      } catch (error) {
        Alert.alert('错误', '创建分类失败');
      }
    }
  };

  // 位置选择
  const handleAddLocation = () => {
    setShowLocationModal(true);
  };

  const handleLocationConfirm = async (value: string) => {
    setShowLocationModal(false);
    if (value.trim()) {
      try {
        const newLocation = await apiClient.createLocation({ name: value.trim() });
        updateFormData('locationId', newLocation.id);
      } catch (error) {
        Alert.alert('错误', '创建位置失败');
      }
    }
  };

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
      console.log('📸 准备处理图片...');
      
      // 创建FormData对象，直接使用图片URI
      const formDataToSend = new FormData();
      
      for (let i = 0; i < formData.images.length; i++) {
        const imageUri = formData.images[i];
        console.log(`处理第${i + 1}张图片:`, imageUri);
        
        // 在React Native中，需要使用特定的格式
        const filename = imageUri.split('/').pop() || `image_${i}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'jpeg';
        
        // React Native FormData 需要这种格式
        const imageFile = {
          uri: imageUri,
          type: `image/${type}`,
          name: filename,
        };
        
        formDataToSend.append('images', imageFile as any);
        
        console.log(`✅ 图片${i + 1}已添加到FormData:`, { 
          uri: imageUri, 
          type: `image/${type}`, 
          name: filename 
        });
      }

      console.log('🌐 发送AI分析请求...');
      
      // 使用analyzeFoodImages方法，传递FormData
      const analysisResult = await apiClient.analyzeFoodImages(formDataToSend);
      console.log('🎉 AI分析响应:', analysisResult);
      
      // 处理AI分析结果
      if (analysisResult) {
        setFormData(prev => ({
          ...prev,
          name: analysisResult.ingredients.join(', ') || prev.name,
          // 移除不存在的属性访问
          // harmfulIngredients: analysisResult.potential_concerns?.items || [],
        }));
        
        // 显示AI分析结果
        Alert.alert(
          'AI分析完成',
          `识别到食材: ${analysisResult.ingredients.join(', ')}\n` +
          `潜在问题: ${analysisResult.potential_concerns?.note || '无'}`,
          [
            { text: '取消', style: 'cancel' },
            { text: '应用结果', onPress: () => {
              setFormData(prev => ({
                ...prev,
                name: analysisResult.ingredients.join(', ') || prev.name,
              }));
            }}
          ]
        );
      }

      console.log('✅ AI分析完成并填充数据');
      Alert.alert('AI分析完成', '已自动填充识别到的信息，请检查并确认');
    } catch (error) {
      console.error('❌ AI分析失败:', error);
      console.error('错误详情:', JSON.stringify(error, null, 2));
      
      let errorMessage = '分析失败，请重试';
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('错误消息:', error.message);
        console.error('错误堆栈:', error.stack);
      }
      
      Alert.alert('AI分析失败', errorMessage);
    } finally {
      setAiAnalyzing(false);
      console.log('🏁 AI分析流程结束');
    }
  };

  // 处理图片选择
  const handleImagesSelected = useCallback((images: string[]) => {
    updateFormData('images', images);
  }, [updateFormData]);

  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSaving(true);

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
      // for (const imageUri of formData.images) {
      //   // 如果是网络URL，跳过上传（保持原有图片）
      //   if (imageUri.startsWith('http')) {
      //     continue;
      //   }
        
      //   // 只上传新选择的本地图片
      //   const filename = imageUri.split('/').pop() || 'image.jpg';
      //   const match = /\.(\w+)$/.exec(filename);
      //   const type = match ? `image/${match[1]}` : 'image/jpeg';
      //   formDataToSend.append('images', {
      //     uri: imageUri,
      //     name: filename,
      //     type,
      //   } as any);
      // }

      await apiClient.updateFood(parseInt(id), formDataToSend as any);
      Alert.alert('更新成功', '食物信息已更新', [
        { text: '确定', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Failed to update food:', error);
      Alert.alert('更新失败', error instanceof Error ? error.message : '更新食物失败，请重试');
    } finally {
      setSaving(false);
    }
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
              编辑食物
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
            <Text style={[styles.errorMessage, { color: theme.colors.textSecondary }]}>
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
            编辑食物
          </Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSubmit}
            disabled={saving}
          >
            <Text style={[styles.saveButtonText, { color: theme.colors.primary }]}>
              {saving ? '保存中...' : '保存'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 食物图片 */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>食物图片</Text>
            <MultiImagePicker 
              value={formData.images} 
              onImagesSelected={handleImagesSelected} 
              maxImages={5}
              readonly={false} // 编辑模式下允许修改图片
            />
          </Card>

          {/* 基本信息 */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>基本信息</Text>
            
            <Input
              label="食物名称"
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              placeholder="请输入食物名称"
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
                  error={errors.quantity}
                />
              </View>
              <View style={styles.unitContainer}>
                <Input
                  label="单位"
                  value={formData.unit}
                  onChangeText={(value) => updateFormData('unit', value)}
                  placeholder="个/包/瓶"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex}>
                <Picker
                  label="分类"
                  value={formData.categoryId}
                  options={categories.map(cat => ({ label: cat.name, value: cat.id }))}
                  onValueChange={(value) => updateFormData('categoryId', value)}
                  onAddNew={handleAddCategory}
                  error={errors.categoryId}
                />
              </View>
              <View style={styles.flex}>
                <Picker
                  label="存放位置"
                  value={formData.locationId}
                  options={locations.map(loc => ({ label: loc.name, value: loc.id }))}
                  onValueChange={(value) => updateFormData('locationId', value)}
                  onAddNew={handleAddLocation}
                />
              </View>
            </View>
          </Card>

          {/* 详细信息 */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>详细信息</Text>
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

            {/* 到期日期 */}
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
                  <Text
                    style={[
                      styles.dateText,
                      { color: formData.expiryDate ? theme.colors.text : theme.colors.textSecondary }
                    ]}
                  >
                    {formData.expiryDate || '请选择到期日期'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
                </View>
              </View>
            </TouchableOpacity>
            {errors.expiryDate && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.expiryDate}
              </Text>
            )}

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

        {/* 模态框 */}
        <InputModal
          visible={showDateModal}
          title="选择到期日期"
          message="请输入到期日期，格式：YYYY-MM-DD"
          placeholder="2025-12-31"
          defaultValue={formData.expiryDate}
          onConfirm={handleDateConfirm}
          onCancel={() => setShowDateModal(false)}
        />

        <InputModal
          visible={showCategoryModal}
          title="添加新分类"
          message="请输入新的分类名称"
          placeholder="例如：蔬菜、水果"
          onConfirm={handleCategoryConfirm}
          onCancel={() => setShowCategoryModal(false)}
        />

        <InputModal
          visible={showLocationModal}
          title="添加新位置"
          message="请输入新的存放位置"
          placeholder="例如：冰箱、橱柜"
          onConfirm={handleLocationConfirm}
          onCancel={() => setShowLocationModal(false)}
        />
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
  saveButton: {
    padding: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  aiButton: {
    marginLeft: 8,
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
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  dateValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  harmfulIngredientsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF3E0',
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
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
  },
});