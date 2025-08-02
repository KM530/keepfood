# -*- coding: utf-8 -*-
"""认证装饰器"""

from functools import wraps
from flask import request, jsonify, g, current_app
from flask_login import current_user

from foodback.user.models import User
from foodback.utils.jwt_utils import decode_jwt_token
from foodback.utils.response_utils import unauthorized_response


def jwt_required(f):
    """
    JWT认证装饰器
    用于API路由的JWT Token验证
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        
        # 从Authorization header获取token
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                # Bearer <token>
                token = auth_header.split(' ')[1]
            except IndexError:
                return unauthorized_response('无效的Authorization头部格式')
        
        if not token:
            return unauthorized_response('缺少访问令牌')
        
        # 解码token
        payload = decode_jwt_token(token)
        if not payload:
            return unauthorized_response('令牌无效或已过期')
        
        # 验证用户是否存在
        user = User.get_by_id(payload['user_id'])
        if not user:
            return unauthorized_response('用户不存在')
        
        # 将用户信息存储到g对象中
        g.current_user = user
        g.current_user_id = user.id
        
        return f(*args, **kwargs)
    
    return decorated_function


def api_login_required(f):
    """
    API登录装饰器
    同时支持JWT Token和Flask-Login Session认证
    优先使用JWT Token，回退到Session认证
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = None
        
        # 1. 尝试JWT Token认证
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                token = auth_header.split(' ')[1]
                payload = decode_jwt_token(token)
                if payload:
                    user = User.get_by_id(payload['user_id'])
                    if user:
                        g.current_user = user
                        g.current_user_id = user.id
                        return f(*args, **kwargs)
            except (IndexError, KeyError):
                pass
        
        # 2. 回退到Flask-Login Session认证
        if current_user.is_authenticated:
            g.current_user = current_user
            g.current_user_id = current_user.id
            return f(*args, **kwargs)
        
        # 3. 都没有认证成功
        return unauthorized_response('请先登录')
    
    return decorated_function


def optional_jwt_auth(f):
    """
    可选JWT认证装饰器
    不强制要求认证，但如果提供了有效token会设置用户信息
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 尝试从Authorization header获取token
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                token = auth_header.split(' ')[1]
                payload = decode_jwt_token(token)
                if payload:
                    user = User.get_by_id(payload['user_id'])
                    if user:
                        g.current_user = user
                        g.current_user_id = user.id
            except (IndexError, KeyError):
                pass
        
        # 如果JWT认证失败，尝试Flask-Login
        if not hasattr(g, 'current_user') and current_user.is_authenticated:
            g.current_user = current_user
            g.current_user_id = current_user.id
        
        return f(*args, **kwargs)
    
    return decorated_function


def admin_required(f):
    """
    管理员权限装饰器
    需要先通过jwt_required或api_login_required认证
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(g, 'current_user') or not g.current_user:
            return unauthorized_response('请先登录')
        
        # 检查是否为管理员（这里可以根据实际需求扩展用户角色系统）
        if not getattr(g.current_user, 'is_admin', False):
            return jsonify({
                'code': 403,
                'message': '需要管理员权限',
                'body': None
            }), 403
        
        return f(*args, **kwargs)
    
    return decorated_function


def get_current_user():
    """
    获取当前认证用户
    可以在视图函数中使用
    """
    return getattr(g, 'current_user', None)


def get_current_user_id():
    """
    获取当前认证用户ID
    可以在视图函数中使用
    """
    return getattr(g, 'current_user_id', None)


def require_json(f):
    """
    要求请求必须是JSON格式的装饰器
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.is_json:
            return jsonify({
                'code': 400,
                'message': '请求必须是JSON格式',
                'body': None
            }), 400
        return f(*args, **kwargs)
    
    return decorated_function


def validate_content_type(*allowed_types):
    """
    验证请求Content-Type的装饰器
    
    Args:
        *allowed_types: 允许的Content-Type列表
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            content_type = request.content_type or ''
            
            # 检查Content-Type是否在允许的类型中
            is_allowed = any(
                allowed_type in content_type 
                for allowed_type in allowed_types
            )
            
            if not is_allowed:
                return jsonify({
                    'code': 400,
                    'message': f'不支持的Content-Type: {content_type}',
                    'body': {'allowed_types': list(allowed_types)}
                }), 400
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator


def rate_limit(max_requests=100, per_seconds=3600):
    """
    简单的速率限制装饰器
    基于IP地址进行限制
    
    Args:
        max_requests: 最大请求数
        per_seconds: 时间窗口（秒）
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # 这里可以集成Redis或其他缓存系统来实现更完善的速率限制
            # 目前只是一个简单的示例
            
            from flask import session
            import time
            
            client_ip = request.remote_addr
            now = time.time()
            
            # 使用session存储请求记录（生产环境应该使用Redis）
            rate_limit_key = f'rate_limit_{client_ip}'
            
            if rate_limit_key not in session:
                session[rate_limit_key] = []
            
            # 清理过期的请求记录
            session[rate_limit_key] = [
                timestamp for timestamp in session[rate_limit_key]
                if now - timestamp < per_seconds
            ]
            
            # 检查是否超过限制
            if len(session[rate_limit_key]) >= max_requests:
                return jsonify({
                    'code': 429,
                    'message': '请求过于频繁，请稍后再试',
                    'body': {
                        'max_requests': max_requests,
                        'per_seconds': per_seconds
                    }
                }), 429
            
            # 记录当前请求
            session[rate_limit_key].append(now)
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator