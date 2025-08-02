// 日期处理工具函数

import { format, parseISO, differenceInDays, addDays, addMonths, addYears, isValid, isBefore, isAfter } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { ShelfLifeUnit, FoodStatus } from '@/types';

// ============= 日期格式化 =============

export function formatDate(date: Date | string, pattern: string = 'yyyy-MM-dd'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return '';
    }
    return format(dateObj, pattern, { locale: zhCN });
  } catch (error) {
    console.warn('Date formatting error:', error);
    return '';
  }
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, 'yyyy-MM-dd HH:mm');
}

export function formatRelativeDate(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return '';
    }
    
    const now = new Date();
    const diffDays = differenceInDays(dateObj, now);
    
    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '明天';
    } else if (diffDays === -1) {
      return '昨天';
    } else if (diffDays > 1 && diffDays <= 7) {
      return `${diffDays}天后`;
    } else if (diffDays < -1 && diffDays >= -7) {
      return `${Math.abs(diffDays)}天前`;
    } else {
      return formatDate(dateObj, 'MM-dd');
    }
  } catch (error) {
    console.warn('Relative date formatting error:', error);
    return '';
  }
}

// ============= 日期计算 =============

export function calculateExpiryDate(
  productionDate: Date | string,
  shelfLifeValue: number,
  shelfLifeUnit: ShelfLifeUnit
): Date | null {
  try {
    const prodDate = typeof productionDate === 'string' ? parseISO(productionDate) : productionDate;
    if (!isValid(prodDate)) {
      return null;
    }
    
    switch (shelfLifeUnit) {
      case 'day':
        return addDays(prodDate, shelfLifeValue);
      case 'month':
        return addMonths(prodDate, shelfLifeValue);
      case 'year':
        return addYears(prodDate, shelfLifeValue);
      default:
        return null;
    }
  } catch (error) {
    console.warn('Expiry date calculation error:', error);
    return null;
  }
}

export function getDaysUntilExpiry(expiryDate: Date | string): number | null {
  try {
    const expiry = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;
    if (!isValid(expiry)) {
      return null;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 重置时间为00:00:00
    
    const expiryDateOnly = new Date(expiry);
    expiryDateOnly.setHours(0, 0, 0, 0);
    
    return differenceInDays(expiryDateOnly, today);
  } catch (error) {
    console.warn('Days until expiry calculation error:', error);
    return null;
  }
}

export function getFoodStatus(expiryDate: Date | string, expiringThreshold: number = 3): FoodStatus {
  const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
  
  if (daysUntilExpiry === null) {
    return 'normal';
  }
  
  if (daysUntilExpiry < 0) {
    return 'expired';
  } else if (daysUntilExpiry <= expiringThreshold) {
    return 'expiring_soon';
  } else {
    return 'normal';
  }
}

export function getFoodStatusText(expiryDate: Date | string): string {
  const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
  
  if (daysUntilExpiry === null) {
    return '未知';
  }
  
  if (daysUntilExpiry < 0) {
    return `已过期${Math.abs(daysUntilExpiry)}天`;
  } else if (daysUntilExpiry === 0) {
    return '今天过期';
  } else if (daysUntilExpiry <= 3) {
    return `还剩${daysUntilExpiry}天`;
  } else {
    return `剩余${daysUntilExpiry}天`;
  }
}

// ============= 日期验证 =============

export function isValidDate(date: any): boolean {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj);
  } catch {
    return false;
  }
}

export function isDateInFuture(date: Date | string): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return false;
    }
    
    const today = new Date();
    today.setHours(23, 59, 59, 999); // 设置为今天的最后一刻
    
    return isAfter(dateObj, today);
  } catch {
    return false;
  }
}

export function isDateInPast(date: Date | string): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return false;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 设置为今天的开始
    
    return isBefore(dateObj, today);
  } catch {
    return false;
  }
}

export function isExpiryDateValid(
  productionDate: Date | string | null,
  expiryDate: Date | string
): boolean {
  try {
    const expiry = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;
    if (!isValid(expiry)) {
      return false;
    }
    
    // 如果有生产日期，过期日期必须晚于生产日期
    if (productionDate) {
      const production = typeof productionDate === 'string' ? parseISO(productionDate) : productionDate;
      if (isValid(production) && !isAfter(expiry, production)) {
        return false;
      }
    }
    
    // 过期日期不能早于今天（允许今天过期）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiryDateOnly = new Date(expiry);
    expiryDateOnly.setHours(0, 0, 0, 0);
    
    return !isBefore(expiryDateOnly, today);
  } catch {
    return false;
  }
}

// ============= 日期范围 =============

export function getDateRange(days: number): { start: Date; end: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = new Date(today);
  const end = addDays(today, days);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

export function getExpiringFoodsDateRange(days: number = 3): { start: Date; end: Date } {
  return getDateRange(days);
}

// ============= 时间格式化 =============

export function formatTime(date: Date | string): string {
  return formatDate(date, 'HH:mm');
}

export function parseTime(timeString: string): Date | null {
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }
    
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  } catch {
    return null;
  }
}

// ============= 日期选择器辅助 =============

export function getMinDate(): Date {
  // 最小日期为今天
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function getMaxDate(): Date {
  // 最大日期为10年后
  return addYears(new Date(), 10);
}

export function getDefaultExpiryDate(): Date {
  // 默认过期日期为7天后
  return addDays(new Date(), 7);
}

// ============= 日期比较 =============

export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  try {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
    
    if (!isValid(d1) || !isValid(d2)) {
      return false;
    }
    
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  } catch {
    return false;
  }
}

export function isToday(date: Date | string): boolean {
  return isSameDay(date, new Date());
}

export function isTomorrow(date: Date | string): boolean {
  return isSameDay(date, addDays(new Date(), 1));
}

export function isYesterday(date: Date | string): boolean {
  return isSameDay(date, addDays(new Date(), -1));
}