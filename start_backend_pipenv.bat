@echo off
echo 启动智能食物保鲜管家后端服务 (Pipenv)...
echo.

cd /d "%~dp0foodback"

echo 检查 Pipenv 环境...
pipenv --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Pipenv 未安装，请先安装 Pipenv
    echo 运行: pip install pipenv
    pause
    exit /b 1
)

echo 安装/更新依赖...
pipenv install --dev

echo 测试Python导入...
pipenv run python test_simple.py
if errorlevel 1 (
    echo 导入测试失败，请检查依赖安装
    pause
    exit /b 1
)

echo 检查数据库迁移配置...
if not exist "migrations\alembic.ini" (
    echo 重新初始化数据库迁移...
    rmdir /s /q migrations 2>nul
    pipenv run flask db init
)

echo 应用数据库迁移...
pipenv run flask db migrate -m "Auto migration" 2>nul
pipenv run flask db upgrade

echo.
echo 启动Flask开发服务器...
echo 后端服务地址: http://localhost:5000
echo 按 Ctrl+C 停止服务
echo.

pipenv run flask run --host=0.0.0.0 --port=5000

pause