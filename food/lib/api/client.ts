// API 客户端实现

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  APIClient,
  HTTPClient,
  APIRequestConfig,
  APIResponse,
  APIError,
  RequestInterceptor,
  ResponseInterceptor,
  APIClientConfig,
} from '@/types/api';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  Food,
  FoodListItem,
  Category,
  Location,
  ShoppingListItem,
  Recipe,
  OCRIngredientsResponse,
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
  PaginatedResponse,
  GetFoodsParams,
} from '@/types';

// ============= HTTP 客户端实现 =============

class HTTPClientImpl implements HTTPClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  private token: string | null = null;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(config: APIClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    this.defaultHeaders = { ...config.headers };
    
    // 从存储中加载token
    this.loadToken();
  }

  private async loadToken(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        this.token = token;
      }
    } catch (error) {
      console.warn('Failed to load token from storage:', error);
    }
  }

  setToken(token: string): void {
    this.token = token;
    AsyncStorage.setItem('auth_token', token).catch(console.warn);
  }

  clearToken(): void {
    this.token = null;
    AsyncStorage.removeItem('auth_token').catch(console.warn);
  }

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  private async processRequestInterceptors(config: APIRequestConfig): Promise<APIRequestConfig> {
    let processedConfig = config;
    
    for (const interceptor of this.requestInterceptors) {
      if (interceptor.onRequest) {
        try {
          processedConfig = await interceptor.onRequest(processedConfig);
        } catch (error) {
          if (interceptor.onRequestError) {
            interceptor.onRequestError(error);
          }
          throw error;
        }
      }
    }
    
    return processedConfig;
  }

  private async processResponseInterceptors<T>(response: APIResponse<T>): Promise<APIResponse<T>> {
    let processedResponse = response;
    
    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onResponse) {
        try {
          processedResponse = await interceptor.onResponse(processedResponse);
        } catch (error) {
          if (interceptor.onResponseError) {
            interceptor.onResponseError(error);
          }
          throw error;
        }
      }
    }
    
    return processedResponse;
  }

  async request<T = any>(config: APIRequestConfig): Promise<APIResponse<T>> {
    try {
      // 处理请求拦截器
      const processedConfig = await this.processRequestInterceptors(config);
      
      // 构建请求配置
      const url = processedConfig.url.startsWith('http') 
        ? processedConfig.url 
        : `${this.baseURL}${processedConfig.url}`;

      const headers: Record<string, string> = {
        ...this.defaultHeaders,
        ...processedConfig.headers,
      };

      // 添加认证头
      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      // 处理请求体
      let body: string | FormData | undefined;
      if (processedConfig.data) {
        if (processedConfig.data instanceof FormData) {
          body = processedConfig.data;
          // FormData 会自动设置 Content-Type
          delete headers['Content-Type'];
        } else {
          body = JSON.stringify(processedConfig.data);
          headers['Content-Type'] = 'application/json';
        }
      }

      // 发送请求
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), processedConfig.timeout || this.timeout);

      const response = await fetch(url, {
        method: processedConfig.method,
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 解析响应
      const responseData = await response.json();

      // 构建 API 响应对象
      const apiResponse: APIResponse<T> = {
        code: responseData.code,
        body: responseData.body,
        message: responseData.message,
      };

      // 处理响应拦截器
      const processedResponse = await this.processResponseInterceptors(apiResponse);

      // 检查业务错误
      if (processedResponse.code !== 0) {
        throw this.createAPIError(processedResponse, response.status);
      }

      return processedResponse;

    } catch (error) {
      // 处理网络错误
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw this.createNetworkError(error);
      }
      
      // 处理超时错误
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createTimeoutError();
      }

      // 重新抛出 API 错误
      if (this.isAPIError(error)) {
        throw error;
      }

      // 其他错误
      throw this.createUnknownError(error);
    }
  }

  async get<T = any>(url: string, params?: any): Promise<APIResponse<T>> {
    const queryString = params ? this.buildQueryString(params) : '';
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    
    return this.request<T>({
      method: 'GET',
      url: fullUrl,
    });
  }

  async post<T = any>(url: string, data?: any): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
    });
  }

  async put<T = any>(url: string, data?: any): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
    });
  }

  async patch<T = any>(url: string, data?: any): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      url,
      data,
    });
  }

  async delete<T = any>(url: string): Promise<APIResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
    });
  }

  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    return searchParams.toString();
  }

  private createAPIError(response: APIResponse<any>, status: number): APIError {
    const error = new Error(response.message) as APIError;
    
    if (status === 401) {
      error.code = 'AUTHENTICATION_ERROR';
    } else if (status === 403) {
      error.code = 'AUTHORIZATION_ERROR';
    } else if (status === 404) {
      error.code = 'NOT_FOUND_ERROR';
    } else if (status === 422) {
      error.code = 'VALIDATION_ERROR';
      (error as any).errors = response.body?.errors || {};
    } else if (status >= 500) {
      error.code = 'SERVER_ERROR';
    } else {
      error.code = 'NETWORK_ERROR';
    }
    
    (error as any).status = status;
    (error as any).response = response;
    
    return error;
  }

  private createNetworkError(originalError: Error): APIError {
    const error = new Error('Network request failed') as APIError;
    error.code = 'NETWORK_ERROR';
    return error;
  }

  private createTimeoutError(): APIError {
    const error = new Error('Request timeout') as APIError;
    error.code = 'TIMEOUT_ERROR';
    return error;
  }

  private createUnknownError(originalError: any): APIError {
    const error = new Error(originalError?.message || 'Unknown error') as APIError;
    error.code = 'NETWORK_ERROR';
    return error;
  }

  private isAPIError(error: any): error is APIError {
    return error && typeof error.code === 'string' && error.code.endsWith('_ERROR');
  }
}

// ============= API 客户端实现 =============

class APIClientImpl implements APIClient {
  private http: HTTPClient;

  constructor(config: APIClientConfig) {
    this.http = new HTTPClientImpl(config);
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // 请求拦截器：添加通用头部
    this.http.addRequestInterceptor({
      onRequest: (config) => {
        // 添加时间戳防止缓存
        if (config.method === 'GET') {
          const separator = config.url.includes('?') ? '&' : '?';
          config.url += `${separator}_t=${Date.now()}`;
        }
        return config;
      },
    });

    // 响应拦截器：处理通用错误
    this.http.addResponseInterceptor({
      onResponseError: (error) => {
        if (error.code === 'AUTHENTICATION_ERROR') {
          // Token 过期，清除本地存储并跳转到登录页
          this.http.clearToken();
          // 这里可以发送事件通知应用跳转到登录页
        }
        throw error;
      },
    });
  }

  // ============= 认证相关 =============

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.http.post('/auth/login', data);
    
    // 保存token
    if (response.body.token) {
      this.http.setToken(response.body.token);
    }
    
    return response.body;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.http.post('/auth/register', data);
    
    // 保存token
    if (response.body.token) {
      this.http.setToken(response.body.token);
    }
    
    return response.body;
  }

  async logout(): Promise<void> {
    try {
      await this.http.post('/auth/logout');
    } finally {
      // 无论请求是否成功都清除本地token
      this.http.clearToken();
    }
  }

  // ============= 用户相关 =============

  async getCurrentUser(): Promise<User> {
    const response = await this.http.get('/users/me');
    return response.body;
  }

  async updateUser(data: FormData): Promise<Partial<User>> {
    const response = await this.http.put('/users/me', data);
    return response.body;
  }

  // ============= 食物相关 =============

  async getFoods(params?: GetFoodsParams): Promise<PaginatedResponse<FoodListItem>> {
    const response = await this.http.get('/foods', params);
    return response.body;
  }

  async getFood(id: number): Promise<Food> {
    const response = await this.http.get(`/foods/${id}`);
    return response.body;
  }

  async createFood(data: FormData): Promise<Partial<Food>> {
    const response = await this.http.post('/foods', data);
    return response.body;
  }

  async updateFood(id: number, data: UpdateFoodRequest): Promise<Partial<Food>> {
    const response = await this.http.put(`/foods/${id}`, data);
    return response.body;
  }

  async deleteFood(id: number): Promise<void> {
    await this.http.delete(`/foods/${id}`);
  }

  async consumeFood(id: number, data: ConsumeFoodRequest): Promise<{ id: number; remainingQuantity: number }> {
    const response = await this.http.post(`/foods/${id}/consume`, data);
    return response.body;
  }

  // ============= 分类相关 =============

  async getCategories(): Promise<Category[]> {
    const response = await this.http.get('/categories');
    return response.body;
  }

  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    const response = await this.http.post('/categories', data);
    return response.body;
  }

  // ============= 位置相关 =============

  async getLocations(): Promise<Location[]> {
    const response = await this.http.get('/locations');
    return response.body;
  }

  async createLocation(data: CreateLocationRequest): Promise<Location> {
    const response = await this.http.post('/locations', data);
    return response.body;
  }

  // ============= 购物清单相关 =============

  async getShoppingList(): Promise<ShoppingListItem[]> {
    const response = await this.http.get('/shopping-list');
    return response.body;
  }

  async addShoppingItem(data: CreateShoppingItemRequest): Promise<ShoppingListItem> {
    const response = await this.http.post('/shopping-list/items', data);
    return response.body;
  }

  async updateShoppingList(data: UpdateShoppingListRequest): Promise<void> {
    await this.http.patch('/shopping-list/items', data);
  }

  // ============= AI功能相关 =============

  async recognizeIngredients(image: File): Promise<OCRIngredientsResponse> {
    const formData = new FormData();
    formData.append('image', image);
    
    const response = await this.http.post('/ai/ocr-ingredients', formData);
    return response.body;
  }

  async generateRecipes(data: GenerateRecipesRequest): Promise<Recipe[]> {
    const response = await this.http.post('/ai/generate-recipes', data);
    return response.body;
  }

  // ============= 推送相关 =============

  async registerPushToken(data: RegisterPushTokenRequest): Promise<void> {
    await this.http.post('/push/register-token', data);
  }

  async updateNotificationSettings(data: NotificationSettings): Promise<void> {
    await this.http.put('/users/me/settings', data);
  }
}

// ============= 配置和导出 =============

const API_CONFIG: APIClientConfig = {
  // baseURL: __DEV__ ? 'http://localhost:5000/api' : 'https://api.foodmanager.com/api',
  baseURL: __DEV__ ? 'http://192.168.31.248:5000/api' : 'https://api.foodmanager.com/api',
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
  },
  retryAttempts: 3,
  retryDelay: 1000,
  tokenStorageKey: 'auth_token',
  refreshTokenThreshold: 3600, // 1小时
};

// 创建单例实例
export const apiClient = new APIClientImpl(API_CONFIG);

// 导出类型和配置
export { API_CONFIG };
export type { APIClient, HTTPClient };