import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Layout } from "@/components/ui/Layout";
import { Card } from "@/components/ui/Card";

export default function ThemeSettingsScreen() {
  const { theme, toggleTheme, isDark } = useTheme();

  const handleThemeChange = (newTheme) => {
    if (newTheme === (isDark ? "dark" : "light")) {
      return;
    }
    
    Alert.alert(
      "切换主题",
      `确定要切换到${newTheme === "dark" ? "深色" : "浅色"}模式吗？`,
      [
        { text: "取消", style: "cancel" },
        {
          text: "确定",
          onPress: () => {
            toggleTheme();
            Alert.alert("成功", "主题切换成功");
          },
        },
      ]
    );
  };

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
            主题设置
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <Card style={styles.currentThemeCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              当前主题
            </Text>
            <View style={[styles.currentTheme, { backgroundColor: theme.colors.surface }]}>
              <Ionicons
                name={isDark ? "moon" : "sunny"}
                size={24}
                color={theme.colors.primary}
              />
              <Text style={[styles.currentThemeText, { color: theme.colors.text }]}>
                {isDark ? "深色模式" : "浅色模式"}
              </Text>
            </View>
          </Card>

          <Card style={styles.themeOptionsCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              选择主题
            </Text>
            
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: theme.colors.surface },
                !isDark && styles.selectedTheme
              ]}
              onPress={() => handleThemeChange("light")}
            >
              <View style={styles.themeOptionLeft}>
                <Ionicons
                  name="sunny"
                  size={24}
                  color={!isDark ? theme.colors.primary : theme.colors.textSecondary}
                />
                <View style={styles.themeOptionText}>
                  <Text style={[styles.themeOptionTitle, { color: theme.colors.text }]}>
                    浅色模式
                  </Text>
                  <Text style={[styles.themeOptionDescription, { color: theme.colors.textSecondary }]}>
                    适合白天使用，界面明亮清晰
                  </Text>
                </View>
              </View>
              {!isDark && (
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: theme.colors.surface },
                isDark && styles.selectedTheme
              ]}
              onPress={() => handleThemeChange("dark")}
            >
              <View style={styles.themeOptionLeft}>
                <Ionicons
                  name="moon"
                  size={24}
                  color={isDark ? theme.colors.primary : theme.colors.textSecondary}
                />
                <View style={styles.themeOptionText}>
                  <Text style={[styles.themeOptionTitle, { color: theme.colors.text }]}>
                    深色模式
                  </Text>
                  <Text style={[styles.themeOptionDescription, { color: theme.colors.textSecondary }]}>
                    适合夜间使用，保护眼睛
                  </Text>
                </View>
              </View>
              {isDark && (
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          </Card>

          <Card style={styles.infoCard}>
            <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
              主题说明
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              • 浅色模式：界面明亮，适合白天使用
• 深色模式：界面柔和，适合夜间使用
• 主题切换会立即生效
• 设置会自动保存
            </Text>
          </Card>
        </View>
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
  currentThemeCard: { marginBottom: 16, padding: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  currentTheme: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  currentThemeText: {
    fontSize: 16,
    fontWeight: "500",
  },
  themeOptionsCard: { marginBottom: 16, padding: 16 },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedTheme: {
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  themeOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  themeOptionText: { flex: 1 },
  themeOptionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  themeOptionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoCard: { padding: 16 },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
