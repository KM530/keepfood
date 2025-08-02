import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import * as ImagePickerExpo from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface ImagePickerProps {
  value?: string;
  onImageSelected: (uri: string) => void;
  onImageRemoved: () => void;
  placeholder?: string;
}

export function ImagePicker({
  value,
  onImageSelected,
  onImageRemoved,
  placeholder = '选择食物图片',
}: ImagePickerProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePickerExpo.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限不足', '需要访问相册权限来选择图片');
      return false;
    }
    return true;
  };

  const handleImagePick = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      '选择图片',
      '请选择图片来源',
      [
        { text: '取消', style: 'cancel' },
        { text: '相册', onPress: () => pickFromLibrary() },
        { text: '拍照', onPress: () => pickFromCamera() },
      ]
    );
  };

  const pickFromLibrary = async () => {
    setLoading(true);
    try {
      const result = await ImagePickerExpo.launchImageLibraryAsync({
        mediaTypes: ImagePickerExpo.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('错误', '选择图片失败');
    } finally {
      setLoading(false);
    }
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePickerExpo.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限不足', '需要相机权限来拍照');
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePickerExpo.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('错误', '拍照失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(
      '删除图片',
      '确定要删除这张图片吗？',
      [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: onImageRemoved },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {value ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: value }} style={styles.image} />
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: theme.colors.error }]}
            onPress={handleRemoveImage}
          >
            <Ionicons name="close" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleImagePick}
            disabled={loading}
          >
            <Ionicons name="create" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.placeholder,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }
          ]}
          onPress={handleImagePick}
          disabled={loading}
        >
          <Ionicons
            name={loading ? "hourglass-outline" : "camera-outline"}
            size={32}
            color={theme.colors.textSecondary}
          />
          <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
            {loading ? '处理中...' : placeholder}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
  },
});