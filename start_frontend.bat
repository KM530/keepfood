@echo off
echo 启动智能食物保鲜管家前端服务...
echo.

cd /d "%~dp0food"

echo 检查Node.js依赖...
if not exist "node_modules" (
    echo 安装依赖包...
    npm install
    echo 使用Expo安装原生依赖...
    npx expo install --fix
) else (
    echo 依赖包已存在，跳过安装...
)

echo.
echo 启动Expo开发服务器...
echo 前端Web地址: http://localhost:8081
echo 移动端: 使用Expo Go扫描二维码
echo 按 Ctrl+C 停止服务
echo.

npm run web

pause