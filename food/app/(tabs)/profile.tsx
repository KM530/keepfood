import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/ui/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useStats } from '@/hooks/useStats';

interface MenuItem {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  rightIcon?: string;
  color?: string;
}

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const { stats, loading: statsLoading } = useStats();

  // 处理退出登录
  const handleLogout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出当前账户吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '退出',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/login');
            } catch (error) {
              Alert.alert('退出失败', '退出登录失败，请重试');
            }
          },
        },
      ]
    );
  };

  // 菜单项配置
  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: '食物管理',
      items: [
        {
          icon: 'list-outline',
          title: '分类管理',
          subtitle: '管理食物分类',
          onPress: () => router.push('/categories'),
        },
        {
          icon: 'location-outline',
          title: '位置管理',
          subtitle: '管理存放位置',
          onPress: () => router.push('/locations'),
        },
        {
          icon: 'scan-outline',
          title: '配料识别',
          subtitle: 'OCR识别配料表',
          onPress: () => router.push('/ocr'),
        },
        {
          icon: 'nutrition-outline',
          title: '营养分析',
          subtitle: '卡路里和营养计算',
          onPress: () => router.push('/nutrition'),
        },
        {
          icon: 'analytics-outline',
          title: '统计报告',
          subtitle: '查看使用统计',
          onPress: () => Alert.alert('提示', '统计报告功能开发中...'),
        },
      ],
    },
    {
      title: '应用设置',
      items: [
        {
          icon: 'notifications-outline',
          title: '通知设置',
          subtitle: '过期提醒和推送设置',
          onPress: () => router.push('/notifications'),
        },
        {
          icon: 'color-palette-outline',
          title: '主题设置',
          subtitle: '深色/浅色模式',
          onPress: () => router.push('/theme-settings'),
        },
        {
          icon: 'language-outline',
          title: '语言设置',
          subtitle: '界面语言',
          onPress: () => router.push('/language-settings'),
        },
      ],
    },
    {
      title: '帮助与反馈',
      items: [
        {
          icon: 'help-circle-outline',
          title: '使用帮助',
          subtitle: '功能介绍和使用指南',
          onPress: () => router.push('/help'),
        },
        {
          icon: 'chatbubble-outline',
          title: '意见反馈',
          subtitle: '提交建议和问题',
          onPress: () => Alert.alert('提示', '意见反馈功能开发中...'),
        },
        {
          icon: 'information-circle-outline',
          title: '关于应用',
          subtitle: '版本信息',
          onPress: () => Alert.alert('关于应用', '智能食物保鲜管家 v1.0.0'),
        },
      ],
    },
  ];

  // 渲染菜单项
  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.title}
      style={[styles.menuItem, { borderBottomColor: theme.colors.border }]}
      onPress={item.onPress}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIcon, { backgroundColor: theme.colors.surface }]}>
          <Ionicons
            name={item.icon as any}
            size={20}
            color={item.color || theme.colors.primary}
          />
        </View>
        <View style={styles.menuText}>
          <Text style={[styles.menuTitle, { color: theme.colors.text }]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={[styles.menuSubtitle, { color: theme.colors.textSecondary }]}>
              {item.subtitle}
            </Text>
          )}
        </View>
      </View>
      <Ionicons
        name={item.rightIcon as any || 'chevron-forward'}
        size={16}
        color={theme.colors.textSecondary}
      />
    </TouchableOpacity>
  );

  return (
    <Layout>
      <SafeAreaView style={styles.container}>
        {/* 头部 */}
        <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            个人中心
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 用户信息卡片 */}
          <Card style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                {user?.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                    <Ionicons name="person" size={32} color="#fff" />
                  </View>
                )}
              </View>
              
              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: theme.colors.text }]}>
                  {user?.nickname || user?.email || '用户'}
                </Text>
                <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
                  {user?.email || '未设置邮箱'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => router.push('/profile/edit')}
              >
                <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </Card>

          {/* 统计信息 */}
          <Card style={styles.statsCard}>
            <Text style={[styles.statsTitle, { color: theme.colors.text }]}>
              使用统计
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {statsLoading ? '...' : stats.totalFoods}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  总食物数
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#FF9800' }]}>
                  {statsLoading ? '...' : stats.expiringFoods}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  即将过期
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                  {statsLoading ? '...' : stats.shoppingItems}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  购物清单
                </Text>
              </View>
            </View>
          </Card>

          {/* 菜单列表 */}
          {menuSections.map((section, index) => (
            <Card key={section.title} style={styles.menuSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {section.title}
              </Text>
              <View style={styles.menuList}>
                {section.items.map(renderMenuItem)}
              </View>
            </Card>
          ))}

          {/* 退出登录按钮 */}
          <View style={styles.logoutContainer}>
            <Button
              title="退出登录"
              onPress={handleLogout}
              variant="outline"
              style={[styles.logoutButton, { borderColor: theme.colors.error }]}
            />
          </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  userCard: {
    marginBottom: 16,
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  editButton: {
    padding: 8,
  },
  statsCard: {
    marginBottom: 16,
    padding: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  menuSection: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  menuList: {
    gap: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
  },
  logoutContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  logoutButton: {
    borderColor: '#F44336',
  },
});