import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Layout } from '@/components/ui/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { apiClient } from '@/lib/api';

interface NotificationSettings {
  expiry_notifications: boolean;
  expiry_advance_days: number;
  daily_summary: boolean;
  daily_summary_time: string;
  shopping_reminders: boolean;
  recipe_suggestions: boolean;
  quiet_hours: {
    enabled: boolean;
    start_time: string;
    end_time: string;
  };
}

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const {
    expoPushToken,
    isPermissionGranted,
    isLoading: pushLoading,
    registerForPushNotifications,
    unregisterPushNotifications,
  } = usePushNotifications();

  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 获取通知设置
  useEffect(() => {
    fetchNotificationSettings();
  }, []);

  const fetchNotificationSettings = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/push/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
      Alert.alert('获取失败', '无法获取通知设置');
    } finally {
      setLoading(false);
    }
  };

  // 更新设置
  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!settings) return;

    setSaving(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await apiClient.put('/push/settings', updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      Alert.alert('保存失败', '无法保存通知设置');
    } finally {
      setSaving(false);
    }
  };

  // 发送测试通知
  const sendTestNotification = async () => {
    try {
      await apiClient.post('/push/test', {
        message: '这是一条来自智能食物保鲜管家的测试通知'
      });
      Alert.alert('发送成功', '测试通知已发送');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      Alert.alert('发送失败', '测试通知发送失败');
    }
  };

  // 手动检查过期食物
  const checkExpiringFoods = async () => {
    try {
      const response = await apiClient.post('/push/expiry-check');
      const result = response.data;
      
      if (result.expiring_count === 0) {
        Alert.alert('检查完成', '目前没有即将过期的食物');
      } else {
        Alert.alert(
          '检查完成',
          `发现 ${result.expiring_count} 种即将过期的食物${result.notification_sent ? '，已发送通知' : ''}`
        );
      }
    } catch (error) {
      console.error('Failed to check expiring foods:', error);
      Alert.alert('检查失败', '无法检查过期食物');
    }
  };

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  if (!settings) {
    return (
      <Layout>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            无法加载通知设置
          </Text>
          <Button title="重试" onPress={fetchNotificationSettings} />
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 推送状态 */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              推送通知状态
            </Text>
            
            <View style={styles.statusRow}>
              <View style={styles.statusInfo}>
                <Ionicons 
                  name={isPermissionGranted ? "checkmark-circle" : "close-circle"} 
                  size={24} 
                  color={isPermissionGranted ? theme.colors.success : theme.colors.error} 
                />
                <Text style={[styles.statusText, { color: theme.colors.text }]}>
                  {isPermissionGranted ? '推送通知已启用' : '推送通知未启用'}
                </Text>
              </View>
              
              {isPermissionGranted ? (
                <Button
                  title="关闭通知"
                  onPress={unregisterPushNotifications}
                  loading={pushLoading}
                  variant="outline"
                  style={styles.actionButton}
                />
              ) : (
                <Button
                  title="启用通知"
                  onPress={registerForPushNotifications}
                  loading={pushLoading}
                  style={styles.actionButton}
                />
              )}
            </View>

            {expoPushToken && (
              <Text style={[styles.tokenText, { color: theme.colors.textSecondary }]}>
                设备令牌: {expoPushToken.slice(0, 20)}...
              </Text>
            )}
          </Card>

          {/* 通知设置 */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              通知设置
            </Text>

            {/* 过期提醒 */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  过期提醒
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  食物即将过期时发送通知
                </Text>
              </View>
              <Switch
                value={settings.expiry_notifications}
                onValueChange={(value) => updateSettings({ expiry_notifications: value })}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                thumbColor={settings.expiry_notifications ? theme.colors.primary : theme.colors.textSecondary}
                disabled={saving}
              />
            </View>

            {/* 每日摘要 */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  每日摘要
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  每天发送食物库存摘要
                </Text>
              </View>
              <Switch
                value={settings.daily_summary}
                onValueChange={(value) => updateSettings({ daily_summary: value })}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                thumbColor={settings.daily_summary ? theme.colors.primary : theme.colors.textSecondary}
                disabled={saving}
              />
            </View>

            {/* 购物提醒 */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  购物提醒
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  购物清单有新项目时提醒
                </Text>
              </View>
              <Switch
                value={settings.shopping_reminders}
                onValueChange={(value) => updateSettings({ shopping_reminders: value })}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                thumbColor={settings.shopping_reminders ? theme.colors.primary : theme.colors.textSecondary}
                disabled={saving}
              />
            </View>

            {/* 菜谱推荐 */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  菜谱推荐
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  基于库存食物推荐菜谱
                </Text>
              </View>
              <Switch
                value={settings.recipe_suggestions}
                onValueChange={(value) => updateSettings({ recipe_suggestions: value })}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                thumbColor={settings.recipe_suggestions ? theme.colors.primary : theme.colors.textSecondary}
                disabled={saving}
              />
            </View>

            {/* 免打扰时间 */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  免打扰时间
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  {settings.quiet_hours.start_time} - {settings.quiet_hours.end_time}
                </Text>
              </View>
              <Switch
                value={settings.quiet_hours.enabled}
                onValueChange={(value) => updateSettings({ 
                  quiet_hours: { ...settings.quiet_hours, enabled: value }
                })}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                thumbColor={settings.quiet_hours.enabled ? theme.colors.primary : theme.colors.textSecondary}
                disabled={saving}
              />
            </View>
          </Card>

          {/* 测试功能 */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              测试功能
            </Text>
            
            <View style={styles.testButtons}>
              <Button
                title="发送测试通知"
                onPress={sendTestNotification}
                variant="outline"
                style={styles.testButton}
                disabled={!isPermissionGranted}
              />
              
              <Button
                title="检查过期食物"
                onPress={checkExpiringFoods}
                variant="outline"
                style={styles.testButton}
                disabled={!isPermissionGranted}
              />
            </View>

            {!isPermissionGranted && (
              <Text style={[styles.disabledNote, { color: theme.colors.textSecondary }]}>
                请先启用推送通知才能使用测试功能
              </Text>
            )}
          </Card>

          {/* 说明信息 */}
          <Card style={[styles.section, { backgroundColor: theme.colors.background + '80' }]}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
              <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
                关于推送通知
              </Text>
            </View>
            
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              • 过期提醒会在食物即将过期前1天发送{'\n'}
              • 每日摘要会在每天晚上8点发送{'\n'}
              • 免打扰时间内不会发送通知{'\n'}
              • 您可以随时在此页面调整通知设置
            </Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 16,
  },
  actionButton: {
    minWidth: 100,
  },
  tokenText: {
    fontSize: 12,
    marginTop: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  testButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  testButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  disabledNote: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
});