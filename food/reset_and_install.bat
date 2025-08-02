@echo off
echo 清理和重新安装前端依赖...
echo.

cd /d "%~dp0"

echo 删除node_modules和缓存...
if exist "node_modules" (
    rmdir /s /q node_modules
    echo ✅ 已删除 node_modules
)

if exist ".expo" (
    rmdir /s /q .expo
    echo ✅ 已删除 .expo 缓存
)

echo.
echo 清理npm缓存...
npm cache clean --force

echo.
echo 重新安装依赖...
npm install

echo.
echo 使用Expo安装原生依赖...
npx expo install --fix

echo.
echo 预构建项目...
npx expo prebuild --clean

echo.
echo ✅ 依赖重新安装完成！
echo 现在可以运行: npm run web
echo.
pause