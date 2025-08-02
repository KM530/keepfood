#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""简单导入测试"""

import sys
import os

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("测试基础导入...")
    
    # 测试工具函数
    from foodback.utils.model_utils import calculate_expiry_date, get_food_status_display
    print("✅ model_utils 导入成功")
    
    from foodback.utils.response_utils import success_response
    print("✅ response_utils 导入成功")
    
    from foodback.utils.query_utils import apply_filters
    print("✅ query_utils 导入成功")
    
    from foodback.utils.file_utils import validate_image_file
    print("✅ file_utils 导入成功")
    
    from foodback.auth.decorators import jwt_required
    print("✅ auth decorators 导入成功")
    
    # 测试API模块
    from foodback.api.foods import blueprint as foods_blueprint
    print("✅ foods API 导入成功")
    
    print("\n🎉 所有关键模块导入成功！")
    
except ImportError as e:
    print(f"❌ 导入错误: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
except Exception as e:
    print(f"❌ 其他错误: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)