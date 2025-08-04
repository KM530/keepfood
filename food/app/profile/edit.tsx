import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/ui/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImagePicker } from '@/components/ui/ImagePicker';

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const { user, updateUser, changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nickname: user?.nickname || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: '',
  });
  const [avatar, setAvatar] = useState<string | null>(user?.avatarUrl || null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    return () => {
      setIsMounted(false);
    };
  }, []);

  // 处理表单字段变化
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 处理密码字段变化
  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  // 处理头像选择
  const handleAvatarChange = (uri: string) => {
    setAvatar(uri);
  };

  // 处理保存
  const handleSave = async () => {
    if (!formData.nickname.trim()) {
      Alert.alert('提示', '请输入昵称');
      return;
    }

    if (formData.email && !isValidEmail(formData.email)) {
      Alert.alert('提示', '请输入有效的邮箱地址');
      return;
    }

    // 验证密码修改
    if (showPasswordSection) {
      if (!passwordData.current_password) {
        Alert.alert('提示', '请输入当前密码');
        return;
      }
      if (!passwordData.new_password) {
        Alert.alert('提示', '请输入新密码');
        return;
      }
      if (passwordData.new_password.length < 6) {
        Alert.alert('提示', '新密码长度至少6位');
        return;
      }
      if (passwordData.new_password !== passwordData.confirm_new_password) {
        Alert.alert('提示', '两次输入的新密码不一致');
        return;
      }
    }

    setLoading(true);
    try {
      // 创建FormData
      const updateData = new FormData();
      updateData.append('nickname', formData.nickname);
      updateData.append('email', formData.email);
      updateData.append('phone', formData.phone);

      // 如果有新头像，添加到FormData
      if (avatar && avatar !== user?.avatarUrl) {
        updateData.append('avatar', {
          uri: avatar,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);
      }

      // 更新个人信息
      await updateUser(updateData);

      // 如果需要修改密码
      if (showPasswordSection) {
        await changePassword(passwordData);
      }

      Alert.alert('成功', '个人资料更新成功', [
        { 
          text: '确定', 
          onPress: () => {
            // 使用setTimeout确保Alert完全关闭后再导航
            setTimeout(() => {
              if (isMounted) {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)/profile');
                }
              }
            }, 100);
          }
        }
      ]);
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('错误', '更新个人资料失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 邮箱验证
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <Layout>
      <SafeAreaView style={styles.container}>
        {/* 头部 */}
        <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
          <Button
            title=""
            onPress={() => router.back()}
            variant="ghost"
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Button>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            编辑资料
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 头像设置 */}
          <Card style={styles.avatarCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              头像
            </Text>
            <View style={styles.avatarRow}>
              <View style={styles.avatarContainer}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                    <Ionicons name="person" size={40} color="#fff" />
                  </View>
                )}
              </View>
              <ImagePicker
                onImageSelected={handleAvatarChange}
                style={styles.avatarPicker}
              >
                <View style={[styles.avatarPickerButton, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name="camera" size={20} color="#fff" />
                </View>
              </ImagePicker>
            </View>
          </Card>

          {/* 基本信息 */}
          <Card style={styles.formCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              基本信息
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                昵称 *
              </Text>
              <Input
                value={formData.nickname}
                onChangeText={(value) => handleFieldChange('nickname', value)}
                placeholder="请输入昵称"
                maxLength={20}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                邮箱
              </Text>
              <Input
                value={formData.email}
                onChangeText={(value) => handleFieldChange('email', value)}
                placeholder="请输入邮箱地址"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                手机号
              </Text>
              <Input
                value={formData.phone}
                onChangeText={(value) => handleFieldChange('phone', value)}
                placeholder="请输入手机号"
                keyboardType="phone-pad"
              />
            </View>
          </Card>

          {/* 密码修改 */}
          <Card style={styles.formCard}>
            <View style={styles.passwordHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                修改密码
              </Text>
              <Button
                title={showPasswordSection ? '取消' : '修改'}
                onPress={() => {
                  setShowPasswordSection(!showPasswordSection);
                  if (showPasswordSection) {
                    setPasswordData({
                      current_password: '',
                      new_password: '',
                      confirm_new_password: '',
                    });
                  }
                }}
                variant="ghost"
                style={styles.toggleButton}
              />
            </View>
            
            {showPasswordSection && (
              <>
                <Text style={[styles.passwordHint, { color: theme.colors.textSecondary }]}>
                  为了账户安全，修改密码需要验证当前密码
                </Text>
                
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    当前密码 *
                  </Text>
                  <Input
                    value={passwordData.current_password}
                    onChangeText={(value) => handlePasswordChange('current_password', value)}
                    placeholder="请输入当前密码"
                    secureTextEntry
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    新密码 *
                  </Text>
                  <Input
                    value={passwordData.new_password}
                    onChangeText={(value) => handlePasswordChange('new_password', value)}
                    placeholder="请输入新密码（至少6位）"
                    secureTextEntry
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    确认新密码 *
                  </Text>
                  <Input
                    value={passwordData.confirm_new_password}
                    onChangeText={(value) => handlePasswordChange('confirm_new_password', value)}
                    placeholder="请再次输入新密码"
                    secureTextEntry
                  />
                </View>
              </>
            )}
          </Card>

          {/* 账户信息 */}
          <Card style={styles.infoCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              账户信息
            </Text>
            
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                用户名
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {user?.username}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                注册时间
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '未知'}
              </Text>
            </View>
          </Card>

          {/* 保存按钮 */}
          <View style={styles.buttonContainer}>
            <Button
              title="保存修改"
              onPress={handleSave}
              loading={loading}
              style={styles.saveButton}
            />
          </View>
          
          {/* 底部间距 */}
          <View style={styles.bottomSpacing} />
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
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  avatarCard: {
    marginBottom: 16,
    padding: 16,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarContainer: {
    // position: 'relative', // 移除相对定位
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPicker: {
    // position: 'absolute', // 移除绝对定位
    // bottom: 0,
    // right: 0,
  },
  avatarPickerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  passwordHint: {
    fontSize: 12,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  formCard: {
    marginBottom: 16,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },

  infoCard: {
    marginBottom: 16,
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  saveButton: {
    paddingVertical: 3,
  },
  bottomSpacing: {
    height: 50, // 增加底部间距，确保按钮不被遮挡
  },
});