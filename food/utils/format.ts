// 格式化工具函数

// ============= 数字格式化 =============

export function formatNumber(num: number, decimals: number = 0): string {
  return num.toFixed(decimals);
}

export function formatQuantity(quantity: number, unit: string): string {
  // 如果是整数，不显示小数点
  const formattedQuantity = quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(1);
  return `${formattedQuantity}${unit}`;
}

export function formatCalories(calories: number): string {
  if (calories < 1000) {
    return `${calories}千卡`;
  } else {
    return `${(calories / 1000).toFixed(1)}千千卡`;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

// ============= 文本格式化 =============

export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - suffix.length) + suffix;
}

export function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatTitle(text: string): string {
  return text
    .split(' ')
    .map(word => capitalizeFirst(word.toLowerCase()))
    .join(' ');
}

export function removeSpaces(text: string): string {
  return text.replace(/\s+/g, '');
}

export function formatPhoneNumber(phone: string): string {
  // 格式化手机号为 138 0013 8000
  const cleaned = removeSpaces(phone);
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function maskPhoneNumber(phone: string): string {
  // 手机号脱敏 138****8000
  const cleaned = removeSpaces(phone);
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `${cleaned.slice(0, 3)}****${cleaned.slice(7)}`;
  }
  return phone;
}

export function maskEmail(email: string): string {
  // 邮箱脱敏 u***@example.com
  const [username, domain] = email.split('@');
  if (username && domain) {
    const maskedUsername = username.length > 1 
      ? `${username[0]}***${username[username.length - 1]}`
      : username;
    return `${maskedUsername}@${domain}`;
  }
  return email;
}

// ============= 列表格式化 =============

export function formatList(items: string[], separator: string = '、'): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  
  return items.join(separator);
}

export function formatIngredientsList(ingredients: string[]): string {
  if (ingredients.length === 0) return '无';
  if (ingredients.length <= 3) {
    return formatList(ingredients);
  }
  
  // 超过3个只显示前3个，后面用"等"表示
  return `${formatList(ingredients.slice(0, 3))}等`;
}

export function formatHarmfulIngredients(ingredients: string[]): string {
  if (ingredients.length === 0) return '未检测到有害成分';
  
  return `检测到：${formatList(ingredients)}`;
}

// ============= URL格式化 =============

export function formatImageUrl(url: string | null | undefined, size?: 'sm' | 'md' | 'lg'): string {
  if (!url) return '';
  
  // 如果是完整URL，直接返回
  if (url.startsWith('http')) {
    return url;
  }
  
  // 如果是相对路径，添加基础URL
  const baseUrl = __DEV__ ? 'http://localhost:5001' : 'https://api.foodmanager.com';
  let fullUrl = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  
  // 根据尺寸添加参数
  if (size) {
    const sizeMap = { sm: '200', md: '400', lg: '800' };
    fullUrl += `?size=${sizeMap[size]}`;
  }
  
  return fullUrl;
}

export function formatApiUrl(endpoint: string): string {
  const baseUrl = __DEV__ ? 'http://localhost:5001/api' : 'https://api.foodmanager.com/api';
  return `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
}

// ============= 搜索格式化 =============

export function formatSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function highlightSearchText(text: string, query: string): string {
  if (!query) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// ============= 错误消息格式化 =============

export function formatErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.code) {
    const errorMessages: Record<string, string> = {
      'NETWORK_ERROR': '网络连接失败，请检查网络设置',
      'TIMEOUT_ERROR': '请求超时，请稍后重试',
      'AUTHENTICATION_ERROR': '登录已过期，请重新登录',
      'AUTHORIZATION_ERROR': '没有权限执行此操作',
      'NOT_FOUND_ERROR': '请求的资源不存在',
      'VALIDATION_ERROR': '数据验证失败，请检查输入',
      'SERVER_ERROR': '服务器错误，请稍后重试',
    };
    
    return errorMessages[error.code] || '未知错误';
  }
  
  return '操作失败，请重试';
}

// ============= 表单数据格式化 =============

export function formatFormData(data: Record<string, any>): FormData {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          formData.append(`${key}[${index}]`, item);
        });
      } else {
        formData.append(key, String(value));
      }
    }
  });
  
  return formData;
}

// ============= 颜色格式化 =============

export function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function rgbaToHex(rgba: string): string {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return rgba;
  
  const [, r, g, b] = match;
  return `#${((1 << 24) + (parseInt(r) << 16) + (parseInt(g) << 8) + parseInt(b)).toString(16).slice(1)}`;
}

// ============= 时间格式化 =============

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}分钟`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
  }
}

export function formatCookingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
  }
}

// ============= 百分比格式化 =============

export function formatPercentage(value: number, total: number, decimals: number = 1): string {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
}

export function formatProgress(current: number, total: number): string {
  return `${current}/${total}`;
}