// 注册页面

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts';
import { COLORS, SIZES, VALIDATION, LAYOUT } from '@/utils/constants';
import type { RegisterRequest, FormField } from '@/types';

interface RegisterForm {
  email: FormField;
  nickname: FormField;
  password: FormField;
  confirmPassword: FormField;
}

export default function RegisterScreen() {
  const { register, loading, error, clearError } = useAuth();
  
  const [form, setForm] = useState<RegisterForm>({
    email: { value: '', error: '', touched: false },
    nickname: { value: '', error: '', touched: false },
    password: { value: '', error: '', touched: false },
    confirmPassword: { value: '', error: '', touched: false },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 更新表单字段
  const updateField = (field: keyof RegisterForm, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        value,
        error: '',
        touched: true,
      },
    }));
    
    // 清除全局错误
    if (error) {
      clearError();
    }
  };

  // 验证表单字段
  const validateField = (field: keyof RegisterForm): string => {
    const value = form[field].value.trim();
    
    switch (field) {
      case 'email':
        if (!value) {
          return VALIDATION.messages.required;
        }
        if (!VALIDATION.patterns.email.test(value)) {
          return VALIDATION.messages.email;
        }
        if (value.length > VALIDATION.fieldLength.email.max) {
          return VALIDATION.messages.maxLength(VALIDATION.fieldLength.email.max);
        }
        return '';
        
      case 'nickname':
        if (!value) {
          return VALIDATION.messages.required;
        }
        if (value.length < VALIDATION.fieldLength.nickname.min) {
          return VALIDATION.messages.minLength(VALIDATION.fieldLength.nickname.min);
        }
        if (value.length > VALIDATION.fieldLength.nickname.max) {
          return VALIDATION.messages.maxLength(VALIDATION.fieldLength.nickname.max);
        }
        return '';
        
      case 'password':
        if (!value) {
          return VALIDATION.messages.required;
        }
        if (value.length < VALIDATION.fieldLength.password.min) {
          return VALIDATION.messages.minLength(VALIDATION.fieldLength.password.min);
        }
        if (value.length > VALIDATION.fieldLength.password.max) {
          return VALIDATION.messages.maxLength(VALIDATION.fieldLength.password.max);
        }
        // 检查密码强度
        if (!VALIDATION.patterns.password.test(value)) {
          return VALIDATION.messages.password;
        }
        return '';
        
      case 'confirmPassword':
        if (!value) {
          return VALIDATION.messages.required;
        }
        if (value !== form.password.value) {
          return VALIDATION.messages.passwordConfirm;
        }
        return '';
        
      default:
        return '';
    }
  };

  // 验证整个表单
  const validateForm = (): boolean => {
    const newForm = { ...form };
    let isValid = true;

    (Object.keys(form) as Array<keyof RegisterForm>).forEach(field => {
      const error = validateField(field);
      newForm[field] = {
        ...newForm[field],
        error,
        touched: true,
      };
      if (error) {
        isValid = false;
      }
    });

    setForm(newForm);
    return isValid;
  };

  // 处理注册
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const registerData: RegisterRequest = {
        email: form.email.value.trim(),
        nickname: form.nickname.value.trim(),
        password: form.password.value,
        confirm_password: form.confirmPassword.value
      };

      await register(registerData);
      
      // 注册成功，跳转到首页
      router.replace('/(tabs)');
    } catch (err: any) {
      // 错误已经在useAuth中处理，这里可以显示额外的用户友好消息
      Alert.alert('注册失败', err.message || '请检查您的输入信息');
    }
  };

  // 跳转到登录页面
  const goToLogin = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>创建账户</Text>
          <Text style={styles.subtitle}>加入智能食物保鲜管家</Text>
        </View>

        <View style={styles.form}>
          {/* 邮箱输入 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>邮箱地址</Text>
            <TextInput
              style={[
                styles.input,
                form.email.error ? styles.inputError : null,
              ]}
              value={form.email.value}
              onChangeText={(value) => updateField('email', value)}
              placeholder="请输入邮箱地址"
              placeholderTextColor={COLORS.text.hint}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
            />
            {form.email.error && form.email.touched && (
              <Text style={styles.errorText}>{form.email.error}</Text>
            )}
          </View>

          {/* 昵称输入 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>昵称</Text>
            <TextInput
              style={[
                styles.input,
                form.nickname.error ? styles.inputError : null,
              ]}
              value={form.nickname.value}
              onChangeText={(value) => updateField('nickname', value)}
              placeholder="请输入昵称"
              placeholderTextColor={COLORS.text.hint}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              maxLength={VALIDATION.fieldLength.nickname.max}
            />
            {form.nickname.error && form.nickname.touched && (
              <Text style={styles.errorText}>{form.nickname.error}</Text>
            )}
          </View>

          {/* 密码输入 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>密码</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  form.password.error ? styles.inputError : null,
                ]}
                value={form.password.value}
                onChangeText={(value) => updateField('password', value)}
                placeholder="请输入密码（至少6位，包含字母和数字）"
                placeholderTextColor={COLORS.text.hint}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                maxLength={VALIDATION.fieldLength.password.max}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.passwordToggleText}>
                  {showPassword ? '隐藏' : '显示'}
                </Text>
              </TouchableOpacity>
            </View>
            {form.password.error && form.password.touched && (
              <Text style={styles.errorText}>{form.password.error}</Text>
            )}
          </View>

          {/* 确认密码输入 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>确认密码</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  form.confirmPassword.error ? styles.inputError : null,
                ]}
                value={form.confirmPassword.value}
                onChangeText={(value) => updateField('confirmPassword', value)}
                placeholder="请再次输入密码"
                placeholderTextColor={COLORS.text.hint}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                maxLength={VALIDATION.fieldLength.password.max}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text style={styles.passwordToggleText}>
                  {showConfirmPassword ? '隐藏' : '显示'}
                </Text>
              </TouchableOpacity>
            </View>
            {form.confirmPassword.error && form.confirmPassword.touched && (
              <Text style={styles.errorText}>{form.confirmPassword.error}</Text>
            )}
          </View>

          {/* 全局错误消息 */}
          {error && (
            <View style={styles.globalError}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* 注册按钮 */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              loading ? styles.registerButtonDisabled : null,
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.registerButtonText}>注册</Text>
            )}
          </TouchableOpacity>

          {/* 登录链接 */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>已有账户？</Text>
            <TouchableOpacity onPress={goToLogin}>
              <Text style={styles.loginLink}>立即登录</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.light,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SIZES.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.spacing.xxl,
  },
  title: {
    fontSize: SIZES.fontSize.xxxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SIZES.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: SIZES.fontSize.lg,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: SIZES.spacing.lg,
  },
  label: {
    fontSize: SIZES.fontSize.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.sm,
  },
  input: {
    height: LAYOUT.inputHeight.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: SIZES.borderRadius.md,
    paddingHorizontal: SIZES.spacing.md,
    fontSize: SIZES.fontSize.md,
    color: COLORS.text.primary,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 60,
  },
  passwordToggle: {
    position: 'absolute',
    right: SIZES.spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  passwordToggleText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  errorText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.error,
    marginTop: SIZES.spacing.xs,
  },
  globalError: {
    marginBottom: SIZES.spacing.md,
    padding: SIZES.spacing.md,
    backgroundColor: COLORS.error + '10',
    borderRadius: SIZES.borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  registerButton: {
    height: LAYOUT.buttonHeight.lg,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.spacing.md,
  },
  registerButtonDisabled: {
    backgroundColor: COLORS.gray[400],
  },
  registerButtonText: {
    fontSize: SIZES.fontSize.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.spacing.xl,
  },
  loginText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.text.secondary,
  },
  loginLink: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SIZES.spacing.xs,
  },
});