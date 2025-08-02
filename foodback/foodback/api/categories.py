# -*- coding: utf-8 -*-
"""分类管理API"""

from flask import Blueprint, request, current_app
from sqlalchemy import or_

from foodback.extensions import db
from foodback.models import Category
from foodback.auth.decorators import jwt_required, get_current_user_id
from foodback.utils.response_utils import (
    success_response, error_response, validation_error_response,
    created_response, not_found_response
)
from foodback.utils.model_utils import get_system_categories

blueprint = Blueprint('categories', __name__)


@blueprint.route('/categories', methods=['GET'])
@jwt_required
def get_categories():
    """获取分类列表（系统分类+用户自定义分类）"""
    try:
        user_id = get_current_user_id()
        
        # 获取系统分类和用户自定义分类
        categories = Category.query.filter(
            or_(
                Category.is_system == True,
                Category.user_id == user_id
            )
        ).order_by(
            Category.is_system.desc(),  # 系统分类排在前面
            Category.created_at.asc()
        ).all()

        # 转换为字典格式
        categories_data = []
        for category in categories:
            category_dict = category.to_dict()
            # 添加分类类型标识
            category_dict['type'] = 'system' if category.is_system else 'custom'
            categories_data.append(category_dict)

        return success_response(categories_data, '获取分类列表成功')

    except Exception as e:
        current_app.logger.error(f'Get categories error: {str(e)}')
        return error_response('获取分类列表失败', 500)


@blueprint.route('/categories', methods=['POST'])
@jwt_required
def create_category():
    """创建用户自定义分类"""
    try:
        user_id = get_current_user_id()
        data = request.get_json()
        
        if not data or 'name' not in data:
            return error_response('请提供分类名称', 400)

        name = data['name'].strip()
        if not name:
            return error_response('分类名称不能为空', 400)

        if len(name) > 20:
            return error_response('分类名称不能超过20个字符', 400)

        # 检查是否已存在同名分类（系统分类或用户分类）
        existing = Category.query.filter(
            Category.name == name,
            or_(
                Category.is_system == True,
                Category.user_id == user_id
            )
        ).first()

        if existing:
            if existing.is_system:
                return error_response('该分类已存在于系统分类中', 400)
            else:
                return error_response('您已创建过同名分类', 400)

        # 创建新分类
        category = Category(
            name=name,
            is_system=False,
            user_id=user_id
        )
        category.save()

        current_app.logger.info(f'User {user_id} created category: {name}')

        category_dict = category.to_dict()
        category_dict['type'] = 'custom'

        return created_response(category_dict, '分类创建成功')

    except Exception as e:
        current_app.logger.error(f'Create category error: {str(e)}')
        db.session.rollback()
        return error_response('创建分类失败', 500)


@blueprint.route('/categories/<int:category_id>', methods=['PUT'])
@jwt_required
def update_category(category_id):
    """更新用户自定义分类"""
    try:
        user_id = get_current_user_id()
        
        # 只能更新用户自己的分类
        category = Category.query.filter(
            Category.id == category_id,
            Category.user_id == user_id,
            Category.is_system == False
        ).first()

        if not category:
            return not_found_response('分类不存在或无权限修改')

        data = request.get_json()
        if not data or 'name' not in data:
            return error_response('请提供分类名称', 400)

        new_name = data['name'].strip()
        if not new_name:
            return error_response('分类名称不能为空', 400)

        if len(new_name) > 20:
            return error_response('分类名称不能超过20个字符', 400)

        # 如果名称没有改变，直接返回
        if new_name == category.name:
            category_dict = category.to_dict()
            category_dict['type'] = 'custom'
            return success_response(category_dict, '分类信息无变化')

        # 检查新名称是否已存在
        existing = Category.query.filter(
            Category.name == new_name,
            Category.id != category_id,
            or_(
                Category.is_system == True,
                Category.user_id == user_id
            )
        ).first()

        if existing:
            if existing.is_system:
                return error_response('该分类名称已存在于系统分类中', 400)
            else:
                return error_response('您已有同名分类', 400)

        # 更新分类
        old_name = category.name
        category.update(name=new_name)

        current_app.logger.info(f'User {user_id} updated category: {old_name} -> {new_name}')

        category_dict = category.to_dict()
        category_dict['type'] = 'custom'

        return success_response(category_dict, '分类更新成功')

    except Exception as e:
        current_app.logger.error(f'Update category error: {str(e)}')
        db.session.rollback()
        return error_response('更新分类失败', 500)


@blueprint.route('/categories/<int:category_id>', methods=['DELETE'])
@jwt_required
def delete_category(category_id):
    """删除用户自定义分类"""
    try:
        user_id = get_current_user_id()
        
        # 只能删除用户自己的分类
        category = Category.query.filter(
            Category.id == category_id,
            Category.user_id == user_id,
            Category.is_system == False
        ).first()

        if not category:
            return not_found_response('分类不存在或无权限删除')

        # 检查是否有食物使用此分类
        from foodback.models import Food
        food_count = Food.query.filter(
            Food.category_id == category_id,
            Food.user_id == user_id
        ).count()

        if food_count > 0:
            return error_response(f'该分类下还有{food_count}个食物，请先移动或删除这些食物', 400)

        # 删除分类
        category_name = category.name
        category.delete()

        current_app.logger.info(f'User {user_id} deleted category: {category_name}')

        return success_response(None, '分类删除成功')

    except Exception as e:
        current_app.logger.error(f'Delete category error: {str(e)}')
        db.session.rollback()
        return error_response('删除分类失败', 500)


@blueprint.route('/categories/system', methods=['GET'])
def get_system_categories():
    """获取系统预置分类"""
    try:
        # 从数据库获取系统分类
        system_categories = Category.query.filter(
            Category.is_system == True
        ).order_by(Category.created_at.asc()).all()

        categories_data = []
        for category in system_categories:
            category_dict = category.to_dict()
            category_dict['type'] = 'system'
            categories_data.append(category_dict)

        return success_response(categories_data, '获取系统分类成功')

    except Exception as e:
        current_app.logger.error(f'Get system categories error: {str(e)}')
        return error_response('获取系统分类失败', 500)


@blueprint.route('/categories/stats', methods=['GET'])
@jwt_required
def get_category_stats():
    """获取分类统计信息"""
    try:
        user_id = get_current_user_id()
        
        # 获取用户的所有分类（包括系统分类和自定义分类）
        categories = Category.query.filter(
            or_(
                Category.is_system == True,
                Category.user_id == user_id
            )
        ).all()

        # 统计每个分类下的食物数量
        from foodback.models import Food
        from sqlalchemy import func
        
        category_stats = db.session.query(
            Category.id,
            Category.name,
            Category.is_system,
            func.count(Food.id).label('food_count')
        ).outerjoin(
            Food, 
            (Food.category_id == Category.id) & (Food.user_id == user_id)
        ).filter(
            or_(
                Category.is_system == True,
                Category.user_id == user_id
            )
        ).group_by(Category.id).all()

        # 转换为字典格式
        stats_data = []
        for stat in category_stats:
            stats_data.append({
                'id': stat.id,
                'name': stat.name,
                'type': 'system' if stat.is_system else 'custom',
                'food_count': stat.food_count,
                'is_system': stat.is_system
            })

        # 按食物数量排序
        stats_data.sort(key=lambda x: x['food_count'], reverse=True)

        return success_response(stats_data, '获取分类统计成功')

    except Exception as e:
        current_app.logger.error(f'Get category stats error: {str(e)}')
        return error_response('获取分类统计失败', 500)


@blueprint.route('/categories/check-name', methods=['POST'])
@jwt_required
def check_category_name():
    """检查分类名称是否可用"""
    try:
        user_id = get_current_user_id()
        data = request.get_json()
        
        if not data or 'name' not in data:
            return error_response('请提供分类名称', 400)

        name = data['name'].strip()
        if not name:
            return error_response('分类名称不能为空', 400)

        # 检查是否已存在
        existing = Category.query.filter(
            Category.name == name,
            or_(
                Category.is_system == True,
                Category.user_id == user_id
            )
        ).first()

        if existing:
            conflict_type = 'system' if existing.is_system else 'custom'
            message = '该分类已存在于系统分类中' if existing.is_system else '您已创建过同名分类'
            
            return success_response({
                'available': False,
                'conflict_type': conflict_type,
                'message': message
            })
        else:
            return success_response({
                'available': True,
                'message': '该分类名称可以使用'
            })

    except Exception as e:
        current_app.logger.error(f'Check category name error: {str(e)}')
        return error_response('检查分类名称失败', 500)