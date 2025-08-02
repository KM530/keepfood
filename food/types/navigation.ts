// 导航相关类型定义

import type { ComponentType } from 'react';

// ============= 路由参数类型 =============

export type RootStackParamList = {
  // 主要Tab导航
  '(tabs)': undefined;
  
  // 认证相关
  Login: undefined;
  Register: undefined;
  
  // 食物相关
  AddFood: undefined;
  EditFood: { foodId: number };
  FoodDetail: { foodId: number };
  
  // 菜谱相关
  RecipeDetail: { 
    recipeName: string;
    ingredients: string[];
    instructions?: string[];
    videoUrl?: string;
  };
  
  // 设置相关
  CategoryManagement: undefined;
  LocationManagement: undefined;
  NotificationSettings: undefined;
  
  // 其他
  About: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  
  // 404页面
  '+not-found': undefined;
};

export type TabParamList = {
  index: undefined; // 首页
  recipes: undefined; // 菜谱页
  shopping: undefined; // 购物清单
  profile: undefined; // 个人中心
};

// ============= 导航Hook类型 =============

export interface NavigationHook {
  navigate: <T extends keyof RootStackParamList>(
    screen: T,
    params?: RootStackParamList[T]
  ) => void;
  goBack: () => void;
  canGoBack: () => boolean;
  replace: <T extends keyof RootStackParamList>(
    screen: T,
    params?: RootStackParamList[T]
  ) => void;
  reset: (routes: Array<{ name: keyof RootStackParamList; params?: any }>) => void;
}

// ============= Tab配置类型 =============

export interface TabConfig {
  name: keyof TabParamList;
  title: string;
  icon: string;
  activeIcon?: string;
  component: ComponentType<any>;
  options?: {
    headerShown?: boolean;
    tabBarLabel?: string;
    tabBarIcon?: ({ color, size }: { color: string; size: number }) => React.ReactNode;
    tabBarBadge?: string | number;
  };
}

// ============= 路由状态类型 =============

export interface RouteState {
  key: string;
  name: string;
  params?: any;
  path?: string;
}

export interface NavigationState {
  key: string;
  index: number;
  routeNames: string[];
  routes: RouteState[];
  type: string;
  stale?: boolean;
}

// ============= 导航事件类型 =============

export type NavigationEventType = 
  | 'focus'
  | 'blur'
  | 'beforeRemove'
  | 'tabPress'
  | 'tabLongPress';

export interface NavigationEvent {
  type: NavigationEventType;
  target?: string;
  data?: any;
  preventDefault?: () => void;
}

export type NavigationListener = (event: NavigationEvent) => void;

// ============= 屏幕选项类型 =============

export interface ScreenOptions {
  title?: string;
  headerShown?: boolean;
  headerTitle?: string;
  headerBackTitle?: string;
  headerLeft?: ComponentType<any>;
  headerRight?: ComponentType<any>;
  headerStyle?: object;
  headerTitleStyle?: object;
  headerTintColor?: string;
  headerBackgroundColor?: string;
  gestureEnabled?: boolean;
  animation?: 'default' | 'fade' | 'slide' | 'none';
  presentation?: 'card' | 'modal' | 'transparentModal';
}

// ============= 深度链接类型 =============

export interface DeepLinkConfig {
  screens: {
    [K in keyof RootStackParamList]: string | {
      path: string;
      parse?: Record<string, (value: string) => any>;
      stringify?: Record<string, (value: any) => string>;
    };
  };
}

export interface LinkingOptions {
  prefixes: string[];
  config: {
    screens: DeepLinkConfig['screens'];
  };
}

// ============= 导航守卫类型 =============

export interface NavigationGuard {
  canActivate: (route: RouteState) => boolean | Promise<boolean>;
  redirectTo?: keyof RootStackParamList;
  message?: string;
}

export interface AuthGuard extends NavigationGuard {
  requireAuth: boolean;
}

export interface RoleGuard extends NavigationGuard {
  requiredRoles: string[];
}

// ============= 面包屑导航类型 =============

export interface BreadcrumbItem {
  title: string;
  route?: keyof RootStackParamList;
  params?: any;
  isActive?: boolean;
}

export type Breadcrumbs = BreadcrumbItem[];

// ============= 导航动画类型 =============

export interface NavigationAnimation {
  duration: number;
  easing: (value: number) => number;
  useNativeDriver?: boolean;
}

export interface TransitionConfig {
  animation: NavigationAnimation;
  gestureDirection: 'horizontal' | 'vertical';
  gestureEnabled: boolean;
}

// ============= 底部Tab样式类型 =============

export interface TabBarStyle {
  backgroundColor?: string;
  borderTopColor?: string;
  borderTopWidth?: number;
  elevation?: number;
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  height?: number;
  paddingBottom?: number;
  paddingTop?: number;
}

export interface TabBarLabelStyle {
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  marginTop?: number;
  marginBottom?: number;
}

export interface TabBarIconStyle {
  size: number;
  color: string;
}

// ============= 导航上下文类型 =============

export interface NavigationContextValue {
  navigation: NavigationHook;
  route: RouteState;
  params: any;
}

// ============= 路由匹配类型 =============

export interface RouteMatch {
  route: RouteState;
  params: Record<string, any>;
  isExact: boolean;
}

export interface RouteMatcher {
  match: (path: string) => RouteMatch | null;
  generate: (params: Record<string, any>) => string;
}

// ============= 导航历史类型 =============

export interface NavigationHistory {
  entries: RouteState[];
  index: number;
  length: number;
  
  push: (route: RouteState) => void;
  pop: () => RouteState | undefined;
  replace: (route: RouteState) => void;
  go: (delta: number) => void;
  canGo: (delta: number) => boolean;
}

// ============= 导航中间件类型 =============

export interface NavigationMiddleware {
  beforeNavigate?: (from: RouteState, to: RouteState) => boolean | Promise<boolean>;
  afterNavigate?: (from: RouteState, to: RouteState) => void;
  onError?: (error: Error, route: RouteState) => void;
}