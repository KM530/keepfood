"""推送通知相关API"""
from flask import Blueprint, request, jsonify
from typing import Dict, List, Any, Optional
import json
from datetime import datetime, timedelta

from ..utils.response_utils import success_response, error_response, validation_error_response
from ..auth.decorators import jwt_required
from ..models import PushToken, Food
from ..database import db

bp = Blueprint('push', __name__, url_prefix='/api/push')


@bp.route('/register-token', methods=['POST'])
@jwt_required
def register_push_token():
    """注册推送令牌"""
    current_user = request.current_user
    data = request.get_json()
    
    if not data:
        return validation_error_response('请提供推送令牌数据')
    
    token = data.get('token', '').strip()
    device_type = data.get('device_type', '').strip()  # ios, android, web
    device_id = data.get('device_id', '').strip()
    
    if not token:
        return validation_error_response('推送令牌不能为空')
    
    if not device_type:
        return validation_error_response('设备类型不能为空')
    
    try:
        # 检查是否已存在相同的令牌
        existing_token = PushToken.query.filter_by(
            user_id=current_user.id,
            token=token
        ).first()
        
        if existing_token:
            # 更新现有令牌的信息
            existing_token.device_type = device_type
            existing_token.device_id = device_id
            existing_token.is_active = True
            existing_token.updated_at = datetime.utcnow()
            db.session.commit()
            
            return success_response({
                'token_id': existing_token.id,
                'message': '推送令牌已更新'
            }, '推送令牌注册成功')
        
        # 创建新的推送令牌
        push_token = PushToken(
            user_id=current_user.id,
            token=token,
            device_type=device_type,
            device_id=device_id,
            is_active=True
        )
        
        db.session.add(push_token)
        db.session.commit()
        
        result = {
            'token_id': push_token.id,
            'registered_at': push_token.created_at.isoformat(),
            'device_type': push_token.device_type
        }
        
        return success_response(result, '推送令牌注册成功')
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'推送令牌注册失败: {str(e)}')


@bp.route('/unregister-token', methods=['POST'])
@jwt_required
def unregister_push_token():
    """注销推送令牌"""
    current_user = request.current_user
    data = request.get_json()
    
    if not data:
        return validation_error_response('请提供令牌信息')
    
    token = data.get('token', '').strip()
    token_id = data.get('token_id')
    
    if not token and not token_id:
        return validation_error_response('请提供推送令牌或令牌ID')
    
    try:
        # 查找要注销的令牌
        query = PushToken.query.filter_by(user_id=current_user.id)
        
        if token_id:
            push_token = query.filter_by(id=token_id).first()
        else:
            push_token = query.filter_by(token=token).first()
        
        if not push_token:
            return error_response('未找到指定的推送令牌')
        
        # 标记为非活跃状态
        push_token.is_active = False
        push_token.updated_at = datetime.utcnow()
        db.session.commit()
        
        return success_response({
            'token_id': push_token.id,
            'unregistered_at': datetime.utcnow().isoformat()
        }, '推送令牌注销成功')
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'推送令牌注销失败: {str(e)}')


@bp.route('/tokens', methods=['GET'])
@jwt_required
def get_push_tokens():
    """获取用户的推送令牌列表"""
    current_user = request.current_user
    
    try:
        tokens = PushToken.query.filter_by(
            user_id=current_user.id,
            is_active=True
        ).order_by(PushToken.created_at.desc()).all()
        
        token_list = []
        for token in tokens:
            token_list.append({
                'id': token.id,
                'device_type': token.device_type,
                'device_id': token.device_id,
                'created_at': token.created_at.isoformat(),
                'updated_at': token.updated_at.isoformat() if token.updated_at else None,
                'is_active': token.is_active
            })
        
        result = {
            'tokens': token_list,
            'total': len(token_list)
        }
        
        return success_response(result, '推送令牌列表获取成功')
        
    except Exception as e:
        return error_response(f'获取推送令牌失败: {str(e)}')


@bp.route('/settings', methods=['GET'])
@jwt_required
def get_notification_settings():
    """获取通知设置"""
    current_user = request.current_user
    
    # 这里应该从用户设置表获取，目前返回默认设置
    default_settings = {
        'expiry_notifications': True,
        'expiry_advance_days': 1,  # 提前几天通知
        'daily_summary': True,
        'daily_summary_time': '09:00',  # 每日摘要时间
        'shopping_reminders': True,
        'recipe_suggestions': True,
        'quiet_hours': {
            'enabled': True,
            'start_time': '22:00',
            'end_time': '08:00'
        }
    }
    
    return success_response(default_settings, '通知设置获取成功')


@bp.route('/settings', methods=['PUT'])
@jwt_required
def update_notification_settings():
    """更新通知设置"""
    current_user = request.current_user
    data = request.get_json()
    
    if not data:
        return validation_error_response('请提供设置数据')
    
    # 验证设置数据
    valid_keys = [
        'expiry_notifications', 'expiry_advance_days', 'daily_summary',
        'daily_summary_time', 'shopping_reminders', 'recipe_suggestions',
        'quiet_hours'
    ]
    
    settings = {}
    for key in valid_keys:
        if key in data:
            settings[key] = data[key]
    
    if not settings:
        return validation_error_response('没有有效的设置项')
    
    try:
        # 这里应该保存到用户设置表
        # 目前只返回成功响应
        
        result = {
            'updated_settings': settings,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        return success_response(result, '通知设置更新成功')
        
    except Exception as e:
        return error_response(f'通知设置更新失败: {str(e)}')


@bp.route('/test', methods=['POST'])
@jwt_required
def send_test_notification():
    """发送测试通知"""
    current_user = request.current_user
    data = request.get_json()
    
    message = data.get('message', '这是一条测试通知') if data else '这是一条测试通知'
    
    try:
        # 获取用户的活跃推送令牌
        tokens = PushToken.query.filter_by(
            user_id=current_user.id,
            is_active=True
        ).all()
        
        if not tokens:
            return error_response('未找到活跃的推送令牌')
        
        # 模拟发送推送通知
        sent_count = 0
        for token in tokens:
            # 这里应该调用实际的推送服务
            # 如 Firebase Cloud Messaging, Apple Push Notification Service 等
            success = send_push_notification(token.token, {
                'title': '测试通知',
                'body': message,
                'data': {
                    'type': 'test',
                    'timestamp': datetime.utcnow().isoformat()
                }
            })
            
            if success:
                sent_count += 1
        
        result = {
            'total_tokens': len(tokens),
            'sent_count': sent_count,
            'message': message,
            'sent_at': datetime.utcnow().isoformat()
        }
        
        return success_response(result, f'测试通知已发送到 {sent_count} 个设备')
        
    except Exception as e:
        return error_response(f'测试通知发送失败: {str(e)}')


@bp.route('/expiry-check', methods=['POST'])
@jwt_required
def check_expiry_notifications():
    """检查并发送过期提醒通知"""
    current_user = request.current_user
    
    try:
        # 获取即将过期的食物
        advance_days = 1  # 提前1天提醒
        cutoff_date = datetime.utcnow() + timedelta(days=advance_days)
        
        expiring_foods = Food.query.filter(
            Food.user_id == current_user.id,
            Food.is_deleted == False,
            Food.quantity > 0,
            Food.expiry_date <= cutoff_date,
            Food.expiry_date >= datetime.utcnow()  # 还没过期
        ).all()
        
        if not expiring_foods:
            return success_response({
                'expiring_count': 0,
                'message': '没有即将过期的食物'
            }, '检查完成')
        
        # 获取用户的推送令牌
        tokens = PushToken.query.filter_by(
            user_id=current_user.id,
            is_active=True
        ).all()
        
        if not tokens:
            return success_response({
                'expiring_count': len(expiring_foods),
                'notification_sent': False,
                'message': '找到即将过期的食物，但没有推送令牌'
            }, '检查完成')
        
        # 构建通知消息
        if len(expiring_foods) == 1:
            title = '食物即将过期提醒'
            body = f'您的{expiring_foods[0].name}即将过期，请尽快食用'
        else:
            title = '多个食物即将过期'
            body = f'您有{len(expiring_foods)}种食物即将过期，请及时处理'
        
        # 发送通知
        sent_count = 0
        for token in tokens:
            success = send_push_notification(token.token, {
                'title': title,
                'body': body,
                'data': {
                    'type': 'expiry_reminder',
                    'food_count': len(expiring_foods),
                    'foods': [{'id': f.id, 'name': f.name} for f in expiring_foods]
                }
            })
            
            if success:
                sent_count += 1
        
        result = {
            'expiring_count': len(expiring_foods),
            'notification_sent': sent_count > 0,
            'sent_to_devices': sent_count,
            'foods': [
                {
                    'id': food.id,
                    'name': food.name,
                    'expiry_date': food.expiry_date.isoformat(),
                    'days_until_expiry': (food.expiry_date - datetime.utcnow()).days
                }
                for food in expiring_foods
            ]
        }
        
        return success_response(result, f'过期提醒已发送到 {sent_count} 个设备')
        
    except Exception as e:
        return error_response(f'过期检查失败: {str(e)}')


def send_push_notification(token: str, payload: Dict[str, Any]) -> bool:
    """发送推送通知的实际实现"""
    try:
        # 这里应该集成真实的推送服务
        # 目前只是模拟发送成功
        
        # 示例：Firebase Cloud Messaging
        # from pyfcm import FCMNotification
        # push_service = FCMNotification(api_key="your_api_key")
        # result = push_service.notify_single_device(
        #     registration_id=token,
        #     message_title=payload.get('title'),
        #     message_body=payload.get('body'),
        #     data_message=payload.get('data')
        # )
        # return result['success'] == 1
        
        # 示例：Apple Push Notification Service
        # from apns2.client import APNsClient
        # from apns2.payload import Payload
        # client = APNsClient('path/to/certificate.pem', use_sandbox=False)
        # payload = Payload(alert=payload.get('body'), sound="default", badge=1)
        # client.send_notification(token, payload)
        
        print(f"模拟发送推送通知到令牌: {token[:20]}...")
        print(f"标题: {payload.get('title')}")
        print(f"内容: {payload.get('body')}")
        
        return True  # 模拟发送成功
        
    except Exception as e:
        print(f"推送通知发送失败: {str(e)}")
        return False


@bp.route('/statistics', methods=['GET'])
@jwt_required
def get_notification_statistics():
    """获取通知统计信息"""
    current_user = request.current_user
    
    try:
        # 获取用户的推送令牌统计
        total_tokens = PushToken.query.filter_by(user_id=current_user.id).count()
        active_tokens = PushToken.query.filter_by(
            user_id=current_user.id,
            is_active=True
        ).count()
        
        # 按设备类型统计
        device_stats = db.session.query(
            PushToken.device_type,
            db.func.count(PushToken.id).label('count')
        ).filter_by(
            user_id=current_user.id,
            is_active=True
        ).group_by(PushToken.device_type).all()
        
        device_distribution = {}
        for device_type, count in device_stats:
            device_distribution[device_type] = count
        
        # 模拟通知发送统计
        mock_stats = {
            'notifications_sent_today': 3,
            'notifications_sent_this_week': 15,
            'notifications_sent_this_month': 45,
            'last_notification_sent': (datetime.utcnow() - timedelta(hours=2)).isoformat()
        }
        
        result = {
            'token_statistics': {
                'total_tokens': total_tokens,
                'active_tokens': active_tokens,
                'device_distribution': device_distribution
            },
            'notification_statistics': mock_stats,
            'generated_at': datetime.utcnow().isoformat()
        }
        
        return success_response(result, '通知统计获取成功')
        
    except Exception as e:
        return error_response(f'获取通知统计失败: {str(e)}')