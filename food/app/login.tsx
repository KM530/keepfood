// 登录页面

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
import type { LoginRequest, FormField } from '@/types';

interface LoginForm {
  account: FormField;
  password: FormField;
}

export default function LoginScreen() {
  const { login, loading, error, clearError } = useAuth();
  
  const [form, setForm] = useState<LoginForm>({
    account: { value: '', error: '', touched: false },
    password: { value: '', error: '', touched: false },
  });

  const [showPassword, setShowPassword] = useState(false);

  // 更新表单字段
  const updateField = (field: keyof LoginForm, value: string) => {
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
  const validateField = (field: keyof LoginForm): string => {
    const value = form[field].value.trim();
    
    switch (field) {
      case 'account':
        if (!value) {
          return VALIDATION.messages.required;
        }
        if (value.length < 3) {
          return VALIDATION.messages.minLength(3);
        }
        // 如果包含@符号，验证邮箱格式
        if (value.includes('@') && !VALIDATION.patterns.email.test(value)) {
          return VALIDATION.messages.email;
        }
        // 如果是纯数字，验证手机号格式
        if (/^\d+$/.test(value) && !VALIDATION.patterns.phone.test(value)) {
          return VALIDATION.messages.phone;
        }
        return '';
        
      case 'password':
        if (!value) {
          return VALIDATION.messages.required;
        }
        if (value.length < VALIDATION.fieldLength.password.min) {
          return VALIDATION.messages.minLength(VALIDATION.fieldLength.password.min);
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

    (Object.keys(form) as Array<keyof LoginForm>).forEach(field => {
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

  // 处理登录
  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const loginData: LoginRequest = {
        account: form.account.value.trim(),
        password: form.password.value,
      };

      await login(loginData);
      
      // 登录成功，跳转到首页
      router.replace('/(tabs)');
    } catch (err: any) {
      // 错误已经在useAuth中处理，这里可以显示额外的用户友好消息
      Alert.alert('登录失败', err.message || '请检查您的账号和密码');
    }
  };

  // 跳转到注册页面
  const goToRegister = () => {
    router.push('/register');
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
          <Text style={styles.title}>智能食物保鲜管家</Text>
          <Text style={styles.subtitle}>登录您的账户</Text>
        </View>

        <View style={styles.form}>
          {/* 账号输入 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>邮箱/手机号</Text>
            <TextInput
              style={[
                styles.input,
                form.account.error ? styles.inputError : null,
              ]}
              value={form.account.value}
              onChangeText={(value) => updateField('account', value)}
              placeholder="请输入邮箱或手机号"
              placeholderTextColor={COLORS.text.hint}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
            />
            {form.account.error && form.account.touched && (
              <Text style={styles.errorText}>{form.account.error}</Text>
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
                placeholder="请输入密码"
                placeholderTextColor={COLORS.text.hint}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
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

          {/* 全局错误消息 */}
          {error && (
            <View style={styles.globalError}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* 登录按钮 */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              loading ? styles.loginButtonDisabled : null,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.loginButtonText}>登录</Text>
            )}
          </TouchableOpacity>

          {/* 注册链接 */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>还没有账户？</Text>
            <TouchableOpacity onPress={goToRegister}>
              <Text style={styles.registerLink}>立即注册</Text>
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
  loginButton: {
    height: LAYOUT.buttonHeight.lg,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.spacing.md,
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.gray[400],
  },
  loginButtonText: {
    fontSize: SIZES.fontSize.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.spacing.xl,
  },
  registerText: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.text.secondary,
  },
  registerLink: {
    fontSize: SIZES.fontSize.md,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SIZES.spacing.xs,
  },
});