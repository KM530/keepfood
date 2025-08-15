# 🍎 KeepFood - 智能食物管理系统

[![React Native](https://img.shields.io/badge/React%20Native-0.79.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-53.0.20-black.svg)](https://expo.dev/)
[![Python](https://img.shields.io/badge/Python-3.8+-green.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.0+-red.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> 食物管理系统，帮助用户智能管理食物库存、追踪保质期、生成菜谱推荐，让食物管理变得简单高效。本人高中牲，暑假结束要上高三了暂时会停更。

> Food management system that helps users intelligently manage food inventory, track expiration dates, and generate recipe recommendations, making food management simple and efficient.I'm a high school student. I'm going to be in my third year of high school after the summer vacation, so I'll stop updating for a while.

---

## 🌟 主要功能 / Main Features

### 🏠 食物管理 / Food Management
- **食物追踪** / **Food Tracking**: 记录食物名称、数量、分类、存放位置
- **保质期管理** / **Expiration Management**: 自动计算过期时间，智能提醒即将过期的食物
- **库存统计** / **Inventory Statistics**: 实时统计食物数量，支持分类和位置筛选
- **图片管理** / **Image Management**: 支持为食物添加图片，便于识别和管理

### 🍳 AI菜谱推荐 / AI Recipe Recommendations
- **智能推荐** / **Smart Recommendations**: 基于即将过期的食物自动生成菜谱建议
- **食材匹配** / **Ingredient Matching**: 分析现有食材，推荐最适合的料理方案
- **视频教程** / **Video Tutorials**: 集成视频教程链接，让烹饪更简单
- **营养分析** / **Nutrition Analysis**: 计算卡路里和营养成分，健康饮食

### 🛒 购物清单管理 / Shopping List Management
- **智能清单** / **Smart Lists**: 根据食物消耗情况自动生成购物建议
- **批量操作** / **Batch Operations**: 支持批量添加、删除、标记完成
- **分类管理** / **Category Management**: 按类别组织购物清单，提高效率


## 🛠️ 安装和运行 / Installation & Setup

### 环境要求 / Requirements
- Node.js 18+ / Node.js 18+
- Python 3.8+ / Python 3.8+
- React Native 开发环境 / React Native development environment
- iOS Simulator 或 Android Emulator / iOS Simulator or Android Emulator

### 快速开始 / Quick Start

1. **克隆项目** / **Clone the project**
```bash
git clone https://github.com/yourusername/keepfood.git
cd keepfood
```

2. **安装前端依赖** / **Install frontend dependencies**
```bash
cd food
npm install
```

3. **安装后端依赖** / **Install backend dependencies**
```bash
cd ../foodback
pip install -r requirements.txt
```

4. **启动后端服务** / **Start backend service**
```bash
python start_dev.py
```

5. **启动前端应用** / **Start frontend app**
```bash
cd ../food
npm start
```

### 开发环境配置 / Development Environment Setup

#### 前端开发 / Frontend Development
```bash
cd food
npm start          # 启动开发服务器 / Start development server
npm run android    # 启动Android模拟器 / Start Android emulator
npm run ios        # 启动iOS模拟器 / Start iOS simulator
npm run web        # 启动Web版本 / Start web version
```

#### 后端开发 / Backend Development
```bash
cd foodback
python start_dev.py    # 启动开发服务器 / Start development server
python -m pytest      # 运行测试 / Run tests
alembic upgrade head  # 数据库迁移 / Database migration
```

---

## 📁 项目结构 / Project Structure

```
keepfood/
├── 📱 food/                    # React Native 前端应用 / Frontend app
│   ├── 🎯 app/                # 应用页面和路由 / App pages and routing
│   │   ├── (tabs)/            # 主要标签页 / Main tabs
│   │   │   ├── index.tsx      # 首页 - 食物列表 / Home - Food list
│   │   │   ├── recipes.tsx    # 菜谱推荐 / Recipe recommendations
│   │   │   ├── shopping.tsx   # 购物清单 / Shopping list
│   │   │   └── profile.tsx    # 个人设置 / Profile settings
│   │   ├── food/              # 食物管理页面 / Food management pages
│   │   └── auth/              # 认证相关页面 / Authentication pages
│   ├── 🧩 components/         # 可复用UI组件 / Reusable UI components
│   ├── 🎨 contexts/           # React Context / React Context
│   ├── 🔧 hooks/              # 自定义Hooks / Custom Hooks
│   ├── 📚 types/              # TypeScript类型定义 / TypeScript types
│   └── 🛠️ utils/              # 工具函数 / Utility functions
├── 🐍 foodback/               # Python Flask 后端 / Backend
│   ├── 🚀 api/                # API接口 / API endpoints
│   ├── 🗄️ models/             # 数据模型 / Data models
│   ├── 🔐 auth/               # 认证模块 / Authentication module
│   ├── 📊 services/           # 业务逻辑 / Business logic
│   └── 🧪 tests/              # 测试文件 / Test files
└── 📖 docs/                   # 项目文档 / Project documentation
```

---

### 贡献方式 / Ways to Contribute
- 🐛 报告Bug / Report bugs
- 💡 提出新功能建议 / Suggest new features
- 📝 改进文档 / Improve documentation
- 🔧 提交代码修复 / Submit code fixes
- 🌟 给项目点星 / Star the project

### 开发流程 / Development Process
1. Fork 项目 / Fork the project
2. 创建功能分支 / Create feature branch (`git checkout -b feature/AmazingFeature`)
3. 提交更改 / Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 / Push to branch (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request / Create Pull Request



---

<div align="center">

**如果这个项目对你有帮助，请给它一个 ⭐️**

**If this project helps you, please give it a ⭐️**

</div>
