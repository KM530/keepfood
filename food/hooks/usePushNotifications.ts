import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
// import * as Notifications from 'expo-notifications';
// import * as Device from 'expo-device';
// import Constants from 'expo-constants';
import { apiClient } from '@/lib/api';

// 检查是否在支持推送通知的环境中
const isNotificationSupported = () => {
  // 暂时禁用推送通知功能，避免Expo Go中的错误
  return false;
};

// 配置通知处理（仅在支持的环境中）
// try {
//   if (isNotificationSupported()) {
//     Notifications.setNotificationHandler({
//       handleNotification: async () => ({
//         shouldShowAlert: true,
//         shouldPlaySound: true,
//         shouldSetBadge: true,
//       }),
//     });
//   }
// } catch (error) {
//   console.warn('Notification handler setup failed:', error);
// }

interface PushNotificationHook {
  expoPushToken: string | null;
  notification: any | null;
  isPermissionGranted: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  registerForPushNotifications: () => Promise<void>;
  unregisterPushNotifications: () => Promise<void>;
}

export function usePushNotifications(): PushNotificationHook {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 检查并请求通知权限
  const requestPermission = useCallback(async (): Promise<boolean> => {
    Alert.alert('功能限制', '推送通知功能暂时不可用，请使用开发构建版本。');
    return false;
  }, []);

  // 获取推送令牌
  const getExpoPushToken = useCallback(async (): Promise<string | null> => {
    return null;
  }, []);

  // 注册推送通知
  const registerForPushNotifications = useCallback(async () => {
    Alert.alert('功能限制', '推送通知功能暂时不可用，请使用开发构建版本。');
  }, []);

  // 注销推送通知
  const unregisterPushNotifications = useCallback(async () => {
    Alert.alert('功能限制', '推送通知功能暂时不可用，请使用开发构建版本。');
  }, []);

  // 初始化时检查权限状态
  useEffect(() => {
    // 暂时禁用推送通知功能
  }, []);

  // 监听通知（仅在支持的环境中）
  useEffect(() => {
    // 暂时禁用推送通知功能
  }, []);

  return {
    expoPushToken,
    notification,
    isPermissionGranted,
    isLoading,
    requestPermission,
    registerForPushNotifications,
    unregisterPushNotifications,
  };
}