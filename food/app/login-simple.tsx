import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function LoginSimpleScreen() {
  console.log('🧪 LoginSimpleScreen rendered');
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>简化登录页面</Text>
      <Text style={styles.subtitle}>如果你能看到这个页面，说明路由系统正常工作</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => {
          console.log('🧪 点击了登录按钮');
          router.replace('/(tabs)');
        }}
      >
        <Text style={styles.buttonText}>模拟登录</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => {
          console.log('🧪 点击了返回按钮');
          router.back();
        }}
      >
        <Text style={styles.buttonText}>返回</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

