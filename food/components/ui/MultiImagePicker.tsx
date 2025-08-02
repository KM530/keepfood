import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';

interface MultiImagePickerProps {
  value?: string[];
  onImagesSelected?: (images: string[]) => void;
  maxImages?: number;
  label?: string;
}

export function MultiImagePicker({
  value = [],
  onImagesSelected,
  maxImages = 5,
  label = '食物图片',
}: MultiImagePickerProps) {
  const { theme } = useTheme();
  const [images, setImages] = useState<string[]>(value);

  const handleAddImage = async () => {
    if (images.length >= maxImages) {
      Alert.alert('提示', `最多只能上传${maxImages}张图片`);
      return;
    }

    try {
      // 请求权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要访问相册权限才能选择图片');
        return;
      }

      // 启动图片选择器
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...images, result.assets[0].uri];
        setImages(newImages);
        onImagesSelected?.(newImages);
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      Alert.alert('错误', '选择图片失败，请重试');
    }
  };

  const handleTakePhoto = async () => {
    if (images.length >= maxImages) {
      Alert.alert('提示', `最多只能上传${maxImages}张图片`);
      return;
    }

    try {
      // 请求权限
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要访问相机权限才能拍照');
        return;
      }

      // 启动相机
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...images, result.assets[0].uri];
        setImages(newImages);
        onImagesSelected?.(newImages);
      }
    } catch (error) {
      console.error('拍照失败:', error);
      Alert.alert('错误', '拍照失败，请重试');
    }
  };

  const handleRemoveImage = (index: number) => {
    Alert.alert(
      '确认删除',
      '确定要删除这张图片吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            const newImages = images.filter((_, i) => i !== index);
            setImages(newImages);
            onImagesSelected?.(newImages);
          },
        },
      ]
    );
  };

  const showImageOptions = () => {
    Alert.alert(
      '选择图片',
      '请选择获取图片的方式',
      [
        { text: '取消', style: 'cancel' },
        { text: '从相册选择', onPress: handleAddImage },
        { text: '拍照', onPress: handleTakePhoto },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.text }]}>
        {label}
      </Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.imageContainer}
        contentContainerStyle={styles.imageContentContainer}
      >
        {/* 已选择的图片 */}
        {images.map((uri, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image source={{ uri }} style={styles.image} />
            <TouchableOpacity
              style={[styles.removeButton, { backgroundColor: theme.colors.error }]}
              onPress={() => handleRemoveImage(index)}
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
          </View>
        ))}
        
        {/* 添加图片按钮 */}
        {images.length < maxImages && (
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }
            ]}
            onPress={showImageOptions}
          >
            <Ionicons name="add" size={32} color={theme.colors.textSecondary} />
            <Text style={[styles.addText, { color: theme.colors.textSecondary }]}>
              添加图片
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      
      <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
        已选择 {images.length}/{maxImages} 张图片
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  imageContainer: {
    marginVertical: 8,
  },
  imageContentContainer: {
    paddingHorizontal: 4,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
});