@echo off
echo 启动前端Web版本...
echo.

cd /d "%~dp0"

echo 检查依赖...
if not exist "node_modules" (
    echo 请先运行依赖安装: reset_and_install.bat
    pause
    exit /b 1
)

echo.
echo 启动Web服务器...
echo 访问地址: http://localhost:8081
echo 按 Ctrl+C 停止服务
echo.

npx expo start --web --port 8081

pause