# KeepFood - 食物管理应用

## 功能特性

### 自动刷新功能
应用现在支持页面切换时自动刷新数据，确保用户始终看到最新的信息：

- **首页**: 切换到首页时自动刷新食物列表
- **菜谱页面**: 切换到菜谱页面时自动刷新食物数据
- **购物清单**: 切换到购物清单时自动刷新购物项
- **个人资料**: 保持静态显示，无需频繁刷新

### 技术实现
使用 React Navigation 的 `useFocusEffect` Hook 实现：
- 当页面获得焦点时自动调用 `refresh()` 方法
- 确保数据始终是最新的
- 提升用户体验，无需手动下拉刷新

## 开发说明

### 依赖要求
- `@react-navigation/native` - 已包含在项目中
- React Native 0.79.5+
- Expo SDK 53+

### 使用方法
在需要自动刷新的页面中添加：

```typescript
import { useFocusEffect } from '@react-navigation/native';

// 在组件内部
useFocusEffect(
  useCallback(() => {
    console.log('🔄 页面获得焦点，自动刷新数据');
    refresh();
  }, [refresh])
);
```

## 项目结构

```
keepfood/
├── food/                 # React Native 前端应用
│   ├── app/             # 应用页面
│   │   └── (tabs)/      # 标签页
│   │       ├── index.tsx    # 首页
│   │       ├── recipes.tsx  # 菜谱页面
│   │       ├── shopping.tsx # 购物清单
│   │       └── profile.tsx  # 个人资料
│   ├── hooks/           # 自定义 Hooks
│   │   ├── useFoodList.ts   # 食物列表管理
│   │   └── useShoppingList.ts # 购物清单管理
│   └── components/      # UI 组件
└── foodback/            # Python Flask 后端
```

## 启动说明

### 前端开发
```bash
cd food
npm start
```

### 后端开发
```bash
cd foodback
python start_dev.py
```

## 更新日志

### 最新更新
- ✅ 添加页面切换自动刷新功能
- ✅ 优化用户体验，确保数据实时性
- ✅ 统一所有标签页的刷新行为 