// API 客户端实现

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  APIClient,
  HTTPClient,
  APIRequestConfig,
  APIError,
  RequestInterceptor,
  ResponseInterceptor,
  APIClientConfig,
  GetFoodsParams,
} from '@/types/api';
import type {
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
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
  UpdateCategoryRequest,
  CreateLocationRequest,
  UpdateLocationRequest,
  CreateShoppingItemRequest,
  UpdateShoppingListRequest,
  GenerateRecipesRequest,
  RegisterPushTokenRequest,
  NotificationSettings,
  PaginatedResponse,
  APIResponse,
  AIFoodAnalysisResponse,
} from '@/types';

// ============= HTTP 客户端实现 =============

class HTTPClientImpl implements HTTPClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  private token: string | null = null;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private baseOrigin: string; // 新增：用于静态资源
  public authExpired: boolean = false; // 新增：认证失效标志

  constructor(config: APIClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    this.defaultHeaders = { ...config.headers };
    // 从API基础地址提取主机地址（去掉/api）
    this.baseOrigin = this.baseURL.replace(/\/?api\/?$/, '');
    
    // 从存储中加载token（异步，但不等待）
    this.loadToken().catch(console.warn);
  }

  private async loadToken(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        this.token = token;
        console.log('Token loaded from storage:', token.substring(0, 20) + '...');
      } else {
        console.log('No token found in storage');
      }
    } catch (error) {
      console.warn('Failed to load token from storage:', error);
    }
  }

  setToken(token: string): void {
    this.token = token;
    console.log('Token set:', token.substring(0, 20) + '...');
    AsyncStorage.setItem('auth_token', token).catch(console.warn);
  }

  clearToken(): void {
    this.token = null;
    AsyncStorage.removeItem('auth_token').catch(console.warn);
  }

  async ensureTokenLoaded(): Promise<void> {
    if (this.token === null) {
      await this.loadToken();
    }
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
      // 确保token已加载
      await this.ensureTokenLoaded();
      
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
        console.log('Adding Authorization header with token');
      } else {
        console.log('No token available for Authorization header');
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

      console.log(`[API] Making ${processedConfig.method} request to: ${url}`);
      console.log(`[API] Request headers:`, headers);
      console.log(`[API] Request body:`, body);
      
      const response = await fetch(url, {
        method: processedConfig.method,
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`[API] Response status: ${response.status} ${response.statusText}`);
      console.log(`[API] Response headers:`, Object.fromEntries(response.headers.entries()));

      // 检查响应状态
      if (!response.ok) {
        // 尝试解析错误响应
        let errorData;
        try {
          const errorText = await response.text();
          console.log(`[API] Error response body: ${errorText}`);
          
          // 尝试解析为JSON
          try {
            errorData = JSON.parse(errorText);
          } catch (parseError) {
            // 如果不是JSON，创建一个错误对象
            errorData = {
              code: response.status,
              message: `HTTP ${response.status}: ${response.statusText}`,
              body: errorText
            };
          }
        } catch (textError) {
          errorData = {
            code: response.status,
            message: `HTTP ${response.status}: ${response.statusText}`,
            body: 'Unable to read response body'
          };
        }
        
        throw this.createAPIError(errorData, response.status);
      }

      // 检查Content-Type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn(`[API] Unexpected content-type: ${contentType}`);
      }

      // 解析响应
      let responseData;
      try {
        const responseText = await response.text();
        console.log(`[API] Response body: ${responseText.substring(0, 200)}...`);
        
        if (!responseText.trim()) {
          throw new Error('Empty response body');
        }
        
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[API] JSON parse error: ${parseError}`);
        throw this.createParseError(parseError);
      }

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
      // 401错误时自动清除过期的token
      this.clearToken();
      // 触发认证失效事件
      this.handleAuthenticationFailure();
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

  // 处理认证失效
  private handleAuthenticationFailure(): void {
    console.warn('[API] Authentication failed, clearing token and redirecting to login');
    // React Native环境，通过设置标志来通知应用需要重新登录
    this.authExpired = true;
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

  private createParseError(originalError: any): APIError {
    const error = new Error('Invalid JSON response from server') as APIError;
    error.code = 'PARSE_ERROR';
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
  private baseOrigin: string; // 用于静态资源URL构建

  constructor(config: APIClientConfig) {
    this.http = new HTTPClientImpl(config);
    // 从配置的baseURL中抽取主机（去掉/api）
    this.baseOrigin = config.baseURL.replace(/\/?api\/?$/, '');
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
    const response = await this.http.get('/auth/me');
    return response.body;
  }

  async updateUser(data: FormData): Promise<Partial<User>> {
    const response = await this.http.put('/auth/me', data);
    return response.body;
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await this.http.post('/auth/change-password', data);
  }

  // ============= 食物相关 =============

  async getFoods(params?: GetFoodsParams): Promise<PaginatedResponse<FoodListItem>> {
    const response = await this.http.get('/foods', params);
    
    // 转换后端数据格式到前端格式
    const convertedItems = response.body.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      imageUrl: this.processImageUrl(item.image_url),
      quantity: item.quantity,
      unit: item.unit,
      expiryDate: item.expiry_date,
      status: item.status,
      statusText: item.status_display,
      statusColor: this.getStatusColor(item.status),
      daysUntilExpiry: item.days_until_expiry,
      categoryName: item.category_name,
      locationName: item.location_name,
    }));
    
    return {
      ...response.body,
      items: convertedItems,
    };
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'expired':
        return '#F44336';
      case 'expiring_soon':
        return '#FF9800';
      default:
        return '#4CAF50';
    }
  }

  private processImageUrl(imageUrl: any): string | undefined {
    if (!imageUrl) {
      return undefined;
    }

    const buildFullUrl = (val?: string): string | undefined => {
      if (!val) return undefined;
      // 已是完整URL
      if (/^https?:\/\//i.test(val)) return val;
      // 标准化路径
      const normalized = /^\/?static\//.test(val)
        ? val.replace(/^\//, '')
        : `static/uploads/foods/${val}`;
      return `${this.baseOrigin}/${normalized}`;
    };
    
    // 如果是数组，取第一张并构造URL
    if (Array.isArray(imageUrl)) {
      return buildFullUrl(imageUrl.length > 0 ? imageUrl[0] : undefined);
    }
    
    // 如果是字符串，构造URL
    if (typeof imageUrl === 'string') {
      return buildFullUrl(imageUrl);
    }
    
    return undefined;
  }

  async getFood(id: number): Promise<Food> {
    const response = await this.http.get(`/foods/${id}`);
    return response.body;
  }

  async createFood(data: FormData): Promise<Partial<Food>> {
    const response = await this.http.post('/foods', data);
    return response.body;
  }

  async updateFood(id: number, data: UpdateFoodRequest | FormData): Promise<Partial<Food>> {
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

  async updateCategory(id: number, data: { name: string; description?: string }): Promise<Category> {
    const response = await this.http.put(`/categories/${id}`, data);
    return response.body;
  }

  async deleteCategory(id: number): Promise<void> {
    await this.http.delete(`/categories/${id}`);
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

  async updateLocation(id: number, data: { name: string; description?: string }): Promise<Location> {
    const response = await this.http.put(`/locations/${id}`, data);
    return response.body;
  }

  async deleteLocation(id: number): Promise<void> {
    await this.http.delete(`/locations/${id}`);
  }

  // ============= 购物清单相关 =============

  async getShoppingList(): Promise<ShoppingListItem[]> {
    const response = await this.http.get('/shopping-list');
    return response.body.items || [];
  }

  async addShoppingItem(data: CreateShoppingItemRequest): Promise<ShoppingListItem> {
    const response = await this.http.post('/shopping-list/items', data);
    return response.body;
  }

  async updateShoppingList(data: UpdateShoppingListRequest): Promise<void> {
    await this.http.patch('/shopping-list/items/batch', data);
  }

  async deleteShoppingItem(id: number): Promise<void> {
    await this.http.delete(`/shopping-list/items/${id}`);
  }

  // ============= AI功能相关 =============

  async recognizeIngredients(image: File): Promise<OCRIngredientsResponse> {
    const formData = new FormData();
    formData.append('image', image);
    
    const response = await this.http.post('/ai/ocr-ingredients', formData);
    return response.body;
  }

  async analyzeFoodImages(images: File[] | FormData): Promise<AIFoodAnalysisResponse> {
    let formData: FormData;
    
    if (images instanceof FormData) {
      // 如果传入的已经是FormData，直接使用
      formData = images;
    } else {
      // 如果传入的是File数组，创建FormData
      formData = new FormData();
      images.forEach((image, index) => {
        formData.append('images', image);
      });
    }
    
    // AI分析需要更长的超时时间（3分钟）
    const response = await this.http.request({
      method: 'POST',
      url: '/ai/analyze-food',
      data: formData,
      timeout: 180000 // 3分钟超时
    });
    return response.body;
  }

  async getAIStatus(): Promise<{ available: boolean; message: string }> {
    const response = await this.http.get('/ai/status');
    return response.body;
  }

  async generateRecipes(data: GenerateRecipesRequest): Promise<Recipe[]> {
    // 菜谱生成需要更长的超时时间（5分钟），因为AI处理需要时间
    const response = await this.http.request({
      method: 'POST',
      url: '/recipes/generate',
      data,
      timeout: 300000 // 5分钟超时
    });
    return response.body.recipes || [];
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
  // baseURL: __DEV__ ? 'http://localhost:5001/api' : 'https://api.foodmanager.com/api',
  baseURL: __DEV__ ? 'https://food.mentalnest.cn/api' : 'https://food.mentalnest.cn/api',
  timeout: 240000, // 2分钟超时，适应AI分析的长时间处理
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