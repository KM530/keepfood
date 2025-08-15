import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Providers } from '@/contexts';
import React from 'react';
import { useGlobalErrorHandler } from '@/hooks/useGlobalErrorHandler';
import ErrorOverlay from '@/components/ErrorOverlay';

function GlobalErrorHandlerInit() {
	useGlobalErrorHandler();
	return null;
}

// 启动屏幕组件
function SplashScreen() {
	return (
		<View style={{ 
			flex: 1, 
			justifyContent: 'center', 
			alignItems: 'center',
			backgroundColor: '#ffffff'
		}}>
			<Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
				智能食物保鲜管家
			</Text>
			<ActivityIndicator size="large" color="#007AFF" />
		</View>
	);
}

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const [fontsLoaded, fontError] = useFonts({
		SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
	});

	// 添加调试日志
	console.log('🚀 RootLayout rendered');
	console.log('🚀 Fonts loaded:', fontsLoaded);
	console.log('🚀 Font error:', fontError);

	// 字体加载状态处理
	if (fontError) {
		console.warn('字体加载失败:', fontError);
		// 字体加载失败时继续渲染，使用系统字体
	}

	// 显示启动屏幕直到字体加载完成
	if (!fontsLoaded && !fontError) {
		console.log('🚀 Showing splash screen, fonts not loaded');
		return <SplashScreen />;
	}

	console.log('🚀 Rendering main app');
	return (
		<Providers>
			<ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
				<GlobalErrorHandlerInit />
				<Stack>
					<Stack.Screen name="index" options={{ headerShown: false }} />
					<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
					<Stack.Screen name="login" options={{ 
						headerShown: false,
						presentation: 'modal'
					}} />
					<Stack.Screen name="login-simple" options={{ 
						headerShown: false,
						presentation: 'modal'
					}} />
					<Stack.Screen name="register" options={{ 
						headerShown: false,
						presentation: 'modal'
					}} />
					<Stack.Screen name="test" options={{ headerShown: false }} />
					<Stack.Screen name="+not-found" />
					<Stack.Screen 
						name="food/[id]" 
						options={{ 
							headerShown: false,
						}} 
					/>
				</Stack>
				<ErrorOverlay />
				<StatusBar style="auto" />
			</ThemeProvider>
		</Providers>
	);
}
