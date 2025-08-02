# -*- coding: utf-8 -*-
"""数据模型工具函数"""
import datetime as dt
from typing import Optional, Dict, Any, TYPE_CHECKING

if TYPE_CHECKING:
    from foodback.models import Food


def calculate_expiry_date(
    production_date: Optional[dt.date],
    shelf_life_value: Optional[int],
    shelf_life_unit: Optional[str]
) -> Optional[dt.date]:
    """
    根据生产日期和保质期计算过期时间
    
    Args:
        production_date: 生产日期
        shelf_life_value: 保质期数值
        shelf_life_unit: 保质期单位 ('day', 'month', 'year')
    
    Returns:
        计算出的过期日期
    """
    if not production_date or not shelf_life_value or not shelf_life_unit:
        return None
    
    if shelf_life_unit == 'day':
        delta = dt.timedelta(days=shelf_life_value)
    elif shelf_life_unit == 'month':
        # 近似计算，假设每月30天
        delta = dt.timedelta(days=shelf_life_value * 30)
    elif shelf_life_unit == 'year':
        # 近似计算，假设每年365天
        delta = dt.timedelta(days=shelf_life_value * 365)
    else:
        return None
    
    return production_date + delta


def get_food_status_color(status: str) -> str:
    """
    根据食物状态获取对应的颜色代码
    
    Args:
        status: 食物状态 ('normal', 'expiring_soon', 'expired')
    
    Returns:
        颜色代码
    """
    color_map = {
        'normal': '#4CAF50',      # 绿色
        'expiring_soon': '#FF9800',  # 橙色
        'expired': '#F44336',     # 红色
        'unknown': '#9E9E9E'      # 灰色
    }
    return color_map.get(status, color_map['unknown'])


def get_food_status_text(food: "Food") -> str:
    """
    根据食物获取状态描述文本
    
    Args:
        food: 食物对象
    
    Returns:
        状态描述文本
    """
    if not food.expiry_date:
        return "未知"
    
    today = dt.date.today()
    days_diff = (food.expiry_date - today).days
    
    if days_diff < 0:
        return f"已过期{abs(days_diff)}天"
    elif days_diff == 0:
        return "今天过期"
    elif days_diff <= 3:
        return f"还剩{days_diff}天"
    else:
        return f"剩余{days_diff}天"


def get_food_status_display(expiry_date: Optional[dt.date]) -> str:
    """
    根据过期日期获取状态显示文本
    
    Args:
        expiry_date: 过期日期
    
    Returns:
        状态显示文本
    """
    if not expiry_date:
        return "未知"
    
    today = dt.date.today()
    days_diff = (expiry_date - today).days
    
    if days_diff < 0:
        return f"已过期{abs(days_diff)}天"
    elif days_diff == 0:
        return "今天过期"
    elif days_diff <= 3:
        return f"还剩{days_diff}天"
    else:
        return f"剩余{days_diff}天"


def format_food_display_info(food: "Food") -> Dict[str, Any]:
    """
    格式化食物显示信息
    
    Args:
        food: 食物对象
    
    Returns:
        格式化后的显示信息
    """
    return {
        'id': food.id,
        'name': food.name,
        'quantity': float(food.quantity),
        'unit': food.unit,
        'image_url': food.image_url[0] if food.image_url else None,
        'expiry_date': food.expiry_date.isoformat() if food.expiry_date else None,
        'status': food.status,
        'status_text': get_food_status_text(food),
        'status_color': get_food_status_color(food.status),
        'days_until_expiry': food.days_until_expiry,
        'category_name': food.category.name if food.category else None,
        'location_name': food.location.name if food.location else None,
    }


def get_system_categories() -> list:
    """
    获取系统预置分类列表
    
    Returns:
        系统预置分类列表
    """
    return [
        {'name': '蔬菜水果', 'is_system': True},
        {'name': '肉蛋奶', 'is_system': True},
        {'name': '零食饮料', 'is_system': True},
        {'name': '主食', 'is_system': True},
        {'name': '调料', 'is_system': True},
        {'name': '冷冻食品', 'is_system': True},
    ]


def analyze_harmful_ingredients(ingredients_text: str) -> list:
    """
    分析配料表，识别潜在有害成分
    
    Args:
        ingredients_text: 配料表文本
    
    Returns:
        检测到的有害成分列表
    """
    harmful_ingredients = [
        '阿斯巴甜', '高果糖浆', '山梨酸钾', 
        '苯甲酸钠', '胭脂红', '日落黄',
        '人工色素', '反式脂肪酸', '硝酸钠',
        '亚硝酸钠', '糖精钠', '安赛蜜'
    ]
    
    detected_harmful = []
    if ingredients_text:
        ingredients_lower = ingredients_text.lower()
        for ingredient in harmful_ingredients:
            if ingredient in ingredients_text:
                detected_harmful.append(ingredient)
    
    return detected_harmful