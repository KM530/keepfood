// 应用全局状态上下文

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { 
  FoodState, 
  Category, 
  Location, 
  ShoppingListItem, 
  NotificationSettings,
  FoodListItem,
  Food,
  SortBy,
  FoodStatus 
} from '@/types';

// ============= 应用状态类型 =============

interface AppState {
  // 食物状态
  food: FoodState;
  
  // 基础数据
  categories: Category[];
  locations: Location[];
  shoppingList: ShoppingListItem[];
  
  // 设置
  settings: NotificationSettings;
  
  // 全局加载状态
  globalLoading: boolean;
}

// ============= Action 类型 =============

type AppAction =
  // 全局加载
  | { type: 'SET_GLOBAL_LOADING'; payload: boolean }
  
  // 食物相关
  | { type: 'FOOD_LOADING'; payload: boolean }
  | { type: 'FOOD_ERROR'; payload: string | null }
  | { type: 'SET_FOODS'; payload: FoodListItem[] }
  | { type: 'ADD_FOOD'; payload: FoodListItem }
  | { type: 'UPDATE_FOOD'; payload: { id: number; data: Partial<FoodListItem> } }
  | { type: 'REMOVE_FOOD'; payload: number }
  | { type: 'SET_CURRENT_FOOD'; payload: Food | null }
  | { type: 'SET_FOOD_FILTERS'; payload: Partial<FoodState['filters']> }
  | { type: 'SET_FOOD_PAGINATION'; payload: Partial<FoodState['pagination']> }
  
  // 分类相关
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: { id: number; data: Partial<Category> } }
  | { type: 'REMOVE_CATEGORY'; payload: number }
  
  // 位置相关
  | { type: 'SET_LOCATIONS'; payload: Location[] }
  | { type: 'ADD_LOCATION'; payload: Location }
  | { type: 'UPDATE_LOCATION'; payload: { id: number; data: Partial<Location> } }
  | { type: 'REMOVE_LOCATION'; payload: number }
  
  // 购物清单相关
  | { type: 'SET_SHOPPING_LIST'; payload: ShoppingListItem[] }
  | { type: 'ADD_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: { id: number; data: Partial<ShoppingListItem> } }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: number }
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: number }
  
  // 设置相关
  | { type: 'SET_SETTINGS'; payload: NotificationSettings }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<NotificationSettings> };

// ============= 初始状态 =============

const initialState: AppState = {
  food: {
    foods: [],
    currentFood: null,
    loading: false,
    error: null,
    pagination: {
      page: 1,
      total: 0,
      hasMore: false,
    },
    filters: {
      sortBy: 'expiry_date',
    },
  },
  categories: [],
  locations: [],
  shoppingList: [],
  settings: {
    enableExpiryPush: true,
    pushLeadDays: 3,
    pushTime: '09:00',
  },
  globalLoading: false,
};

// ============= Reducer =============

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_GLOBAL_LOADING':
      return {
        ...state,
        globalLoading: action.payload,
      };

    // 食物相关
    case 'FOOD_LOADING':
      return {
        ...state,
        food: {
          ...state.food,
          loading: action.payload,
        },
      };

    case 'FOOD_ERROR':
      return {
        ...state,
        food: {
          ...state.food,
          error: action.payload,
          loading: false,
        },
      };

    case 'SET_FOODS':
      return {
        ...state,
        food: {
          ...state.food,
          foods: action.payload,
          loading: false,
          error: null,
        },
      };

    case 'ADD_FOOD':
      return {
        ...state,
        food: {
          ...state.food,
          foods: [action.payload, ...state.food.foods],
        },
      };

    case 'UPDATE_FOOD':
      return {
        ...state,
        food: {
          ...state.food,
          foods: state.food.foods.map(food =>
            food.id === action.payload.id
              ? { ...food, ...action.payload.data }
              : food
          ),
        },
      };

    case 'REMOVE_FOOD':
      return {
        ...state,
        food: {
          ...state.food,
          foods: state.food.foods.filter(food => food.id !== action.payload),
        },
      };

    case 'SET_CURRENT_FOOD':
      return {
        ...state,
        food: {
          ...state.food,
          currentFood: action.payload,
        },
      };

    case 'SET_FOOD_FILTERS':
      return {
        ...state,
        food: {
          ...state.food,
          filters: {
            ...state.food.filters,
            ...action.payload,
          },
        },
      };

    case 'SET_FOOD_PAGINATION':
      return {
        ...state,
        food: {
          ...state.food,
          pagination: {
            ...state.food.pagination,
            ...action.payload,
          },
        },
      };

    // 分类相关
    case 'SET_CATEGORIES':
      return {
        ...state,
        categories: action.payload,
      };

    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };

    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category =>
          category.id === action.payload.id
            ? { ...category, ...action.payload.data }
            : category
        ),
      };

    case 'REMOVE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(category => category.id !== action.payload),
      };

    // 位置相关
    case 'SET_LOCATIONS':
      return {
        ...state,
        locations: action.payload,
      };

    case 'ADD_LOCATION':
      return {
        ...state,
        locations: [...state.locations, action.payload],
      };

    case 'UPDATE_LOCATION':
      return {
        ...state,
        locations: state.locations.map(location =>
          location.id === action.payload.id
            ? { ...location, ...action.payload.data }
            : location
        ),
      };

    case 'REMOVE_LOCATION':
      return {
        ...state,
        locations: state.locations.filter(location => location.id !== action.payload),
      };

    // 购物清单相关
    case 'SET_SHOPPING_LIST':
      return {
        ...state,
        shoppingList: action.payload,
      };

    case 'ADD_SHOPPING_ITEM':
      return {
        ...state,
        shoppingList: [...state.shoppingList, action.payload],
      };

    case 'UPDATE_SHOPPING_ITEM':
      return {
        ...state,
        shoppingList: state.shoppingList.map(item =>
          item.id === action.payload.id
            ? { ...item, ...action.payload.data }
            : item
        ),
      };

    case 'REMOVE_SHOPPING_ITEM':
      return {
        ...state,
        shoppingList: state.shoppingList.filter(item => item.id !== action.payload),
      };

    case 'TOGGLE_SHOPPING_ITEM':
      return {
        ...state,
        shoppingList: state.shoppingList.map(item =>
          item.id === action.payload
            ? { ...item, is_checked: !item.is_checked }
            : item
        ),
      };

    // 设置相关
    case 'SET_SETTINGS':
      return {
        ...state,
        settings: action.payload,
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };

    default:
      return state;
  }
}

// ============= 上下文 =============

interface AppContextValue {
  // 状态
  state: AppState;
  
  // 全局方法
  setGlobalLoading: (loading: boolean) => void;
  
  // 食物方法
  setFoodLoading: (loading: boolean) => void;
  setFoodError: (error: string | null) => void;
  setFoods: (foods: FoodListItem[]) => void;
  addFood: (food: FoodListItem) => void;
  updateFood: (id: number, data: Partial<FoodListItem>) => void;
  removeFood: (id: number) => void;
  setCurrentFood: (food: Food | null) => void;
  setFoodFilters: (filters: Partial<FoodState['filters']>) => void;
  setFoodPagination: (pagination: Partial<FoodState['pagination']>) => void;
  
  // 分类方法
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: number, data: Partial<Category>) => void;
  removeCategory: (id: number) => void;
  
  // 位置方法
  setLocations: (locations: Location[]) => void;
  addLocation: (location: Location) => void;
  updateLocation: (id: number, data: Partial<Location>) => void;
  removeLocation: (id: number) => void;
  
  // 购物清单方法
  setShoppingList: (items: ShoppingListItem[]) => void;
  addShoppingItem: (item: ShoppingListItem) => void;
  updateShoppingItem: (id: number, data: Partial<ShoppingListItem>) => void;
  removeShoppingItem: (id: number) => void;
  toggleShoppingItem: (id: number) => void;
  
  // 设置方法
  setSettings: (settings: NotificationSettings) => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// ============= 提供者 =============

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 全局方法
  const setGlobalLoading = (loading: boolean) => {
    dispatch({ type: 'SET_GLOBAL_LOADING', payload: loading });
  };

  // 食物方法
  const setFoodLoading = (loading: boolean) => {
    dispatch({ type: 'FOOD_LOADING', payload: loading });
  };

  const setFoodError = (error: string | null) => {
    dispatch({ type: 'FOOD_ERROR', payload: error });
  };

  const setFoods = (foods: FoodListItem[]) => {
    dispatch({ type: 'SET_FOODS', payload: foods });
  };

  const addFood = (food: FoodListItem) => {
    dispatch({ type: 'ADD_FOOD', payload: food });
  };

  const updateFood = (id: number, data: Partial<FoodListItem>) => {
    dispatch({ type: 'UPDATE_FOOD', payload: { id, data } });
  };

  const removeFood = (id: number) => {
    dispatch({ type: 'REMOVE_FOOD', payload: id });
  };

  const setCurrentFood = (food: Food | null) => {
    dispatch({ type: 'SET_CURRENT_FOOD', payload: food });
  };

  const setFoodFilters = (filters: Partial<FoodState['filters']>) => {
    dispatch({ type: 'SET_FOOD_FILTERS', payload: filters });
  };

  const setFoodPagination = (pagination: Partial<FoodState['pagination']>) => {
    dispatch({ type: 'SET_FOOD_PAGINATION', payload: pagination });
  };

  // 分类方法
  const setCategories = (categories: Category[]) => {
    dispatch({ type: 'SET_CATEGORIES', payload: categories });
  };

  const addCategory = (category: Category) => {
    dispatch({ type: 'ADD_CATEGORY', payload: category });
  };

  const updateCategory = (id: number, data: Partial<Category>) => {
    dispatch({ type: 'UPDATE_CATEGORY', payload: { id, data } });
  };

  const removeCategory = (id: number) => {
    dispatch({ type: 'REMOVE_CATEGORY', payload: id });
  };

  // 位置方法
  const setLocations = (locations: Location[]) => {
    dispatch({ type: 'SET_LOCATIONS', payload: locations });
  };

  const addLocation = (location: Location) => {
    dispatch({ type: 'ADD_LOCATION', payload: location });
  };

  const updateLocation = (id: number, data: Partial<Location>) => {
    dispatch({ type: 'UPDATE_LOCATION', payload: { id, data } });
  };

  const removeLocation = (id: number) => {
    dispatch({ type: 'REMOVE_LOCATION', payload: id });
  };

  // 购物清单方法
  const setShoppingList = (items: ShoppingListItem[]) => {
    dispatch({ type: 'SET_SHOPPING_LIST', payload: items });
  };

  const addShoppingItem = (item: ShoppingListItem) => {
    dispatch({ type: 'ADD_SHOPPING_ITEM', payload: item });
  };

  const updateShoppingItem = (id: number, data: Partial<ShoppingListItem>) => {
    dispatch({ type: 'UPDATE_SHOPPING_ITEM', payload: { id, data } });
  };

  const removeShoppingItem = (id: number) => {
    dispatch({ type: 'REMOVE_SHOPPING_ITEM', payload: id });
  };

  const toggleShoppingItem = (id: number) => {
    dispatch({ type: 'TOGGLE_SHOPPING_ITEM', payload: id });
  };

  // 设置方法
  const setSettings = (settings: NotificationSettings) => {
    dispatch({ type: 'SET_SETTINGS', payload: settings });
  };

  const updateSettings = (settings: Partial<NotificationSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };

  const value: AppContextValue = {
    state,
    setGlobalLoading,
    setFoodLoading,
    setFoodError,
    setFoods,
    addFood,
    updateFood,
    removeFood,
    setCurrentFood,
    setFoodFilters,
    setFoodPagination,
    setCategories,
    addCategory,
    updateCategory,
    removeCategory,
    setLocations,
    addLocation,
    updateLocation,
    removeLocation,
    setShoppingList,
    addShoppingItem,
    updateShoppingItem,
    removeShoppingItem,
    toggleShoppingItem,
    setSettings,
    updateSettings,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// ============= Hook =============

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}