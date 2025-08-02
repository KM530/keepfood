# -*- coding: utf-8 -*-
"""API响应工具函数"""
from flask import jsonify
from typing import Any, Optional, Dict


def success_response(data: Any = None, message: str = "操作成功", code: int = 0) -> tuple:
    """
    成功响应
    
    Args:
        data: 响应数据
        message: 响应消息
        code: 响应代码
    
    Returns:
        (响应JSON, HTTP状态码)
    """
    return jsonify({
        'code': code,
        'body': data,
        'message': message
    }), 200


def error_response(message: str = "操作失败", code: int = 400, 
                  http_status: int = 400, data: Any = None) -> tuple:
    """
    错误响应
    
    Args:
        message: 错误消息
        code: 错误代码
        http_status: HTTP状态码
        data: 额外数据
    
    Returns:
        (响应JSON, HTTP状态码)
    """
    return jsonify({
        'code': code,
        'body': data,
        'message': message
    }), http_status


def validation_error_response(errors: Dict[str, list], 
                            message: str = "数据验证失败") -> tuple:
    """
    验证错误响应
    
    Args:
        errors: 验证错误字典
        message: 错误消息
    
    Returns:
        (响应JSON, HTTP状态码)
    """
    return jsonify({
        'code': 422,
        'body': {'errors': errors},
        'message': message
    }), 422


def unauthorized_response(message: str = "未授权访问") -> tuple:
    """
    未授权响应
    
    Args:
        message: 错误消息
    
    Returns:
        (响应JSON, HTTP状态码)
    """
    return jsonify({
        'code': 401,
        'body': None,
        'message': message
    }), 401


def forbidden_response(message: str = "禁止访问") -> tuple:
    """
    禁止访问响应
    
    Args:
        message: 错误消息
    
    Returns:
        (响应JSON, HTTP状态码)
    """
    return jsonify({
        'code': 403,
        'body': None,
        'message': message
    }), 403


def not_found_response(message: str = "资源不存在") -> tuple:
    """
    资源不存在响应
    
    Args:
        message: 错误消息
    
    Returns:
        (响应JSON, HTTP状态码)
    """
    return jsonify({
        'code': 404,
        'body': None,
        'message': message
    }), 404


def server_error_response(message: str = "服务器内部错误") -> tuple:
    """
    服务器错误响应
    
    Args:
        message: 错误消息
    
    Returns:
        (响应JSON, HTTP状态码)
    """
    return jsonify({
        'code': 500,
        'body': None,
        'message': message
    }), 500


def paginated_response(pagination, message: str = "获取成功") -> tuple:
    """
    分页响应
    
    Args:
        pagination: SQLAlchemy分页对象
        message: 响应消息
    
    Returns:
        (响应JSON, HTTP状态码)
    """
    items = []
    for item in pagination.items:
        if hasattr(item, 'to_dict'):
            items.append(item.to_dict())
        else:
            items.append(item)
    
    return success_response({
        'items': items,
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages,
        'has_prev': pagination.has_prev,
        'has_next': pagination.has_next,
        'prev_num': pagination.prev_num,
        'next_num': pagination.next_num
    }, message)


def created_response(data: Any = None, message: str = "创建成功") -> tuple:
    """
    创建成功响应
    
    Args:
        data: 响应数据
        message: 响应消息
    
    Returns:
        (响应JSON, HTTP状态码)
    """
    return jsonify({
        'code': 0,
        'body': data,
        'message': message
    }), 201


def updated_response(data: Any = None, message: str = "更新成功") -> tuple:
    """
    更新成功响应
    
    Args:
        data: 响应数据
        message: 响应消息
    
    Returns:
        (响应JSON, HTTP状态码)
    """
    return success_response(data, message)


def deleted_response(message: str = "删除成功") -> tuple:
    """
    删除成功响应
    
    Args:
        message: 响应消息
    
    Returns:
        (响应JSON, HTTP状态码)
    """
    return success_response(None, message)