# -*- coding: utf-8 -*-
"""位置管理API"""

from flask import Blueprint, request, current_app

from foodback.extensions import db
from foodback.models import Location
from foodback.auth.decorators import jwt_required, get_current_user_id
from foodback.utils.response_utils import (
    success_response, error_response, validation_error_response,
    created_response, not_found_response
)

blueprint = Blueprint('locations', __name__)


@blueprint.route('/locations', methods=['GET'])
@jwt_required
def get_locations():
    """获取用户的存放位置列表"""
    try:
        user_id = get_current_user_id()
        
        locations = Location.query.filter(
            Location.user_id == user_id
        ).order_by(Location.created_at.asc()).all()

        locations_data = [location.to_dict() for location in locations]

        return success_response(locations_data, '获取位置列表成功')

    except Exception as e:
        current_app.logger.error(f'Get locations error: {str(e)}')
        return error_response('获取位置列表失败', 500)


@blueprint.route('/locations', methods=['POST'])
@jwt_required
def create_location():
    """创建新的存放位置"""
    try:
        user_id = get_current_user_id()
        data = request.get_json()
        
        if not data or 'name' not in data:
            return error_response('请提供位置名称', 400)

        name = data['name'].strip()
        if not name:
            return error_response('位置名称不能为空', 400)

        if len(name) > 30:
            return error_response('位置名称不能超过30个字符', 400)

        # 检查是否已存在同名位置
        existing = Location.query.filter(
            Location.name == name,
            Location.user_id == user_id
        ).first()

        if existing:
            return error_response('您已创建过同名位置', 400)

        # 创建新位置
        location = Location(
            name=name,
            user_id=user_id
        )
        location.save()

        current_app.logger.info(f'User {user_id} created location: {name}')

        return created_response(location.to_dict(), '位置创建成功')

    except Exception as e:
        current_app.logger.error(f'Create location error: {str(e)}')
        db.session.rollback()
        return error_response('创建位置失败', 500)


@blueprint.route('/locations/<int:location_id>', methods=['PUT'])
@jwt_required
def update_location(location_id):
    """更新存放位置"""
    try:
        user_id = get_current_user_id()
        
        # 只能更新用户自己的位置
        location = Location.query.filter(
            Location.id == location_id,
            Location.user_id == user_id
        ).first()

        if not location:
            return not_found_response('位置不存在或无权限修改')

        data = request.get_json()
        if not data or 'name' not in data:
            return error_response('请提供位置名称', 400)

        new_name = data['name'].strip()
        if not new_name:
            return error_response('位置名称不能为空', 400)

        if len(new_name) > 30:
            return error_response('位置名称不能超过30个字符', 400)

        # 如果名称没有改变，直接返回
        if new_name == location.name:
            return success_response(location.to_dict(), '位置信息无变化')

        # 检查新名称是否已存在
        existing = Location.query.filter(
            Location.name == new_name,
            Location.user_id == user_id,
            Location.id != location_id
        ).first()

        if existing:
            return error_response('您已有同名位置', 400)

        # 更新位置
        old_name = location.name
        location.update(name=new_name)

        current_app.logger.info(f'User {user_id} updated location: {old_name} -> {new_name}')

        return success_response(location.to_dict(), '位置更新成功')

    except Exception as e:
        current_app.logger.error(f'Update location error: {str(e)}')
        db.session.rollback()
        return error_response('更新位置失败', 500)


@blueprint.route('/locations/<int:location_id>', methods=['DELETE'])
@jwt_required
def delete_location(location_id):
    """删除存放位置"""
    try:
        user_id = get_current_user_id()
        
        # 只能删除用户自己的位置
        location = Location.query.filter(
            Location.id == location_id,
            Location.user_id == user_id
        ).first()

        if not location:
            return not_found_response('位置不存在或无权限删除')

        # 检查是否有食物使用此位置
        from foodback.models import Food
        food_count = Food.query.filter(
            Food.location_id == location_id,
            Food.user_id == user_id
        ).count()

        if food_count > 0:
            return error_response(f'该位置下还有{food_count}个食物，请先移动或删除这些食物', 400)

        # 删除位置
        location_name = location.name
        location.delete()

        current_app.logger.info(f'User {user_id} deleted location: {location_name}')

        return success_response(None, '位置删除成功')

    except Exception as e:
        current_app.logger.error(f'Delete location error: {str(e)}')
        db.session.rollback()
        return error_response('删除位置失败', 500)


@blueprint.route('/locations/stats', methods=['GET'])
@jwt_required
def get_location_stats():
    """获取位置统计信息"""
    try:
        user_id = get_current_user_id()
        
        # 统计每个位置下的食物数量
        from foodback.models import Food
        from sqlalchemy import func
        
        location_stats = db.session.query(
            Location.id,
            Location.name,
            func.count(Food.id).label('food_count')
        ).outerjoin(
            Food, 
            (Food.location_id == Location.id) & (Food.user_id == user_id)
        ).filter(
            Location.user_id == user_id
        ).group_by(Location.id).all()

        # 转换为字典格式
        stats_data = []
        for stat in location_stats:
            stats_data.append({
                'id': stat.id,
                'name': stat.name,
                'food_count': stat.food_count
            })

        # 按食物数量排序
        stats_data.sort(key=lambda x: x['food_count'], reverse=True)

        return success_response(stats_data, '获取位置统计成功')

    except Exception as e:
        current_app.logger.error(f'Get location stats error: {str(e)}')
        return error_response('获取位置统计失败', 500)


@blueprint.route('/locations/check-name', methods=['POST'])
@jwt_required
def check_location_name():
    """检查位置名称是否可用"""
    try:
        user_id = get_current_user_id()
        data = request.get_json()
        
        if not data or 'name' not in data:
            return error_response('请提供位置名称', 400)

        name = data['name'].strip()
        if not name:
            return error_response('位置名称不能为空', 400)

        # 检查是否已存在
        existing = Location.query.filter(
            Location.name == name,
            Location.user_id == user_id
        ).first()

        if existing:
            return success_response({
                'available': False,
                'message': '您已创建过同名位置'
            })
        else:
            return success_response({
                'available': True,
                'message': '该位置名称可以使用'
            })

    except Exception as e:
        current_app.logger.error(f'Check location name error: {str(e)}')
        return error_response('检查位置名称失败', 500)


@blueprint.route('/locations/default', methods=['GET'])
@jwt_required
def get_default_locations():
    """获取默认位置建议"""
    try:
        # 常用的存放位置建议
        default_locations = [
            '冰箱冷藏室',
            '冰箱冷冻室',
            '厨房储物柜',
            '阳台储物间',
            '客厅储物柜',
            '卧室衣柜',
            '车库储物间',
            '地下室',
            '办公室',
            '冰箱门架'
        ]

        return success_response(default_locations, '获取默认位置建议成功')

    except Exception as e:
        current_app.logger.error(f'Get default locations error: {str(e)}')
        return error_response('获取默认位置建议失败', 500)