// API 相关类型定义

import type {
  APIResponse,
  PaginatedResponse,
  User,
  Food,
  FoodListItem,
  Category,
  Location,
  ShoppingListItem,
  Recipe,
  OCRIngredientsResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  CreateFoodRequest,
  UpdateFoodRequest,
  ConsumeFoodRequest,
  CreateCategoryRequest,
  CreateLocationRequest,
  CreateShoppingItemRequest,
  UpdateShoppingListRequest,
  GenerateRecipesRequest,
  RegisterPushTokenRequest,
  NotificationSettings,
  SortBy
} from './index';

// ============= API 客户端接口 =============

export interface APIClient {
  // 认证相关
  login(data: LoginRequest): Promise<AuthResponse>;
  register(data: RegisterRequest): Promise<AuthResponse>;
  logout(): Promise<void>;
  
  // 用户相关
  getCurrentUser(): Promise<User>;
  updateUser(data: FormData): Promise<Partial<User>>;
  changePassword(data: ChangePasswordRequest): Promise<void>;
  
  // 食物相关
  getFoods(params?: GetFoodsParams): Promise<PaginatedResponse<FoodListItem>>;
  getFood(id: number): Promise<Food>;
  createFood(data: FormData): Promise<Partial<Food>>;
  updateFood(id: number, data: UpdateFoodRequest): Promise<Partial<Food>>;
  deleteFood(id: number): Promise<void>;
  consumeFood(id: number, data: ConsumeFoodRequest): Promise<{ id: number; remainingQuantity: number }>;
  
  // 分类相关
  getCategories(): Promise<Category[]>;
  createCategory(data: CreateCategoryRequest): Promise<Category>;
  
  // 位置相关
  getLocations(): Promise<Location[]>;
  createLocation(data: CreateLocationRequest): Promise<Location>;
  
  // 购物清单相关
  getShoppingList(): Promise<ShoppingListItem[]>;
  addShoppingItem(data: CreateShoppingItemRequest): Promise<ShoppingListItem>;
  updateShoppingList(data: UpdateShoppingListRequest): Promise<void>;
  deleteShoppingItem(id: number): Promise<void>;
  
  // AI功能相关
  recognizeIngredients(image: File): Promise<OCRIngredientsResponse>;
  generateRecipes(data: GenerateRecipesRequest): Promise<Recipe[]>;
  
  // 推送相关
  registerPushToken(data: RegisterPushTokenRequest): Promise<void>;
  updateNotificationSettings(data: NotificationSettings): Promise<void>;
}

// ============= API 请求参数类型 =============

export interface GetFoodsParams {
  sortBy?: SortBy;
  page?: number;
  limit?: number;
  categoryId?: number;
  locationId?: number;
  status?: string;
  search?: string;
}

export interface APIRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
}

// ============= HTTP 拦截器类型 =============

export interface RequestInterceptor {
  onRequest?: (config: APIRequestConfig) => APIRequestConfig | Promise<APIRequestConfig>;
  onRequestError?: (error: any) => any;
}

export interface ResponseInterceptor {
  onResponse?: <T>(response: APIResponse<T>) => APIResponse<T> | Promise<APIResponse<T>>;
  onResponseError?: (error: any) => any;
}

export interface HTTPClient {
  request<T = any>(config: APIRequestConfig): Promise<APIResponse<T>>;
  get<T = any>(url: string, params?: any): Promise<APIResponse<T>>;
  post<T = any>(url: string, data?: any): Promise<APIResponse<T>>;
  put<T = any>(url: string, data?: any): Promise<APIResponse<T>>;
  patch<T = any>(url: string, data?: any): Promise<APIResponse<T>>;
  delete<T = any>(url: string): Promise<APIResponse<T>>;
  
  setToken(token: string): void;
  clearToken(): void;
  
  addRequestInterceptor(interceptor: RequestInterceptor): void;
  addResponseInterceptor(interceptor: ResponseInterceptor): void;
}

// ============= API 错误类型 =============

export interface NetworkError extends Error {
  code: 'NETWORK_ERROR';
  status?: number;
  response?: any;
}

export interface TimeoutError extends Error {
  code: 'TIMEOUT_ERROR';
}

export interface ValidationError extends Error {
  code: 'VALIDATION_ERROR';
  errors: Record<string, string[]>;
}

export interface AuthenticationError extends Error {
  code: 'AUTHENTICATION_ERROR';
  status: 401;
}

export interface AuthorizationError extends Error {
  code: 'AUTHORIZATION_ERROR';
  status: 403;
}

export interface NotFoundError extends Error {
  code: 'NOT_FOUND_ERROR';
  status: 404;
}

export interface ServerError extends Error {
  code: 'SERVER_ERROR';
  status: 500;
}

export interface ParseError extends Error {
  code: 'PARSE_ERROR';
}

export type APIError = 
  | NetworkError 
  | TimeoutError 
  | ValidationError 
  | AuthenticationError 
  | AuthorizationError 
  | NotFoundError 
  | ServerError
  | ParseError;

// ============= API 端点常量 =============

export const API_ENDPOINTS = {
  // 认证
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  
  // 用户
  USER_ME: '/users/me',
  
  // 食物
  FOODS: '/foods',
  FOOD_DETAIL: (id: number) => `/foods/${id}`,
  FOOD_CONSUME: (id: number) => `/foods/${id}/consume`,
  
  // 分类
  CATEGORIES: '/categories',
  
  // 位置
  LOCATIONS: '/locations',
  
  // 购物清单
  SHOPPING_LIST: '/shopping-list',
  SHOPPING_LIST_ITEMS: '/shopping-list/items',
  
  // AI功能
  OCR_INGREDIENTS: '/ai/ocr-ingredients',
  GENERATE_RECIPES: '/ai/generate-recipes',
  
  // 推送
  PUSH_REGISTER_TOKEN: '/push/register-token',
  USER_SETTINGS: '/users/me/settings',
} as const;

// ============= API 配置类型 =============

export interface APIConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  retryAttempts: number;
  retryDelay: number;
}

export interface APIClientConfig extends APIConfig {
  tokenStorageKey: string;
  refreshTokenThreshold: number; // Token刷新阈值（秒）
}

// ============= 缓存相关类型 =============

export interface CacheConfig {
  ttl: number; // 缓存时间（秒）
  maxSize: number; // 最大缓存条目数
  enabled: boolean;
}

export interface CachedResponse<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface APICache {
  get<T>(key: string): CachedResponse<T> | null;
  set<T>(key: string, data: T, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
  has(key: string): boolean;
}

// ============= 请求队列类型 =============

export interface QueuedRequest {
  id: string;
  config: APIRequestConfig;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
  retryCount: number;
}

export interface RequestQueue {
  add(request: QueuedRequest): void;
  remove(id: string): void;
  process(): Promise<void>;
  clear(): void;
  size(): number;
}

// ============= 上传进度类型 =============

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadConfig extends APIRequestConfig {
  onProgress?: (progress: UploadProgress) => void;
}

// ============= WebSocket 类型 (未来扩展) =============

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectAttempts: number;
  reconnectInterval: number;
}