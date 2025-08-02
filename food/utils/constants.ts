// 应用常量定义

import type { FoodStatus, ShelfLifeUnit, SortBy } from '@/types';

// ============= 颜色常量 =============

export const COLORS = {
  // 主题色
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  primaryDark: '#1B5E20',
  
  // 辅助色
  secondary: '#FF6F00',
  secondaryLight: '#FF9800',
  secondaryDark: '#E65100',
  
  // 状态色
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // 食物状态色
  foodNormal: '#4CAF50',
  foodExpiringSoon: '#FF9800',
  foodExpired: '#F44336',
  
  // 中性色
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // 背景色
  background: {
    light: '#FFFFFF',
    dark: '#121212',
    paper: '#FAFAFA',
  },
  
  // 文本色
  text: {
    primary: '#212121',
    secondary: '#757575',
    disabled: '#BDBDBD',
    hint: '#9E9E9E',
  },
} as const;

// ============= 食物状态相关 =============

export const FOOD_STATUS_CONFIG: Record<FoodStatus, {
  color: string;
  label: string;
  priority: number;
}> = {
  expired: {
    color: COLORS.foodExpired,
    label: '已过期',
    priority: 1,
  },
  expiring_soon: {
    color: COLORS.foodExpiringSoon,
    label: '即将过期',
    priority: 2,
  },
  normal: {
    color: COLORS.foodNormal,
    label: '正常',
    priority: 3,
  },
} as const;

export const SHELF_LIFE_UNITS: Record<ShelfLifeUnit, string> = {
  day: '天',
  month: '月',
  year: '年',
} as const;

export const SORT_OPTIONS: Record<SortBy, string> = {
  expiry_date: '按过期时间',
  created_at: '按添加时间',
  category: '按分类',
} as const;

// ============= 尺寸常量 =============

export const SIZES = {
  // 间距
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // 边框圆角
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999,
  },
  
  // 字体大小
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  // 图标大小
  iconSize: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48,
  },
  
  // 头像大小
  avatarSize: {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  },
} as const;

// ============= 动画常量 =============

export const ANIMATIONS = {
  // 持续时间
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  
  // 缓动函数
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

// ============= 布局常量 =============

export const LAYOUT = {
  // 容器最大宽度
  maxWidth: 1200,
  
  // 头部高度
  headerHeight: 56,
  
  // 底部Tab高度
  tabBarHeight: 60,
  
  // 卡片间距
  cardSpacing: 16,
  
  // 列表项高度
  listItemHeight: 72,
  
  // 按钮高度
  buttonHeight: {
    sm: 32,
    md: 40,
    lg: 48,
  },
  
  // 输入框高度
  inputHeight: {
    sm: 32,
    md: 40,
    lg: 48,
  },
} as const;

// ============= 图片相关常量 =============

export const IMAGE = {
  // 支持的格式
  supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  
  // 最大文件大小 (5MB)
  maxSize: 5 * 1024 * 1024,
  
  // 缩略图尺寸
  thumbnailSize: {
    sm: 100,
    md: 200,
    lg: 400,
  },
  
  // 压缩质量
  quality: {
    low: 0.6,
    medium: 0.8,
    high: 0.9,
  },
} as const;

// ============= 分页常量 =============

export const PAGINATION = {
  // 默认每页数量
  defaultPageSize: 20,
  
  // 每页数量选项
  pageSizeOptions: [10, 20, 50, 100],
  
  // 最大页码显示数量
  maxPageNumbers: 5,
} as const;

// ============= 缓存常量 =============

export const CACHE = {
  // 缓存键前缀
  keyPrefix: 'food_manager_',
  
  // 缓存时间 (秒)
  ttl: {
    short: 5 * 60,      // 5分钟
    medium: 30 * 60,    // 30分钟
    long: 2 * 60 * 60,  // 2小时
    day: 24 * 60 * 60,  // 1天
  },
} as const;

// ============= API相关常量 =============

export const API = {
  // 超时时间
  timeout: 10000,
  
  // 重试次数
  retryAttempts: 3,
  
  // 重试延迟
  retryDelay: 1000,
  
  // 状态码
  statusCodes: {
    success: 200,
    created: 201,
    noContent: 204,
    badRequest: 400,
    unauthorized: 401,
    forbidden: 403,
    notFound: 404,
    unprocessableEntity: 422,
    internalServerError: 500,
  },
} as const;

// ============= 通知相关常量 =============

export const NOTIFICATION = {
  // 默认设置
  defaultSettings: {
    enableExpiryPush: true,
    pushLeadDays: 3,
    pushTime: '09:00',
  },
  
  // 提醒天数选项
  leadDaysOptions: [1, 2, 3, 5, 7],
  
  // 时间选项
  timeOptions: [
    '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00',
  ],
} as const;

// ============= 表单验证常量 =============

export const VALIDATION = {
  // 字段长度限制
  fieldLength: {
    nickname: { min: 2, max: 20 },
    email: { min: 5, max: 100 },
    password: { min: 6, max: 50 },
    foodName: { min: 1, max: 50 },
    categoryName: { min: 1, max: 20 },
    locationName: { min: 1, max: 30 },
    ingredients: { max: 1000 },
  },
  
  // 正则表达式
  patterns: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^1[3-9]\d{9}$/,
    password: /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
  },
  
  // 错误消息
  messages: {
    required: '此字段为必填项',
    email: '请输入有效的邮箱地址',
    phone: '请输入有效的手机号码',
    password: '密码至少6位，包含字母和数字',
    passwordConfirm: '两次输入的密码不一致',
    minLength: (min: number) => `至少输入${min}个字符`,
    maxLength: (max: number) => `最多输入${max}个字符`,
    positive: '请输入大于0的数值',
    integer: '请输入整数',
    dateFormat: '请输入有效的日期格式',
    futureDate: '日期不能早于今天',
  },
} as const;

// ============= 存储键常量 =============

export const STORAGE_KEYS = {
  // 认证相关
  authToken: 'auth_token',
  authUser: 'auth_user',
  
  // 设置相关
  appSettings: 'app_settings',
  notificationSettings: 'notification_settings',
  
  // 缓存相关
  categoriesCache: 'categories_cache',
  locationsCache: 'locations_cache',
  
  // 用户偏好
  sortPreference: 'sort_preference',
  filterPreference: 'filter_preference',
  themePreference: 'theme_preference',
} as const;

// ============= 路由常量 =============

export const ROUTES = {
  // Tab路由
  home: '/',
  recipes: '/recipes',
  shopping: '/shopping',
  profile: '/profile',
  
  // 认证路由
  login: '/login',
  register: '/register',
  
  // 食物相关
  addFood: '/add-food',
  editFood: (id: number) => `/edit-food/${id}`,
  foodDetail: (id: number) => `/food/${id}`,
  
  // 设置相关
  categoryManagement: '/category-management',
  locationManagement: '/location-management',
  notificationSettings: '/notification-settings',
  
  // 其他
  about: '/about',
  privacyPolicy: '/privacy-policy',
  termsOfService: '/terms-of-service',
} as const;