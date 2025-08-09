# -*- coding: utf-8 -*-
"""Application configuration.

Most configuration is set via environment variables.

For local development, use a .env file to set
environment variables.
"""
import os
from environs import Env

env = Env()
env.read_env()

ENV = env.str("FLASK_ENV", default="production")
DEBUG = ENV == "development"
SQLALCHEMY_DATABASE_URI = env.str("DATABASE_URL")
SECRET_KEY = env.str("SECRET_KEY")
SEND_FILE_MAX_AGE_DEFAULT = env.int("SEND_FILE_MAX_AGE_DEFAULT")
BCRYPT_LOG_ROUNDS = env.int("BCRYPT_LOG_ROUNDS", default=13)
DEBUG_TB_ENABLED = DEBUG
DEBUG_TB_INTERCEPT_REDIRECTS = False
CACHE_TYPE = (
    "flask_caching.backends.SimpleCache"  # Can be "MemcachedCache", "RedisCache", etc.
)
SQLALCHEMY_TRACK_MODIFICATIONS = False

# JWT配置
JWT_SECRET_KEY = env.str("JWT_SECRET_KEY", default=SECRET_KEY)
JWT_ACCESS_TOKEN_EXPIRES = False

# 文件上传配置
MAX_CONTENT_LENGTH = env.int("MAX_CONTENT_LENGTH", default=16 * 1024 * 1024)  # 16MB
UPLOAD_FOLDER = env.str("UPLOAD_FOLDER", default="uploads")

# 确保上传目录存在
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# CORS配置
CORS_ORIGINS = [
    "http://localhost:3000", 
    "http://127.0.0.1:3000", 
    "http://localhost:8081",
    "http://192.168.31.248:8081",
    "exp://192.168.31.248:8081",
    "exp://localhost:8081"
]

# 完全禁用CSRF保护
WTF_CSRF_ENABLED = False
