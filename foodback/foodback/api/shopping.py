# -*- coding: utf-8 -*-
"""购物清单API"""

from flask import Blueprint, request, current_app

from foodback.extensions import db
from foodback.models import ShoppingListItem
from foodback.auth.decorators import jwt_required, get_current_user_id
from foodback.utils.response_utils import (
    success_response, error_response, validation_error_response,
    created_response, not_found_response
)

blueprint = Blueprint('shopping', __name__, url_prefix='/shopping-list')


@blueprint.route('', methods=['GET'])
@jwt_required
def get_shopping_list():
    """获取购物清单"""
    try:
        user_id = get_current_user_id()
        
        # 获取排序参数
        sort_by = request.args.get('sort_by', 'created_at')  # created_at, is_checked
        sort_order = request.args.get('sort_order', 'desc')  # asc, desc
        
        # 获取筛选参数
        show_checked = request.args.get('show_checked', 'true').lower() == 'true'
        
        # 构建查询
        query = ShoppingListItem.query.filter(
            ShoppingListItem.user_id == user_id
        )
        
        # 应用筛选
        if not show_checked:
            query = query.filter(ShoppingListItem.is_checked == False)
        
        # 应用排序
        if sort_by == 'is_checked':
            if sort_order == 'desc':
                query = query.order_by(ShoppingListItem.is_checked.desc())
            else:
                query = query.order_by(ShoppingListItem.is_checked.asc())
        else:  # 默认按创建时间排序
            if sort_order == 'desc':
                query = query.order_by(ShoppingListItem.created_at.desc())
            else:
                query = query.order_by(ShoppingListItem.created_at.asc())
        
        # 添加次要排序条件
        query = query.order_by(ShoppingListItem.created_at.desc())
        
        items = query.all()
        items_data = [item.to_dict() for item in items]

        # 统计信息
        total_count = len(items_data)
        checked_count = sum(1 for item in items_data if item['is_checked'])
        unchecked_count = total_count - checked_count

        return success_response({
            'items': items_data,
            'stats': {
                'total': total_count,
                'checked': checked_count,
                'unchecked': unchecked_count
            }
        }, '获取购物清单成功')

    except Exception as e:
        current_app.logger.error(f'Get shopping list error: {str(e)}')
        return error_response('获取购物清单失败', 500)


@blueprint.route('/items', methods=['POST'])
@jwt_required
def add_shopping_item():
    """添加购物清单项"""
    try:
        user_id = get_current_user_id()
        data = request.get_json()
        
        if not data or 'item_name' not in data:
            return error_response('请提供购物项名称', 400)

        item_name = data['item_name'].strip()
        if not item_name:
            return error_response('购物项名称不能为空', 400)

        if len(item_name) > 50:
            return error_response('购物项名称不能超过50个字符', 400)

        # 检查是否已存在相同的未勾选项目
        existing = ShoppingListItem.query.filter(
            ShoppingListItem.user_id == user_id,
            ShoppingListItem.item_name == item_name,
            ShoppingListItem.is_checked == False
        ).first()

        if existing:
            return error_response('购物清单中已有相同的未完成项目', 400)

        # 创建购物项
        shopping_item = ShoppingListItem(
            user_id=user_id,
            item_name=item_name,
            created_from_food_id=data.get('created_from_food_id'),
            is_checked=False
        )
        shopping_item.save()

        current_app.logger.info(f'User {user_id} added shopping item: {item_name}')

        return created_response(shopping_item.to_dict(), '添加购物项成功')

    except Exception as e:
        current_app.logger.error(f'Add shopping item error: {str(e)}')
        db.session.rollback()
        return error_response('添加购物项失败', 500)


@blueprint.route('/items/<int:item_id>', methods=['PUT'])
@jwt_required
def update_shopping_item(item_id):
    """更新购物清单项"""
    try:
        user_id = get_current_user_id()
        
        # 只能更新用户自己的购物项
        item = ShoppingListItem.query.filter(
            ShoppingListItem.id == item_id,
            ShoppingListItem.user_id == user_id
        ).first()

        if not item:
            return not_found_response('购物项不存在或无权限修改')

        data = request.get_json()
        if not data:
            return error_response('请提供更新数据', 400)

        # 更新项目名称
        if 'item_name' in data:
            new_name = data['item_name'].strip()
            if not new_name:
                return error_response('购物项名称不能为空', 400)
            
            if len(new_name) > 50:
                return error_response('购物项名称不能超过50个字符', 400)
            
            # 如果名称改变，检查是否与其他未勾选项目重复
            if new_name != item.item_name:
                existing = ShoppingListItem.query.filter(
                    ShoppingListItem.user_id == user_id,
                    ShoppingListItem.item_name == new_name,
                    ShoppingListItem.is_checked == False,
                    ShoppingListItem.id != item_id
                ).first()
                
                if existing:
                    return error_response('购物清单中已有相同的未完成项目', 400)
            
            item.item_name = new_name

        # 更新勾选状态
        if 'is_checked' in data:
            item.is_checked = bool(data['is_checked'])

        item.save()

        current_app.logger.info(f'User {user_id} updated shopping item {item_id}')

        return success_response(item.to_dict(), '购物项更新成功')

    except Exception as e:
        current_app.logger.error(f'Update shopping item error: {str(e)}')
        db.session.rollback()
        return error_response('更新购物项失败', 500)


@blueprint.route('/items/<int:item_id>', methods=['DELETE'])
@jwt_required
def delete_shopping_item(item_id):
    """删除购物清单项"""
    try:
        user_id = get_current_user_id()
        
        # 只能删除用户自己的购物项
        item = ShoppingListItem.query.filter(
            ShoppingListItem.id == item_id,
            ShoppingListItem.user_id == user_id
        ).first()

        if not item:
            return not_found_response('购物项不存在或无权限删除')

        item_name = item.item_name
        item.delete()

        current_app.logger.info(f'User {user_id} deleted shopping item: {item_name}')

        return success_response(None, '购物项删除成功')

    except Exception as e:
        current_app.logger.error(f'Delete shopping item error: {str(e)}')
        db.session.rollback()
        return error_response('删除购物项失败', 500)


@blueprint.route('/items/batch', methods=['PATCH'])
@jwt_required
def batch_update_items():
    """批量更新购物清单项"""
    try:
        user_id = get_current_user_id()
        data = request.get_json()
        
        if not data:
            return error_response('请提供更新数据', 400)

        updates = data.get('updates', [])
        deletions = data.get('deletions', [])
        
        if not updates and not deletions:
            return error_response('没有提供任何操作', 400)

        # 批量更新
        updated_count = 0
        if updates:
            for update_item in updates:
                item_id = update_item.get('id')
                if not item_id:
                    continue
                
                item = ShoppingListItem.query.filter(
                    ShoppingListItem.id == item_id,
                    ShoppingListItem.user_id == user_id
                ).first()
                
                if item:
                    if 'is_checked' in update_item:
                        item.is_checked = bool(update_item['is_checked'])
                    if 'item_name' in update_item:
                        new_name = update_item['item_name'].strip()
                        if new_name and len(new_name) <= 50:
                            item.item_name = new_name
                    
                    item.save(commit=False)
                    updated_count += 1

        # 批量删除
        deleted_count = 0
        if deletions:
            for item_id in deletions:
                item = ShoppingListItem.query.filter(
                    ShoppingListItem.id == item_id,
                    ShoppingListItem.user_id == user_id
                ).first()
                
                if item:
                    item.delete(commit=False)
                    deleted_count += 1

        # 提交所有更改
        db.session.commit()

        current_app.logger.info(f'User {user_id} batch updated {updated_count} items, deleted {deleted_count} items')

        return success_response({
            'updated_count': updated_count,
            'deleted_count': deleted_count
        }, f'批量操作完成：更新{updated_count}项，删除{deleted_count}项')

    except Exception as e:
        current_app.logger.error(f'Batch update shopping items error: {str(e)}')
        db.session.rollback()
        return error_response('批量操作失败', 500)


@blueprint.route('/clear-checked', methods=['DELETE'])
@jwt_required
def clear_checked_items():
    """清除已勾选的购物项"""
    try:
        user_id = get_current_user_id()
        
        # 查找所有已勾选的项目
        checked_items = ShoppingListItem.query.filter(
            ShoppingListItem.user_id == user_id,
            ShoppingListItem.is_checked == True
        ).all()

        if not checked_items:
            return success_response({'deleted_count': 0}, '没有已勾选的项目需要清除')

        # 删除所有已勾选的项目
        deleted_count = len(checked_items)
        for item in checked_items:
            item.delete(commit=False)

        db.session.commit()

        current_app.logger.info(f'User {user_id} cleared {deleted_count} checked items')

        return success_response({
            'deleted_count': deleted_count
        }, f'已清除{deleted_count}个已勾选项目')

    except Exception as e:
        current_app.logger.error(f'Clear checked items error: {str(e)}')
        db.session.rollback()
        return error_response('清除已勾选项目失败', 500)


@blueprint.route('/toggle-all', methods=['PATCH'])
@jwt_required
def toggle_all_items():
    """全选/取消全选购物项"""
    try:
        user_id = get_current_user_id()
        data = request.get_json()
        
        if not data or 'is_checked' not in data:
            return error_response('请提供勾选状态', 400)

        is_checked = bool(data['is_checked'])
        
        # 更新所有购物项的勾选状态
        items = ShoppingListItem.query.filter(
            ShoppingListItem.user_id == user_id
        ).all()

        updated_count = 0
        for item in items:
            if item.is_checked != is_checked:
                item.is_checked = is_checked
                item.save(commit=False)
                updated_count += 1

        db.session.commit()

        action = '全选' if is_checked else '取消全选'
        current_app.logger.info(f'User {user_id} {action} {updated_count} shopping items')

        return success_response({
            'updated_count': updated_count,
            'is_checked': is_checked
        }, f'{action}操作完成，更新了{updated_count}个项目')

    except Exception as e:
        current_app.logger.error(f'Toggle all items error: {str(e)}')
        db.session.rollback()
        return error_response('全选/取消全选操作失败', 500)


@blueprint.route('/stats', methods=['GET'])
@jwt_required
def get_shopping_stats():
    """获取购物清单统计信息"""
    try:
        user_id = get_current_user_id()
        
        # 获取统计数据
        from sqlalchemy import func
        
        stats = db.session.query(
            func.count(ShoppingListItem.id).label('total'),
            func.sum(ShoppingListItem.is_checked.cast(db.Integer)).label('checked'),
            func.sum((~ShoppingListItem.is_checked).cast(db.Integer)).label('unchecked')
        ).filter(
            ShoppingListItem.user_id == user_id
        ).first()

        total = stats.total or 0
        checked = stats.checked or 0
        unchecked = stats.unchecked or 0

        # 计算完成率
        completion_rate = round((checked / total * 100), 1) if total > 0 else 0

        return success_response({
            'total': total,
            'checked': checked,
            'unchecked': unchecked,
            'completion_rate': completion_rate
        }, '获取购物清单统计成功')

    except Exception as e:
        current_app.logger.error(f'Get shopping stats error: {str(e)}')
        return error_response('获取购物清单统计失败', 500)