# -*- coding: utf-8 -*-
"""数据库查询工具函数"""
from typing import Dict, Any, Optional, List
from datetime import datetime, date
from sqlalchemy import and_, or_, desc, asc
from sqlalchemy.orm import Query

from foodback.extensions import db


def apply_filters(query: Query, model_class, filters: Dict[str, Any]) -> Query:
    """
    为查询应用过滤条件
    
    Args:
        query: SQLAlchemy查询对象
        model_class: 模型类
        filters: 过滤条件字典
    
    Returns:
        应用过滤后的查询对象
    """
    for key, value in filters.items():
        if value is None:
            continue
            
        if not hasattr(model_class, key):
            continue
        
        column = getattr(model_class, key)
        
        # 处理不同类型的过滤条件
        if isinstance(value, dict):
            # 支持范围查询等复杂条件
            if 'gte' in value:  # 大于等于
                query = query.filter(column >= value['gte'])
            if 'lte' in value:  # 小于等于
                query = query.filter(column <= value['lte'])
            if 'gt' in value:   # 大于
                query = query.filter(column > value['gt'])
            if 'lt' in value:   # 小于
                query = query.filter(column < value['lt'])
            if 'in' in value:   # 包含在列表中
                query = query.filter(column.in_(value['in']))
            if 'like' in value: # 模糊匹配
                query = query.filter(column.like(f"%{value['like']}%"))
        elif isinstance(value, list):
            # 列表条件，使用IN查询
            query = query.filter(column.in_(value))
        else:
            # 精确匹配
            query = query.filter(column == value)
    
    return query


def apply_sorting(query: Query, model_class, sort_by: Optional[str] = None, 
                 sort_order: str = 'asc') -> Query:
    """
    为查询应用排序
    
    Args:
        query: SQLAlchemy查询对象
        model_class: 模型类
        sort_by: 排序字段名
        sort_order: 排序顺序 ('asc' 或 'desc')
    
    Returns:
        应用排序后的查询对象
    """
    if not sort_by or not hasattr(model_class, sort_by):
        return query
    
    column = getattr(model_class, sort_by)
    
    if sort_order.lower() == 'desc':
        query = query.order_by(desc(column))
    else:
        query = query.order_by(asc(column))
    
    return query


def build_pagination_response(pagination) -> Dict[str, Any]:
    """
    构建分页响应数据
    
    Args:
        pagination: SQLAlchemy分页对象
    
    Returns:
        分页响应字典
    """
    return {
        'items': [item.to_dict() if hasattr(item, 'to_dict') else item 
                 for item in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages,
        'has_prev': pagination.has_prev,
        'has_next': pagination.has_next,
        'prev_num': pagination.prev_num,
        'next_num': pagination.next_num
    }


def get_date_range_filter(start_date: Optional[date] = None, 
                         end_date: Optional[date] = None) -> Dict[str, Any]:
    """
    构建日期范围过滤条件
    
    Args:
        start_date: 开始日期
        end_date: 结束日期
    
    Returns:
        日期范围过滤条件
    """
    date_filter = {}
    
    if start_date:
        date_filter['gte'] = start_date
    
    if end_date:
        date_filter['lte'] = end_date
    
    return date_filter if date_filter else None


def search_foods_by_expiry_status(user_id: int, status: str = 'expiring_soon', 
                                days_ahead: int = 3) -> List:
    """
    根据过期状态搜索食物
    
    Args:
        user_id: 用户ID
        status: 过期状态 ('normal', 'expiring_soon', 'expired')
        days_ahead: 即将过期的天数阈值
    
    Returns:
        符合条件的食物列表
    """
    from foodback.models import Food
    from datetime import date, timedelta
    
    today = date.today()
    query = Food.query.filter(
        Food.user_id == user_id,
        Food.is_deleted == False
    )
    
    if status == 'expired':
        # 已过期
        query = query.filter(Food.expiry_date < today)
    elif status == 'expiring_soon':
        # 即将过期（包括今天）
        cutoff_date = today + timedelta(days=days_ahead)
        query = query.filter(
            Food.expiry_date >= today,
            Food.expiry_date <= cutoff_date
        )
    elif status == 'normal':
        # 正常（超过阈值天数）
        cutoff_date = today + timedelta(days=days_ahead)
        query = query.filter(Food.expiry_date > cutoff_date)
    
    return query.order_by(asc(Food.expiry_date)).all()


def bulk_update_records(model_class, updates: List[Dict[str, Any]], 
                       id_field: str = 'id') -> int:
    """
    批量更新记录
    
    Args:
        model_class: 模型类
        updates: 更新数据列表，每个元素包含id和要更新的字段
        id_field: ID字段名
    
    Returns:
        更新的记录数量
    """
    if not updates:
        return 0
    
    updated_count = 0
    
    for update_data in updates:
        if id_field not in update_data:
            continue
        
        record_id = update_data.pop(id_field)
        record = model_class.get_by_id(record_id)
        
        if record:
            record.update(commit=False, **update_data)
            updated_count += 1
    
    db.session.commit()
    return updated_count


def get_model_stats(model_class, user_id: Optional[int] = None) -> Dict[str, int]:
    """
    获取模型统计信息
    
    Args:
        model_class: 模型类
        user_id: 用户ID（可选）
    
    Returns:
        统计信息字典
    """
    query = model_class.query
    
    # 用户过滤
    if user_id and hasattr(model_class, 'user_id'):
        query = query.filter(model_class.user_id == user_id)
    
    # 基础统计
    stats = {
        'total': query.count()
    }
    
    # 软删除统计
    if hasattr(model_class, 'is_deleted'):
        stats['active'] = query.filter(model_class.is_deleted == False).count()
        stats['deleted'] = query.filter(model_class.is_deleted == True).count()
    
    # 食物特定统计
    if model_class.__name__ == 'Food':
        from datetime import date, timedelta
        today = date.today()
        active_query = query.filter(model_class.is_deleted == False)
        
        stats.update({
            'expired': active_query.filter(model_class.expiry_date < today).count(),
            'expiring_soon': active_query.filter(
                model_class.expiry_date >= today,
                model_class.expiry_date <= today + timedelta(days=3)
            ).count(),
            'normal': active_query.filter(
                model_class.expiry_date > today + timedelta(days=3)
            ).count()
        })
    
    return stats