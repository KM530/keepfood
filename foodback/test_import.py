#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""测试导入是否正常"""

import sys
import os

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("测试导入...")
    from foodback.app import create_app
    print("✅ 成功导入 create_app")
    
    from foodback.utils import flash_errors
    print("✅ 成功导入 flash_errors")
    
    from foodback.extensions import migrate
    print("✅ 成功导入 migrate")
    
    # 创建应用实例
    app = create_app()
    print("✅ 成功创建应用实例")
    
    # 测试数据库连接配置
    with app.app_context():
        print(f"数据库URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
        print("✅ 应用配置正常")
    
    print("\n🎉 所有导入测试通过！")
    
except ImportError as e:
    print(f"❌ 导入错误: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ 其他错误: {e}")
    sys.exit(1)