import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Providers } from '@/contexts';

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
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
          <Stack.Screen 
              name="food/[id]" 
              options={{ 
                // 方案A: 隐藏这个由根Stack生成的Header，让你在 food/[id].js 内部自定义的Header显示
                headerShown: false,

                // 方案B: 使用这个根Stack生成的Header，并在这里统一配置样式
                // title: '食物详情', 
                // presentation: 'modal', // 还可以设置弹出方式等
              }} 
            />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </Providers>
  );
}
