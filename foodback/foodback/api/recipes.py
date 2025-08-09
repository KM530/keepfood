"""
菜谱生成API端点
"""

import os
import json
import logging
from flask import Blueprint, request, current_app
from typing import List, Dict, Any

from ..auth.decorators import jwt_required
from ..utils.response_utils import success_response, error_response
from ..services.recipes_service import recipes_service

# 创建蓝图
blueprint = Blueprint('recipes', __name__)


@blueprint.route('/recipes/generate', methods=['POST'])
@jwt_required
def generate_recipes():
    """
    根据用户食材生成菜谱推荐
    
    接收食材名称列表，返回匹配的菜谱
    """
    try:
        current_app.logger.info('🍳 收到菜谱生成请求')
        
        # 获取请求数据
        data = request.get_json()
        if not data:
            return error_response('请求数据不能为空', 400)
        
        food_names = data.get('food_names', [])
        if not food_names:
            return error_response('请提供食材名称', 400)
        
        current_app.logger.info(f'📝 用户食材: {food_names}')
        
        # 调用菜谱服务
        recipes = recipes_service.generate_recipes(food_names)
        
        current_app.logger.info(f'✅ 生成菜谱完成，共{len(recipes)}道菜')
        
        return success_response({
            'recipes': recipes,
            'total_count': len(recipes)
        }, '菜谱生成成功')
        
    except Exception as e:
        current_app.logger.error(f'❌ 菜谱生成失败: {str(e)}')
        current_app.logger.error(f'错误详情: {repr(e)}')
        import traceback
        current_app.logger.error(f'错误堆栈: {traceback.format_exc()}')
        return error_response(f'菜谱生成失败: {str(e)}', 500)


@blueprint.route('/recipes/status', methods=['GET'])
@jwt_required
def get_recipes_status():
    """
    获取菜谱服务状态
    """
    try:
        is_available = recipes_service.is_available()
        
        return success_response({
            'available': is_available,
            'message': '菜谱服务正常' if is_available else '菜谱服务不可用'
        }, '获取菜谱服务状态成功')
        
    except Exception as e:
        current_app.logger.error(f'Failed to get recipes status: {str(e)}')
        return error_response('获取菜谱服务状态失败', 500)