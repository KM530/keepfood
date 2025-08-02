#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""开发环境启动脚本"""
import os
import sys
from flask.cli import main

if __name__ == '__main__':
    # 设置环境变量
    os.environ.setdefault('FLASK_APP', 'autoapp.py')
    os.environ.setdefault('FLASK_ENV', 'development')
    os.environ.setdefault('FLASK_DEBUG', '1')
    
    # 启动Flask开发服务器
    sys.argv = [
        'flask', 'run', 
        '--host=0.0.0.0', 
        '--port=5000', 
        '--reload'
    ]
    main()