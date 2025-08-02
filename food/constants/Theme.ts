// 主题系统定义

export interface Theme {
  colors: {
    // 主色调
    primary: string;
    primaryLight: string;
    primaryDark: string;
    
    // 辅助色
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
    
    // 状态色
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // 食物状态色
    foodNormal: string;
    foodExpiringSoon: string;
    foodExpired: string;
    
    // 背景色
    background: string;
    surface: string;
    card: string;
    
    // 文本色
    text: string;
    textSecondary: string;
    textDisabled: string;
    textHint: string;
    
    // 边框和分割线
    border: string;
    divider: string;
    
    // 覆盖层
    overlay: string;
    backdrop: string;
    
    // 中性色
    white: string;
    black: string;
    transparent: string;
  };
  
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    round: number;
  };
  
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  
  fontWeight: {
    normal: '400';
    medium: '500';
    semibold: '600';
    bold: '700';
  };
  
  shadows: {
    sm: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    md: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    lg: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
}

// 浅色主题
export const lightTheme: Theme = {
  colors: {
    // 主色调 - 绿色系（代表新鲜、健康）
    primary: '#2E7D32',
    primaryLight: '#4CAF50',
    primaryDark: '#1B5E20',
    
    // 辅助色 - 橙色系（代表温暖、食物）
    secondary: '#FF6F00',
    secondaryLight: '#FF9800',
    secondaryDark: '#E65100',
    
    // 状态色
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
    
    // 食物状态色
    foodNormal: '#4CAF50',      // 绿色 - 新鲜
    foodExpiringSoon: '#FF9800', // 橙色 - 即将过期
    foodExpired: '#F44336',      // 红色 - 已过期
    
    // 背景色
    background: '#FFFFFF',
    surface: '#FAFAFA',
    card: '#FFFFFF',
    
    // 文本色
    text: '#212121',
    textSecondary: '#757575',
    textDisabled: '#BDBDBD',
    textHint: '#9E9E9E',
    
    // 边框和分割线
    border: '#E0E0E0',
    divider: '#EEEEEE',
    
    // 覆盖层
    overlay: 'rgba(0, 0, 0, 0.5)',
    backdrop: 'rgba(0, 0, 0, 0.3)',
    
    // 中性色
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999,
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

// 深色主题
export const darkTheme: Theme = {
  colors: {
    // 主色调 - 保持绿色但调整亮度
    primary: '#4CAF50',
    primaryLight: '#66BB6A',
    primaryDark: '#2E7D32',
    
    // 辅助色 - 保持橙色但调整亮度
    secondary: '#FF9800',
    secondaryLight: '#FFB74D',
    secondaryDark: '#F57C00',
    
    // 状态色 - 深色模式适配
    success: '#66BB6A',
    warning: '#FFB74D',
    error: '#EF5350',
    info: '#42A5F5',
    
    // 食物状态色
    foodNormal: '#66BB6A',
    foodExpiringSoon: '#FFB74D',
    foodExpired: '#EF5350',
    
    // 背景色 - 深色系
    background: '#121212',
    surface: '#1E1E1E',
    card: '#2D2D2D',
    
    // 文本色 - 深色模式适配
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textDisabled: '#666666',
    textHint: '#808080',
    
    // 边框和分割线
    border: '#404040',
    divider: '#333333',
    
    // 覆盖层
    overlay: 'rgba(0, 0, 0, 0.7)',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    
    // 中性色
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999,
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

// 主题类型
export type ThemeMode = 'light' | 'dark';

// 获取主题
export const getTheme = (mode: ThemeMode): Theme => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

// 默认主题
export const defaultTheme = lightTheme;