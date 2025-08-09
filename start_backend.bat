@echo off
echo 启动智能食物保鲜管家后端服务...
echo.

cd /d "%~dp0foodback"

echo 检查虚拟环境...
if not exist "venv" (
    echo 创建虚拟环境...
    python -m venv venv
)

echo 激活虚拟环境...
call venv\Scripts\activate

echo 安装/更新依赖...
pip install --upgrade pip
pip install -r requirements/dev.txt

echo 测试Python导入...
python test_simple.py
if errorlevel 1 (
    echo 导入测试失败，请检查依赖安装
    pause
    exit /b 1
)

echo 检查数据库迁移...
if not exist "migrations" (
    echo 初始化数据库迁移...
    flask db init
)

echo 应用数据库迁移...
flask db migrate -m "Auto migration" 2>nul
flask db upgrade

echo.
echo 启动Flask开发服务器...
echo 后端服务地址: http://localhost:5001
echo 按 Ctrl+C 停止服务
echo.

flask run --host=0.0.0.0 --port=5001

pause