// 智能食物保鲜管家 - TypeScript 类型定义

// ============= 基础类型 =============

export type FoodStatus = 'normal' | 'expiring_soon' | 'expired';
export type DeviceType = 'ios' | 'android';
export type ShelfLifeUnit = 'day' | 'month' | 'year';
export type SortBy = 'expiry_date' | 'created_at' | 'category';

// ============= 用户相关类型 =============

export interface User {
  id: number;
  nickname: string;
  avatar_url?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  account: string; // 邮箱或手机号
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
  confirm_password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UpdateUserRequest {
  nickname?: string;
  avatar?: File;
}

// ============= 食物相关类型 =============

export interface Food {
  id: number;
  name: string;
  image_url?: string[];
  quantity: number;
  unit: string;
  category_id: number;
  location_id?: number;
  production_date?: string;
  shelf_life_value?: number;
  shelf_life_unit?: ShelfLifeUnit;
  expiry_date: string;
  ingredients_text?: string;
  harmful_ingredients_json?: string[];
  calories_kcal?: number;
  energy_offset_info?: string;
  status: FoodStatus;
  days_until_expiry?: number;
  category?: Category;
  location?: Location;
  created_at: string;
  updated_at: string;
}

export interface FoodListItem {
  id: number;
  name: string;
  imageUrl?: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  status: FoodStatus;
  statusText: string;
  statusColor: string;
  daysUntilExpiry?: number;
  categoryName?: string;
  locationName?: string;
}

export interface CreateFoodRequest {
  images?: File[];
  name: string;
  quantity: number;
  unit: string;
  categoryId: number;
  locationId?: number;
  productionDate?: string;
  shelfLifeValue?: number;
  shelfLifeUnit?: ShelfLifeUnit;
  expiryDate: string;
  ingredientsText?: string;
  harmfulIngredients?: string[];
  caloriesKcal?: number;
  energyOffsetInfo?: string;
}

export interface UpdateFoodRequest {
  name?: string;
  quantity?: number;
  unit?: string;
  categoryId?: number;
  locationId?: number;
  productionDate?: string;
  shelfLifeValue?: number;
  shelfLifeUnit?: ShelfLifeUnit;
  expiryDate?: string;
  ingredientsText?: string;
}

export interface ConsumeFoodRequest {
  quantity: number;
}

// ============= 分类相关类型 =============

export interface Category {
  id: number;
  name: string;
  is_system: boolean;
  user_id?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryRequest {
  name: string;
}

// ============= 位置相关类型 =============

export interface Location {
  id: number;
  name: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface CreateLocationRequest {
  name: string;
}

// ============= 购物清单相关类型 =============

export interface ShoppingListItem {
  id: number;
  item_name: string;
  is_checked: boolean;
  created_from_food_id?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateShoppingItemRequest {
  itemName: string;
  fromFoodId?: number;
}

export interface UpdateShoppingListRequest {
  updates?: Array<{
    id: number;
    isChecked: boolean;
  }>;
  deletions?: number[];
}

// ============= AI功能相关类型 =============

export interface OCRIngredientsResponse {
  ingredientsText: string;
  harmfulIngredients: string[];
}

export interface AIFoodAnalysisRequest {
  images: File[];
}

export interface AIFoodAnalysisResponse {
  ingredients: string[];
  potential_concerns: {
    note: string;
    items: string[];
  };
  production_date?: string;
  shelf_life?: string;
  expiration_date?: string;
  is_expired: boolean;
  calories_kcal?: number;
  energy_offset_info?: string;
}

export interface Recipe {
  recipeName: string;
  videoUrl?: string;
  usedIngredients: string[];
  otherIngredients: string[];
  cookingTime?: number;
  difficulty?: string;
  instructions?: string[];
}

export interface GenerateRecipesRequest {
  foodIds: number[];
}

// ============= 推送通知相关类型 =============

export interface PushToken {
  id: number;
  device_token: string;
  device_type: DeviceType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegisterPushTokenRequest {
  deviceToken: string;
  deviceType: DeviceType;
}

export interface NotificationSettings {
  enableExpiryPush: boolean;
  pushLeadDays: number;
  pushTime: string;
}

// ============= API响应类型 =============

export interface APIResponse<T = any> {
  code: number;
  body: T;
  message: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
  has_prev: boolean;
  has_next: boolean;
  prev_num?: number;
  next_num?: number;
}

export interface FoodListResponse extends PaginatedResponse<FoodListItem> {}

// ============= 错误类型 =============

export interface APIError {
  code: number;
  message: string;
  body?: any;
}

export interface ValidationError {
  code: 422;
  message: string;
  body: {
    errors: Record<string, string[]>;
  };
}

// ============= 表单相关类型 =============

export interface FormField {
  value: string;
  error?: string;
  touched: boolean;
}

export interface LoginForm {
  account: FormField;
  password: FormField;
}

export interface RegisterForm {
  email: FormField;
  password: FormField;
  confirmPassword: FormField;
  nickname: FormField;
}

export interface FoodForm {
  name: FormField;
  quantity: FormField;
  unit: FormField;
  categoryId: FormField;
  locationId: FormField;
  productionDate: FormField;
  shelfLifeValue: FormField;
  shelfLifeUnit: FormField;
  expiryDate: FormField;
  ingredientsText: FormField;
}

// ============= 导航相关类型 =============

export interface TabRoute {
  name: string;
  title: string;
  icon: string;
  component: React.ComponentType;
}

export interface NavigationParams {
  // 首页
  Home: undefined;
  
  // 食物相关
  FoodDetail: { foodId: number };
  AddFood: undefined;
  EditFood: { foodId: number };
  
  // 菜谱相关
  Recipes: undefined;
  RecipeDetail: { recipeId: string };
  
  // 购物清单
  ShoppingList: undefined;
  
  // 个人中心
  Profile: undefined;
  CategoryManagement: undefined;
  NotificationSettings: undefined;
  
  // 认证
  Login: undefined;
  Register: undefined;
}

// ============= 状态管理相关类型 =============

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface FoodState {
  foods: FoodListItem[];
  currentFood: Food | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    total: number;
    hasMore: boolean;
  };
  filters: {
    sortBy: SortBy;
    categoryId?: number;
    locationId?: number;
    status?: FoodStatus;
  };
}

export interface AppState {
  auth: AuthState;
  food: FoodState;
  categories: Category[];
  locations: Location[];
  shoppingList: ShoppingListItem[];
  settings: NotificationSettings;
}

// ============= 工具类型 =============

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type Partial<T> = { [P in keyof T]?: T[P] };
export type Required<T> = { [P in keyof T]-?: T[P] };

// 创建类型（去除id和时间戳）
export type CreateType<T> = Omit<T, keyof { id: any; created_at: any; updated_at: any }>;

// 更新类型（所有字段可选，去除id和时间戳）
export type UpdateType<T> = Partial<Omit<T, keyof { id: any; created_at: any; updated_at: any }>>;

// ============= 常量类型 =============

export const FOOD_STATUS_COLORS = {
  normal: '#4CAF50',
  expiring_soon: '#FF9800',
  expired: '#F44336',
} as const;

export const SHELF_LIFE_UNITS = {
  day: '天',
  month: '月',
  year: '年',
} as const;

export const SORT_OPTIONS = {
  expiry_date: '按过期时间',
  created_at: '按添加时间',
  category: '按分类',
} as const;