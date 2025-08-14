import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const [loaded] = useFonts({
		SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
	});

	if (!loaded) {
		// Async font loading only occurs in development.
		return null;
	}

	return (
		<Providers>
			<ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
				<GlobalErrorHandlerInit />
				<Stack>
					<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
					<Stack.Screen name="login" options={{ headerShown: false }} />
					<Stack.Screen name="register" options={{ headerShown: false }} />
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
