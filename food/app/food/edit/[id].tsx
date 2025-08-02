import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Layout } from '@/components/ui/Layout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ImagePicker } from '@/components/ui/ImagePicker';
import { Picker } from '@/components/ui/Picker';
import { Loading } from '@/components/ui/Loading';
import { useCategories } from '@/hooks/useCategories';
import { useLocations } from '@/hooks/useLocations';
import { apiClient } from '@/lib/api';
import type { Food, UpdateFoodRequest } from '@/types';

interface FormData {
  name: string;
  description: string;
  quantity: string;
  unit: string;
  expiryDate: string;
  categoryId?: number;
  locationId?: number;
  imageUri?: string;
}

interface FormErrors {
  name?: string;
  quantity?: string;
  expiryDate?: string;
}

export default function EditFoodScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { categories } = useCategories();
  const { locations } = useLocations();
  
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    quantity: '',
    unit: '',
    expiryDate: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});

  // 获取食物详情
  useEffect(() => {
    const fetchFood = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const response = await apiClient.getFood(parseInt(id));
        setFood(response);
        
        // 填充表单数据
        setFormData({
          name: response.name,
          description: response.description || '',
          quantity: response.quantity.toString(),
          unit: response.unit || '',
          expiryDate: response.expiryDate.split('T')[0], // 转换为 YYYY-MM-DD 格式
          categoryId: response.category?.id,
          locationId: response.location?.id,
          imageUri: response.imageUrl,
        });
      } catch (error) {
        Alert.alert('错误', '获取食物信息失败');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchFood();
  }, [id]);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 更新表单数据
  const updateFormData = useCallback((field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // 处理图片选择
  const handleImageSelected = useCallback((uri: string) => {
    updateFormData('imageUri', uri);
  }, [updateFormData]);

  const handleImageRemoved = useCallback(() => {
    updateFormData('imageUri', '');
  }, [updateFormData]);

  // 处理日期选择
  const handleDatePress = () => {
    Alert.prompt(
      '选择到期日期',
      '请输入到期日期 (YYYY-MM-DD)',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: (value) => {
            if (value) {
              updateFormData('expiryDate', value);
            }
          },
        },
      ],
      'plain-text',
      formData.expiryDate
    );
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm() || !food) {
      return;
    }

    setSaving(true);

    try {
      const updateData: UpdateFoodRequest = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        quantity: parseFloat(formData.quantity),
        unit: formData.unit.trim(),
        expiryDate: formData.expiryDate,
        categoryId: formData.categoryId,
        locationId: formData.locationId,
      };

      await apiClient.updateFood(food.id, updateData);
      
      Alert.alert(
        '保存成功',
        '食物信息已成功更新',
        [
          {
            text: '确定',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to update food:', error);
      Alert.alert('保存失败', error instanceof Error ? error.message : '更新食物失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = categories.map(cat => ({ label: cat.name, value: cat.id }));
  const locationOptions = locations.map(loc => ({ label: loc.name, value: loc.id }));

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  if (!food) {
    return (
      <Layout>
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              食物不存在或加载失败
            </Text>
            <Button
              title="返回"
              onPress={() => router.back()}
              style={styles.backButton}
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
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 图片编辑 */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              食物图片
            </Text>
            <ImagePicker
              value={formData.imageUri}
              onImageSelected={handleImageSelected}
              onImageRemoved={handleImageRemoved}
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

            <Input
              label="描述"
              value={formData.description}
              onChangeText={(value) => updateFormData('description', value)}
              placeholder="请输入食物描述（可选）"
              multiline
              numberOfLines={3}
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
              placeholder="请选择分类"
            />

            <Picker
              label="存放位置"
              value={formData.locationId}
              options={locationOptions}
              onValueChange={(value) => updateFormData('locationId', value as number)}
              placeholder="请选择存放位置"
            />
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
            title="保存修改"
            onPress={handleSubmit}
            loading={saving}
            style={styles.footerButton}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
});