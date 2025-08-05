import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Layout } from "@/components/ui/Layout";
import { Card } from "@/components/ui/Card";

const helpSections = [
  {
    title: "食物管理",
    icon: "restaurant-outline",
    items: [
      {
        title: "添加食物",
        description: "点击首页的"+"按钮，拍照或选择图片，填写食物信息即可添加。"
      },
      {
        title: "编辑食物",
        description: "在食物详情页面点击编辑按钮，可以修改食物信息。"
      },
      {
        title: "删除食物",
        description: "在食物详情页面点击删除按钮，确认后即可删除。"
      },
      {
        title: "消耗食物",
        description: "在食物详情页面点击"+"消耗"+"按钮，记录食物使用情况。"
      }
    ]
  },
  {
    title: "分类管理",
    icon: "list-outline",
    items: [
      {
        title: "创建分类",
        description: "在分类管理页面点击"+"按钮，输入分类名称即可创建。"
      },
      {
        title: "编辑分类",
        description: "点击分类右侧的编辑图标，可以修改分类名称。"
      },
      {
        title: "删除分类",
        description: "点击分类右侧的删除图标，确认后即可删除（需先清空分类下的食物）。"
      }
    ]
  },
  {
    title: "位置管理",
    icon: "location-outline",
    items: [
      {
        title: "创建位置",
        description: "在位置管理页面点击"+"按钮，输入位置名称即可创建。"
      },
      {
        title: "编辑位置",
        description: "点击位置右侧的编辑图标，可以修改位置名称。"
      },
      {
        title: "删除位置",
        description: "点击位置右侧的删除图标，确认后即可删除（需先清空位置下的食物）。"
      }
    ]
  },
  {
    title: "智能功能",
    icon: "scan-outline",
    items: [
      {
        title: "OCR识别",
        description: "拍照食物包装，自动识别配料表和营养成分信息。"
      },
      {
        title: "营养分析",
        description: "基于识别结果，自动计算卡路里和营养成分。"
      },
      {
        title: "过期提醒",
        description: "系统会自动提醒即将过期的食物，避免浪费。"
      }
    ]
  },
  {
    title: "购物清单",
    icon: "cart-outline",
    items: [
      {
        title: "添加商品",
        description: "在购物清单页面点击"+"按钮，输入商品名称即可添加。"
      },
      {
        title: "标记完成",
        description: "点击商品左侧的圆圈，可以标记为已购买。"
      },
      {
        title: "清空已完成",
        description: "点击"+"清空已完成"+"按钮，可以批量删除已购买的商品。"
      }
    ]
  },
  {
    title: "菜谱推荐",
    icon: "book-outline",
    items: [
      {
        title: "智能推荐",
        description: "基于您现有的食物，推荐适合的菜谱。"
      },
      {
        title: "查看菜谱",
        description: "点击菜谱卡片，查看详细的制作步骤和所需材料。"
      }
    ]
  }
];

export default function HelpScreen() {
  const { theme } = useTheme();

  const renderHelpSection = (section, index) => (
    <Card key={section.title} style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Ionicons name={section.icon} size={24} color={theme.colors.primary} />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {section.title}
        </Text>
      </View>
      
      {section.items.map((item, itemIndex) => (
        <View key={itemIndex} style={styles.helpItem}>
          <Text style={[styles.helpItemTitle, { color: theme.colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.helpItemDescription, { color: theme.colors.textSecondary }]}>
            {item.description}
          </Text>
        </View>
      ))}
    </Card>
  );

  return (
    <Layout>
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            使用帮助
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.welcomeCard}>
            <View style={styles.welcomeHeader}>
              <Ionicons name="help-circle" size={32} color={theme.colors.primary} />
              <Text style={[styles.welcomeTitle, { color: theme.colors.text }]}>
                欢迎使用智能食物保鲜管家
              </Text>
            </View>
            <Text style={[styles.welcomeDescription, { color: theme.colors.textSecondary }]}>
              本应用帮助您管理食物库存，避免浪费，享受健康生活。以下是主要功能的使用指南：
            </Text>
          </Card>

          {helpSections.map(renderHelpSection)}

          <Card style={styles.supportCard}>
            <Text style={[styles.supportTitle, { color: theme.colors.text }]}>
              需要更多帮助？
            </Text>
            <Text style={[styles.supportDescription, { color: theme.colors.textSecondary }]}>
              如果您在使用过程中遇到问题，可以通过以下方式联系我们：
            </Text>
            <View style={styles.supportOptions}>
              <TouchableOpacity style={styles.supportOption}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.supportOptionText, { color: theme.colors.primary }]}>
                  发送邮件
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.supportOption}>
                <Ionicons name="chatbubble-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.supportOptionText, { color: theme.colors.primary }]}>
                  在线客服
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  placeholder: { width: 32 },
  content: { flex: 1, padding: 16 },
  welcomeCard: { marginBottom: 16, padding: 16 },
  welcomeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  welcomeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionCard: { marginBottom: 16, padding: 16 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  helpItem: { marginBottom: 16 },
  helpItemTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  helpItemDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  supportCard: { marginBottom: 32, padding: 16 },
  supportTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  supportDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  supportOptions: {
    flexDirection: "row",
    gap: 16,
  },
  supportOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  supportOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
