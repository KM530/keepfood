import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { Layout } from '@/components/ui/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { apiClient } from '@/lib/api';

interface OCRResult {
  ingredients: Array<{
    name: string;
    confidence: number;
    position: { x: number; y: number; width: number; height: number };
  }>;
  text_blocks: Array<{
    text: string;
    confidence: number;
    position: { x: number; y: number; width: number; height: number };
  }>;
}

interface HarmfulAnalysis {
  harmful_ingredients: Array<{
    name: string;
    harmful_type: string;
    level: 'high' | 'medium' | 'low';
    description: string;
    alternatives: string[];
    confidence: number;
  }>;
  safety_score: number;
  safety_level: 'excellent' | 'good' | 'fair' | 'poor';
  total_ingredients: number;
  harmful_count: number;
  recommendations: string[];
}

interface NutritionAdvice {
  nutrition_score: number;
  advice: string[];
  dietary_notes: string[];
}

interface AnalysisResult {
  ocr_result: OCRResult;
  harmful_analysis: HarmfulAnalysis;
  nutrition_advice: NutritionAdvice;
  processing_time: number;
  confidence_score: number;
}

export default function OCRScreen() {
  const { theme } = useTheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // 选择图片
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要访问相册权限才能选择图片');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setResult(null); // 清除之前的结果
      }
    } catch (error) {
      Alert.alert('错误', '选择图片失败');
    }
  };

  // 拍照
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要访问相机权限才能拍照');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setResult(null); // 清除之前的结果
      }
    } catch (error) {
      Alert.alert('错误', '拍照失败');
    }
  };

  // 分析配料表
  const analyzeIngredients = async () => {
    if (!selectedImage) {
      Alert.alert('提示', '请先选择要分析的图片');
      return;
    }

    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'ingredients.jpg',
      } as any);

      const response = await apiClient.post('/ocr/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
      Alert.alert('分析完成', '配料表分析已完成，请查看结果');
    } catch (error) {
      console.error('OCR analysis failed:', error);
      Alert.alert('分析失败', error instanceof Error ? error.message : '配料表分析失败，请重试');
    } finally {
      setAnalyzing(false);
    }
  };

  // 获取安全等级颜色
  const getSafetyColor = (level: string) => {
    switch (level) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#8BC34A';
      case 'fair': return '#FF9800';
      case 'poor': return '#F44336';
      default: return theme.colors.textSecondary;
    }
  };

  // 获取风险等级颜色
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#FFC107';
      default: return theme.colors.textSecondary;
    }
  };

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
            配料识别
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 图片选择区域 */}
          <Card style={styles.imageSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              选择配料表图片
            </Text>
            
            {selectedImage ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                <TouchableOpacity
                  style={[styles.removeImageButton, { backgroundColor: theme.colors.error }]}
                  onPress={() => {
                    setSelectedImage(null);
                    setResult(null);
                  }}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.imagePlaceholder, { borderColor: theme.colors.border }]}>
                <Ionicons name="image-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                  选择或拍摄配料表图片
                </Text>
              </View>
            )}

            <View style={styles.imageActions}>
              <Button
                title="选择图片"
                onPress={pickImage}
                variant="outline"
                style={styles.imageActionButton}
              />
              <Button
                title="拍照"
                onPress={takePhoto}
                variant="outline"
                style={styles.imageActionButton}
              />
            </View>

            {selectedImage && (
              <Button
                title="分析配料表"
                onPress={analyzeIngredients}
                loading={analyzing}
                style={styles.analyzeButton}
              />
            )}
          </Card>

          {/* 分析结果 */}
          {result && (
            <>
              {/* 识别结果 */}
              <Card style={styles.resultSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  识别结果
                </Text>
                <View style={styles.confidenceContainer}>
                  <Text style={[styles.confidenceLabel, { color: theme.colors.textSecondary }]}>
                    识别置信度：
                  </Text>
                  <Text style={[styles.confidenceValue, { color: theme.colors.primary }]}>
                    {(result.confidence_score * 100).toFixed(1)}%
                  </Text>
                </View>
                
                <View style={styles.ingredientsList}>
                  {result.ocr_result.ingredients.map((ingredient, index) => (
                    <View key={index} style={[styles.ingredientItem, { borderColor: theme.colors.border }]}>
                      <Text style={[styles.ingredientName, { color: theme.colors.text }]}>
                        {ingredient.name}
                      </Text>
                      <Text style={[styles.ingredientConfidence, { color: theme.colors.textSecondary }]}>
                        {(ingredient.confidence * 100).toFixed(0)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>

              {/* 安全分析 */}
              <Card style={styles.resultSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  安全分析
                </Text>
                
                <View style={styles.safetyScore}>
                  <View style={styles.scoreContainer}>
                    <Text style={[styles.scoreValue, { color: getSafetyColor(result.harmful_analysis.safety_level) }]}>
                      {result.harmful_analysis.safety_score}
                    </Text>
                    <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>
                      安全评分
                    </Text>
                  </View>
                  
                  <View style={styles.scoreStats}>
                    <Text style={[styles.statText, { color: theme.colors.text }]}>
                      总成分：{result.harmful_analysis.total_ingredients}
                    </Text>
                    <Text style={[styles.statText, { color: theme.colors.text }]}>
                      有害成分：{result.harmful_analysis.harmful_count}
                    </Text>
                  </View>
                </View>

                {result.harmful_analysis.harmful_ingredients.length > 0 && (
                  <View style={styles.harmfulList}>
                    <Text style={[styles.subTitle, { color: theme.colors.text }]}>
                      发现的有害成分：
                    </Text>
                    {result.harmful_analysis.harmful_ingredients.map((harmful, index) => (
                      <View key={index} style={[styles.harmfulItem, { borderColor: theme.colors.border }]}>
                        <View style={styles.harmfulHeader}>
                          <Text style={[styles.harmfulName, { color: theme.colors.text }]}>
                            {harmful.name}
                          </Text>
                          <View style={[
                            styles.riskBadge,
                            { backgroundColor: getRiskColor(harmful.level) }
                          ]}>
                            <Text style={styles.riskText}>
                              {harmful.level === 'high' ? '高风险' : 
                               harmful.level === 'medium' ? '中风险' : '低风险'}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.harmfulDescription, { color: theme.colors.textSecondary }]}>
                          {harmful.description}
                        </Text>
                        {harmful.alternatives.length > 0 && (
                          <Text style={[styles.alternatives, { color: theme.colors.primary }]}>
                            建议替代：{harmful.alternatives.join('、')}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.recommendations}>
                  <Text style={[styles.subTitle, { color: theme.colors.text }]}>
                    安全建议：
                  </Text>
                  {result.harmful_analysis.recommendations.map((rec, index) => (
                    <Text key={index} style={[styles.recommendationText, { color: theme.colors.textSecondary }]}>
                      {rec}
                    </Text>
                  ))}
                </View>
              </Card>

              {/* 营养建议 */}
              <Card style={styles.resultSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  营养建议
                </Text>
                
                <View style={styles.nutritionScore}>
                  <Text style={[styles.scoreValue, { color: theme.colors.primary }]}>
                    {result.nutrition_advice.nutrition_score}
                  </Text>
                  <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>
                    营养评分
                  </Text>
                </View>

                <View style={styles.adviceList}>
                  {result.nutrition_advice.advice.map((advice, index) => (
                    <Text key={index} style={[styles.adviceText, { color: theme.colors.text }]}>
                      {advice}
                    </Text>
                  ))}
                </View>

                <View style={styles.dietaryNotes}>
                  <Text style={[styles.subTitle, { color: theme.colors.text }]}>
                    饮食提醒：
                  </Text>
                  {result.nutrition_advice.dietary_notes.map((note, index) => (
                    <Text key={index} style={[styles.noteText, { color: theme.colors.textSecondary }]}>
                      • {note}
                    </Text>
                  ))}
                </View>
              </Card>
            </>
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
  imageSection: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    height: 200,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 16,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  imageActionButton: {
    flex: 1,
  },
  analyzeButton: {
    marginTop: 8,
  },
  resultSection: {
    padding: 16,
    marginBottom: 16,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  confidenceLabel: {
    fontSize: 14,
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  ingredientsList: {
    gap: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  ingredientName: {
    fontSize: 16,
    flex: 1,
  },
  ingredientConfidence: {
    fontSize: 14,
  },
  safetyScore: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreContainer: {
    alignItems: 'center',
    marginRight: 24,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  scoreStats: {
    flex: 1,
  },
  statText: {
    fontSize: 14,
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  harmfulList: {
    marginBottom: 16,
  },
  harmfulItem: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  harmfulHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  harmfulName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  riskText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  harmfulDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  alternatives: {
    fontSize: 14,
  },
  recommendations: {
    gap: 4,
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  nutritionScore: {
    alignItems: 'center',
    marginBottom: 16,
  },
  adviceList: {
    gap: 8,
    marginBottom: 16,
  },
  adviceText: {
    fontSize: 14,
    lineHeight: 20,
  },
  dietaryNotes: {
    gap: 4,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
});