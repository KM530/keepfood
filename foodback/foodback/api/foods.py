# -*- coding: utf-8 -*-
"""食物管理API"""

import os
from datetime import date, datetime
from flask import Blueprint, request, current_app

from foodback.extensions import db
from foodback.models import Food, Category, Location
from foodback.auth.decorators import jwt_required, get_current_user_id
from foodback.utils.response_utils import (
    success_response, error_response, validation_error_response,
    created_response, not_found_response
)
from foodback.utils.file_utils import save_uploaded_image, delete_file, get_file_url
from foodback.utils.model_utils import calculate_expiry_date, get_food_status_display
from foodback.utils.query_utils import apply_filters, apply_sorting, search_foods_by_expiry_status

blueprint = Blueprint('foods', __name__)


@blueprint.route('/foods', methods=['GET'])
@jwt_required
def get_foods():
    """获取食物列表（支持分页、排序、筛选）"""
    try:
        user_id = get_current_user_id()
        
        # 获取查询参数
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        sort_by = request.args.get('sort_by', 'expiry_date')
        sort_order = request.args.get('sort_order', 'asc')
        
        # 筛选参数
        category_id = request.args.get('category_id', type=int)
        location_id = request.args.get('location_id', type=int)
        status = request.args.get('status')  # normal, expiring_soon, expired
        search = request.args.get('search', '').strip()
        
        # 构建基础查询
        query = Food.query.filter(
            Food.user_id == user_id,
            Food.is_deleted == False
        )
        
        # 应用搜索
        if search:
            query = query.filter(
                Food.name.contains(search)
            )
        
        # 应用筛选
        filters = {}
        if category_id:
            filters['category_id'] = category_id
        if location_id:
            filters['location_id'] = location_id
        
        query = apply_filters(query, Food, filters)
        
        # 状态筛选（需要特殊处理）
        if status:
            if status == 'expired':
                query = query.filter(Food.expiry_date < date.today())
            elif status == 'expiring_soon':
                from datetime import timedelta
                cutoff_date = date.today() + timedelta(days=3)
                query = query.filter(
                    Food.expiry_date >= date.today(),
                    Food.expiry_date <= cutoff_date
                )
            elif status == 'normal':
                from datetime import timedelta
                cutoff_date = date.today() + timedelta(days=3)
                query = query.filter(Food.expiry_date > cutoff_date)
        
        # 应用排序
        query = apply_sorting(query, Food, sort_by, sort_order)
        
        # 分页
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        # 转换数据格式
        foods_data = []
        for food in pagination.items:
            food_dict = food.to_dict()
            
            # 添加关联数据
            if food.category:
                food_dict['category_name'] = food.category.name
            if food.location:
                food_dict['location_name'] = food.location.name
            
            # 添加状态信息
            food_dict['status_display'] = get_food_status_display(food.expiry_date)
            
            # 处理图片URL
            if food_dict.get('image_url'):
                if isinstance(food_dict['image_url'], list):
                    food_dict['image_url'] = [
                        get_file_url(img, 'foods') for img in food_dict['image_url']
                    ]
                else:
                    food_dict['image_url'] = get_file_url(food_dict['image_url'], 'foods')
            
            foods_data.append(food_dict)
        
        # 构建分页响应
        return success_response({
            'items': foods_data,
            'total': pagination.total,
            'page': pagination.page,
            'per_page': pagination.per_page,
            'pages': pagination.pages,
            'has_prev': pagination.has_prev,
            'has_next': pagination.has_next,
            'prev_num': pagination.prev_num,
            'next_num': pagination.next_num
        }, '获取食物列表成功')

    except Exception as e:
        current_app.logger.error(f'Get foods error: {str(e)}')
        return error_response('获取食物列表失败', 500)


@blueprint.route('/foods/<int:food_id>', methods=['GET'])
@jwt_required
def get_food(food_id):
    """获取单个食物详情"""
    try:
        user_id = get_current_user_id()
        
        food = Food.query.filter(
            Food.id == food_id,
            Food.user_id == user_id,
            Food.is_deleted == False
        ).first()
        
        if not food:
            return not_found_response('食物不存在')
        
        food_dict = food.to_dict()
        
        # 添加关联数据
        if food.category:
            food_dict['category'] = food.category.to_dict()
        if food.location:
            food_dict['location'] = food.location.to_dict()
        
        # 添加状态信息
        food_dict['status_display'] = get_food_status_display(food.expiry_date)
        
        # 处理图片URL
        if food_dict.get('image_url'):
            if isinstance(food_dict['image_url'], list):
                food_dict['image_url'] = [
                    get_file_url(img, 'foods') for img in food_dict['image_url']
                ]
            else:
                food_dict['image_url'] = get_file_url(food_dict['image_url'], 'foods')
        
        return success_response(food_dict, '获取食物详情成功')

    except Exception as e:
        current_app.logger.error(f'Get food error: {str(e)}')
        return error_response('获取食物详情失败', 500)


@blueprint.route('/foods', methods=['POST'])
@jwt_required
def create_food():
    """创建新食物"""
    try:
        user_id = get_current_user_id()
        
        # 处理表单数据（支持文件上传）
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form.to_dict()
            images = request.files.getlist('images')
        else:
            data = request.get_json() or {}
            images = []
        
        # 验证必填字段
        required_fields = ['name', 'quantity', 'unit', 'category_id', 'expiry_date']
        for field in required_fields:
            if field not in data or not str(data[field]).strip():
                return error_response(f'请提供{field}', 400)
        
        # 数据类型转换和验证
        try:
            name = data['name'].strip()
            quantity = float(data['quantity'])
            unit = data['unit'].strip()
            category_id = int(data['category_id'])
            expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
            
            # 可选字段
            location_id = int(data['location_id']) if data.get('location_id') else None
            production_date = datetime.strptime(data['production_date'], '%Y-%m-%d').date() if data.get('production_date') else None
            shelf_life_value = int(data['shelf_life_value']) if data.get('shelf_life_value') else None
            shelf_life_unit = data.get('shelf_life_unit')
            ingredients_text = data.get('ingredients_text', '').strip()
            calories_kcal = float(data['calories_kcal']) if data.get('calories_kcal') else None
            energy_offset_info = data.get('energy_offset_info', '').strip()
            
            # 处理有害成分JSON数据
            harmful_ingredients_json = None
            if data.get('harmful_ingredients'):
                try:
                    if isinstance(data['harmful_ingredients'], str):
                        import json
                        harmful_ingredients_json = json.loads(data['harmful_ingredients'])
                    elif isinstance(data['harmful_ingredients'], list):
                        harmful_ingredients_json = data['harmful_ingredients']
                except (json.JSONDecodeError, TypeError):
                    harmful_ingredients_json = None
            
        except (ValueError, TypeError) as e:
            return error_response(f'数据格式错误: {str(e)}', 400)
        
        # 业务逻辑验证
        if quantity <= 0:
            return error_response('数量必须大于0', 400)
        
        if len(name) > 50:
            return error_response('食物名称不能超过50个字符', 400)
        
        if expiry_date < date.today():
            return error_response('过期日期不能早于今天', 400)
        
        # 验证分类是否存在且用户有权限使用
        category = Category.query.filter(
            Category.id == category_id,
            (Category.is_system == True) | (Category.user_id == user_id)
        ).first()
        
        if not category:
            return error_response('分类不存在或无权限使用', 400)
        
        # 验证位置是否存在且属于用户
        if location_id:
            location = Location.query.filter(
                Location.id == location_id,
                Location.user_id == user_id
            ).first()
            
            if not location:
                return error_response('存放位置不存在或无权限使用', 400)
        
        # 处理图片上传
        image_urls = []
        if images:
            upload_folder = os.path.join(current_app.root_path, 'static', 'uploads', 'foods')
            
            for image in images:
                if image and image.filename:
                    success, message, filename = save_uploaded_image(
                        image,
                        upload_folder,
                        max_size=(800, 600)
                    )
                    
                    if success:
                        image_urls.append(filename)
                    else:
                        # 清理已上传的文件
                        for uploaded_file in image_urls:
                            delete_file(os.path.join(upload_folder, uploaded_file))
                        return error_response(f'图片上传失败: {message}', 400)
        
        # 创建食物记录
        food = Food(
            user_id=user_id,
            name=name,
            quantity=quantity,
            unit=unit,
            category_id=category_id,
            location_id=location_id,
            production_date=production_date,
            shelf_life_value=shelf_life_value,
            shelf_life_unit=shelf_life_unit,
            expiry_date=expiry_date,
            ingredients_text=ingredients_text,
            harmful_ingredients_json=harmful_ingredients_json,
            calories_kcal=calories_kcal,
            energy_offset_info=energy_offset_info,
            image_url=image_urls if image_urls else None
        )
        
        food.save()
        
        current_app.logger.info(f'User {user_id} created food: {name}')
        
        # 返回创建的食物信息
        food_dict = food.to_dict()
        if food.category:
            food_dict['category_name'] = food.category.name
        if food.location:
            food_dict['location_name'] = food.location.name
        
        food_dict['status_display'] = get_food_status_display(food.expiry_date)
        
        # 处理图片URL
        if food_dict.get('image_url'):
            if isinstance(food_dict['image_url'], list):
                food_dict['image_url'] = [
                    get_file_url(img, 'foods') for img in food_dict['image_url']
                ]
        
        return created_response(food_dict, '食物添加成功')

    except Exception as e:
        current_app.logger.error(f'Create food error: {str(e)}')
        db.session.rollback()
        return error_response('添加食物失败', 500)


@blueprint.route('/foods/<int:food_id>', methods=['PUT'])
@jwt_required
def update_food(food_id):
    """更新食物信息"""
    try:
        user_id = get_current_user_id()
        
        # 查找食物
        food = Food.query.filter(
            Food.id == food_id,
            Food.user_id == user_id,
            Food.is_deleted == False
        ).first()
        
        if not food:
            return not_found_response('食物不存在')
        
        # 处理表单数据
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form.to_dict()
            new_images = request.files.getlist('images')
        else:
            data = request.get_json() or {}
            new_images = []
        
        # 更新字段
        update_data = {}
        
        if 'name' in data:
            name = data['name'].strip()
            if not name:
                return error_response('食物名称不能为空', 400)
            if len(name) > 50:
                return error_response('食物名称不能超过50个字符', 400)
            update_data['name'] = name
        
        if 'quantity' in data:
            try:
                quantity = float(data['quantity'])
                if quantity <= 0:
                    return error_response('数量必须大于0', 400)
                update_data['quantity'] = quantity
            except ValueError:
                return error_response('数量格式错误', 400)
        
        if 'unit' in data:
            unit = data['unit'].strip()
            if unit:
                update_data['unit'] = unit
        
        if 'category_id' in data:
            try:
                category_id = int(data['category_id'])
                category = Category.query.filter(
                    Category.id == category_id,
                    (Category.is_system == True) | (Category.user_id == user_id)
                ).first()
                
                if not category:
                    return error_response('分类不存在或无权限使用', 400)
                
                update_data['category_id'] = category_id
            except ValueError:
                return error_response('分类ID格式错误', 400)
        
        if 'location_id' in data:
            if data['location_id']:
                try:
                    location_id = int(data['location_id'])
                    location = Location.query.filter(
                        Location.id == location_id,
                        Location.user_id == user_id
                    ).first()
                    
                    if not location:
                        return error_response('存放位置不存在或无权限使用', 400)
                    
                    update_data['location_id'] = location_id
                except ValueError:
                    return error_response('位置ID格式错误', 400)
            else:
                update_data['location_id'] = None
        
        if 'expiry_date' in data:
            try:
                expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
                if expiry_date < date.today():
                    return error_response('过期日期不能早于今天', 400)
                update_data['expiry_date'] = expiry_date
            except ValueError:
                return error_response('过期日期格式错误', 400)
        
        if 'production_date' in data:
            if data['production_date']:
                try:
                    update_data['production_date'] = datetime.strptime(data['production_date'], '%Y-%m-%d').date()
                except ValueError:
                    return error_response('生产日期格式错误', 400)
            else:
                update_data['production_date'] = None
        
        if 'shelf_life_value' in data:
            if data['shelf_life_value']:
                try:
                    update_data['shelf_life_value'] = int(data['shelf_life_value'])
                except ValueError:
                    return error_response('保质期数值格式错误', 400)
            else:
                update_data['shelf_life_value'] = None
        
        if 'shelf_life_unit' in data:
            update_data['shelf_life_unit'] = data['shelf_life_unit'] if data['shelf_life_unit'] else None
        
        if 'ingredients_text' in data:
            update_data['ingredients_text'] = data['ingredients_text'].strip()
        
        if 'calories_kcal' in data:
            if data['calories_kcal']:
                try:
                    update_data['calories_kcal'] = float(data['calories_kcal'])
                except ValueError:
                    return error_response('卡路里格式错误', 400)
            else:
                update_data['calories_kcal'] = None
        
        # 处理图片更新
        if new_images:
            # 删除旧图片
            if food.image_url:
                upload_folder = os.path.join(current_app.root_path, 'static', 'uploads', 'foods')
                old_images = food.image_url if isinstance(food.image_url, list) else [food.image_url]
                
                for old_image in old_images:
                    if old_image:
                        delete_file(os.path.join(upload_folder, old_image))
            
            # 上传新图片
            image_urls = []
            upload_folder = os.path.join(current_app.root_path, 'static', 'uploads', 'foods')
            
            for image in new_images:
                if image and image.filename:
                    success, message, filename = save_uploaded_image(
                        image,
                        upload_folder,
                        max_size=(800, 600)
                    )
                    
                    if success:
                        image_urls.append(filename)
                    else:
                        # 清理已上传的文件
                        for uploaded_file in image_urls:
                            delete_file(os.path.join(upload_folder, uploaded_file))
                        return error_response(f'图片上传失败: {message}', 400)
            
            update_data['image_url'] = image_urls if image_urls else None
        
        # 更新食物
        if update_data:
            food.update(**update_data)
            
            current_app.logger.info(f'User {user_id} updated food {food_id}')
        
        # 返回更新后的食物信息
        food_dict = food.to_dict()
        if food.category:
            food_dict['category_name'] = food.category.name
        if food.location:
            food_dict['location_name'] = food.location.name
        
        food_dict['status_display'] = get_food_status_display(food.expiry_date)
        
        # 处理图片URL
        if food_dict.get('image_url'):
            if isinstance(food_dict['image_url'], list):
                food_dict['image_url'] = [
                    get_file_url(img, 'foods') for img in food_dict['image_url']
                ]
        
        return success_response(food_dict, '食物更新成功')

    except Exception as e:
        current_app.logger.error(f'Update food error: {str(e)}')
        db.session.rollback()
        return error_response('更新食物失败', 500)


@blueprint.route('/foods/<int:food_id>', methods=['DELETE'])
@jwt_required
def delete_food(food_id):
    """删除食物（软删除）"""
    try:
        user_id = get_current_user_id()
        
        food = Food.query.filter(
            Food.id == food_id,
            Food.user_id == user_id,
            Food.is_deleted == False
        ).first()
        
        if not food:
            return not_found_response('食物不存在')
        
        # 软删除
        food.soft_delete()
        
        current_app.logger.info(f'User {user_id} deleted food: {food.name}')
        
        return success_response(None, '食物删除成功')

    except Exception as e:
        current_app.logger.error(f'Delete food error: {str(e)}')
        db.session.rollback()
        return error_response('删除食物失败', 500)


@blueprint.route('/foods/<int:food_id>/consume', methods=['POST'])
@jwt_required
def consume_food(food_id):
    """消耗食物（减少数量）"""
    try:
        user_id = get_current_user_id()
        
        food = Food.query.filter(
            Food.id == food_id,
            Food.user_id == user_id,
            Food.is_deleted == False
        ).first()
        
        if not food:
            return not_found_response('食物不存在')
        
        data = request.get_json()
        if not data or 'quantity' not in data:
            return error_response('请提供消耗数量', 400)
        
        try:
            consume_quantity = float(data['quantity'])
        except ValueError:
            return error_response('消耗数量格式错误', 400)
        
        if consume_quantity <= 0:
            return error_response('消耗数量必须大于0', 400)
        
        if consume_quantity > food.quantity:
            return error_response('消耗数量不能超过现有数量', 400)
        
        # 更新数量
        new_quantity = food.quantity - consume_quantity
        food.update(quantity=new_quantity)
        
        # 如果数量为0，可以选择软删除或保留
        if new_quantity == 0:
            # 这里选择保留，让用户手动删除
            pass
        
        current_app.logger.info(f'User {user_id} consumed {consume_quantity} {food.unit} of {food.name}')
        
        return success_response({
            'id': food.id,
            'remaining_quantity': new_quantity,
            'consumed_quantity': consume_quantity,
            'unit': food.unit
        }, f'已消耗{consume_quantity}{food.unit}，剩余{new_quantity}{food.unit}')

    except Exception as e:
        current_app.logger.error(f'Consume food error: {str(e)}')
        db.session.rollback()
        return error_response('消耗食物失败', 500)