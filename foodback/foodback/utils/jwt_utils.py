# -*- coding: utf-8 -*-
"""JWT工具函数"""
import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import current_app, request, jsonify, g
from typing import Optional, Dict, Any


def generate_jwt_token(user_id: int, expires_in_hours: int = 24) -> str:
    """
    生成JWT Token
    
    Args:
        user_id: 用户ID
        expires_in_hours: 过期时间（小时）
    
    Returns:
        JWT Token字符串
    """
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=expires_in_hours),
        'iat': datetime.now(timezone.utc)
    }
    
    return jwt.encode(
        payload,
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )


def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """
    解码JWT Token
    
    Args:
        token: JWT Token字符串
    
    Returns:
        解码后的payload，如果无效则返回None
    """
    try:
        payload = jwt.decode(
            token,
            current_app.config['SECRET_KEY'],
            algorithms=['HS256']
        )
        return payload
    except jwt.ExpiredSignatureError:
        current_app.logger.warning("JWT token has expired")
        return None
    except jwt.InvalidTokenError:
        current_app.logger.warning("Invalid JWT token")
        return None


def jwt_required(f):
    """
    JWT认证装饰器
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        
        # 从Authorization header获取token
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({
                    'code': 401,
                    'message': 'Invalid authorization header format',
                    'body': None
                }), 401
        
        if not token:
            return jsonify({
                'code': 401,
                'message': 'Token is missing',
                'body': None
            }), 401
        
        # 解码token
        payload = decode_jwt_token(token)
        if not payload:
            return jsonify({
                'code': 401,
                'message': 'Token is invalid or expired',
                'body': None
            }), 401
        
        # 验证用户是否存在
        from foodback.user.models import User
        user = User.get_by_id(payload['user_id'])
        if not user:
            return jsonify({
                'code': 401,
                'message': 'User not found',
                'body': None
            }), 401
        
        # 将用户信息存储到g对象中
        g.current_user = user
        g.current_user_id = user.id
        
        return f(*args, **kwargs)
    
    return decorated_function


def get_current_user():
    """
    获取当前认证用户
    
    Returns:
        当前用户对象，如果未认证则返回None
    """
    return getattr(g, 'current_user', None)


def get_current_user_id():
    """
    获取当前认证用户ID
    
    Returns:
        当前用户ID，如果未认证则返回None
    """
    return getattr(g, 'current_user_id', None)


def refresh_token(current_token: str) -> Optional[str]:
    """
    刷新JWT Token
    
    Args:
        current_token: 当前的JWT Token
    
    Returns:
        新的JWT Token，如果刷新失败则返回None
    """
    payload = decode_jwt_token(current_token)
    if not payload:
        return None
    
    # 检查token是否即将过期（1小时内）
    exp_timestamp = payload['exp']
    exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
    now = datetime.now(timezone.utc)
    
    if (exp_datetime - now).total_seconds() > 3600:  # 超过1小时才过期，不需要刷新
        return current_token
    
    # 生成新token
    return generate_jwt_token(payload['user_id'])


def optional_jwt_auth(f):
    """
    可选JWT认证装饰器（不强制要求认证）
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        
        # 从Authorization header获取token
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                pass
        
        if token:
            # 尝试解码token
            payload = decode_jwt_token(token)
            if payload:
                # 验证用户是否存在
                from foodback.user.models import User
                user = User.get_by_id(payload['user_id'])
                if user:
                    g.current_user = user
                    g.current_user_id = user.id
        
        return f(*args, **kwargs)
    
    return decorated_function