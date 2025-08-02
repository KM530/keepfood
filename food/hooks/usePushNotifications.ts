import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { apiClient } from '@/lib/api';

// 检查是否在支持推送通知的环境中
const isNotificationSupported = () => {
  try {
    // 在Expo Go中，某些推送通知功能不可用
    return Device.isDevice && Constants.appOwnership !== 'expo';
  } catch {
    return false;
  }
};

// 配置通知处理（仅在支持的环境中）
try {
  if (isNotificationSupported()) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (error) {
  console.warn('Notification handler setup failed:', error);
}

interface PushNotificationHook {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isPermissionGranted: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  registerForPushNotifications: () => Promise<void>;
  unregisterPushNotifications: () => Promise<void>;
}

export function usePushNotifications(): PushNotificationHook {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 检查并请求通知权限
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      if (!Device.isDevice) {
        Alert.alert('提示', '推送通知只能在真实设备上使用');
        return false;
      }

      if (!isNotificationSupported()) {
        Alert.alert(
          '功能限制',
          '当前环境不支持推送通知功能。要使用推送通知，请使用开发构建版本或生产版本。'
        );
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          '权限被拒绝',
          '无法获取推送通知权限，您将无法收到食物过期提醒。可以在设置中手动开启。'
        );
        setIsPermissionGranted(false);
        return false;
      }

      setIsPermissionGranted(true);
      return true;
    } catch (error) {
      console.error('请求推送权限失败:', error);
      Alert.alert('错误', '请求推送权限时发生错误');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取推送令牌
  const getExpoPushToken = useCallback(async (): Promise<string | null> => {
    try {
      if (!Device.isDevice) {
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) {
        throw new Error('Project ID not found');
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      return token.data;
    } catch (error) {
      console.error('获取推送令牌失败:', error);
      return null;
    }
  }, []);

  // 注册推送通知
  const registerForPushNotifications = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // 先请求权限
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        return;
      }

      // 获取推送令牌
      const token = await getExpoPushToken();
      if (!token) {
        Alert.alert('错误', '无法获取推送令牌');
        return;
      }

      setExpoPushToken(token);

      // 向后端注册令牌
      await apiClient.post('/push/register-token', {
        token,
        device_type: Platform.OS,
        device_id: Device.osInternalBuildId || Device.modelId || 'unknown'
      });

      Alert.alert('成功', '推送通知已启用，您将收到食物过期提醒');
    } catch (error) {
      console.error('注册推送通知失败:', error);
      Alert.alert('错误', '注册推送通知失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }, [requestPermission, getExpoPushToken]);

  // 注销推送通知
  const unregisterPushNotifications = useCallback(async () => {
    setIsLoading(true);
    
    try {
      if (expoPushToken) {
        await apiClient.post('/push/unregister-token', {
          token: expoPushToken
        });
      }

      setExpoPushToken(null);
      setIsPermissionGranted(false);
      
      Alert.alert('成功', '推送通知已关闭');
    } catch (error) {
      console.error('注销推送通知失败:', error);
      Alert.alert('错误', '注销推送通知失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }, [expoPushToken]);

  // 初始化时检查权限状态
  useEffect(() => {
    const checkInitialPermission = async () => {
      if (!Device.isDevice || !isNotificationSupported()) return;

      try {
        const { status } = await Notifications.getPermissionsAsync();
        setIsPermissionGranted(status === 'granted');

        if (status === 'granted') {
          const token = await getExpoPushToken();
          setExpoPushToken(token);
        }
      } catch (error) {
        console.warn('Failed to check initial permission:', error);
      }
    };

    checkInitialPermission();
  }, [getExpoPushToken]);

  // 监听通知（仅在支持的环境中）
  useEffect(() => {
    if (!isNotificationSupported()) {
      return;
    }

    try {
      const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        setNotification(notification);
        console.log('收到通知:', notification);
      });

      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('用户点击通知:', response);
        
        // 处理不同类型的通知
        const notificationData = response.notification.request.content.data;
        
        if (notificationData?.type === 'expiry_reminder') {
          // 导航到食物列表页面
          // 这里可以使用导航服务跳转到相应页面
        } else if (notificationData?.type === 'daily_summary') {
          // 导航到首页
        }
      });

      return () => {
        Notifications.removeNotificationSubscription(notificationListener);
        Notifications.removeNotificationSubscription(responseListener);
      };
    } catch (error) {
      console.warn('Failed to setup notification listeners:', error);
    }
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