import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Layout } from "@/components/ui/Layout";
import { Card } from "@/components/ui/Card";

const languages = [
  { code: "zh-CN", name: "Chinese", nativeName: "简体中文", flag: "🇨🇳" },
  { code: "en-US", name: "English", nativeName: "English", flag: "🇺🇸" }
];

export default function LanguageSettingsScreen() {
  const { theme } = useTheme();
  const [currentLanguage, setCurrentLanguage] = useState("zh-CN");

  const handleLanguageChange = (languageCode) => {
    if (languageCode === currentLanguage) return;
    
    const language = languages.find(lang => lang.code === languageCode);
    
    Alert.alert(
      "切换语言",
      `确定要切换到${language?.nativeName}吗？`,
      [
        { text: "取消", style: "cancel" },
        {
          text: "确定",
          onPress: () => {
            setCurrentLanguage(languageCode);
            Alert.alert("成功", "语言切换成功，部分功能可能需要重启应用才能完全生效");
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
            语言设置
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <Card style={styles.currentLanguageCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              当前语言
            </Text>
            <View style={[styles.currentLanguage, { backgroundColor: theme.colors.surface }]}>
              <Text style={styles.flag}>
                {languages.find(lang => lang.code === currentLanguage)?.flag}
              </Text>
              <Text style={[styles.currentLanguageText, { color: theme.colors.text }]}>
                {languages.find(lang => lang.code === currentLanguage)?.nativeName}
              </Text>
            </View>
          </Card>

          <Card style={styles.languageOptionsCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              选择语言
            </Text>
            
            {languages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageOption,
                  { backgroundColor: theme.colors.surface },
                  currentLanguage === language.code && styles.selectedLanguage
                ]}
                onPress={() => handleLanguageChange(language.code)}
              >
                <View style={styles.languageOptionLeft}>
                  <Text style={styles.flag}>{language.flag}</Text>
                  <View style={styles.languageOptionText}>
                    <Text style={[styles.languageOptionTitle, { color: theme.colors.text }]}>
                      {language.nativeName}
                    </Text>
                    <Text style={[styles.languageOptionSubtitle, { color: theme.colors.textSecondary }]}>
                      {language.name}
                    </Text>
                  </View>
                </View>
                {currentLanguage === language.code && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </Card>

          <Card style={styles.infoCard}>
            <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
              语言说明
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              • 支持简体中文和英文
• 语言切换会立即生效
• 部分功能可能需要重启应用
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
  currentLanguageCard: { marginBottom: 16, padding: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  currentLanguage: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  currentLanguageText: {
    fontSize: 16,
    fontWeight: "500",
  },
  languageOptionsCard: { marginBottom: 16, padding: 16 },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedLanguage: {
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  languageOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  languageOptionText: { flex: 1 },
  languageOptionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  languageOptionSubtitle: { fontSize: 14 },
  flag: { fontSize: 24 },
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
