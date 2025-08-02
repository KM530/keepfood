// API 模块统一导出

export { apiClient, API_CONFIG } from './client';
export type { APIClient, HTTPClient } from './client';

// 导出所有API相关类型
export type {
  APIResponse,
  APIError,
  PaginatedResponse,
  GetFoodsParams,
  APIRequestConfig,
  RequestInterceptor,
  ResponseInterceptor,
  APIClientConfig,
  NetworkError,
  TimeoutError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ServerError,
} from '@/types/api';

// 导出API端点常量
export { API_ENDPOINTS } from '@/types/api';