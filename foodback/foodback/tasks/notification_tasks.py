"""通知相关的后台任务"""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
from flask import current_app

# 需要在应用上下文中运行
from ..models import User, Food, PushToken
from ..database import db

logger = logging.getLogger(__name__)


def check_expiring_foods():
    """检查即将过期的食物并发送通知"""
    logger.info("开始检查即将过期的食物...")
    
    try:
        # 需要在应用上下文中运行
        with current_app.app_context():
            # 获取所有用户
            users = User.query.filter_by(is_active=True).all()
            
            total_notifications = 0
            total_users_notified = 0
            
            for user in users:
                try:
                    # 检查用户的即将过期食物
                    expiring_foods = get_user_expiring_foods(user.id)
                    
                    if not expiring_foods:
                        continue
                    
                    # 获取用户的推送令牌
                    push_tokens = PushToken.query.filter_by(
                        user_id=user.id,
                        is_active=True
                    ).all()
                    
                    if not push_tokens:
                        logger.warning(f"用户 {user.id} 没有活跃的推送令牌")
                        continue
                    
                    # 发送通知
                    success = send_expiry_notification(user, expiring_foods, push_tokens)
                    
                    if success:
                        total_notifications += len(push_tokens)
                        total_users_notified += 1
                        logger.info(f"已向用户 {user.id} 发送过期提醒")
                    
                except Exception as e:
                    logger.error(f"处理用户 {user.id} 的过期检查失败: {str(e)}")
                    continue
            
            logger.info(f"过期检查完成 - 通知用户数: {total_users_notified}, 发送通知数: {total_notifications}")
            
    except Exception as e:
        logger.error(f"过期检查任务失败: {str(e)}")


def send_daily_summary():
    """发送每日摘要"""
    logger.info("开始发送每日摘要...")
    
    try:
        with current_app.app_context():
            # 获取所有用户
            users = User.query.filter_by(is_active=True).all()
            
            total_summaries_sent = 0
            
            for user in users:
                try:
                    # 生成用户的每日摘要
                    summary = generate_daily_summary(user.id)
                    
                    if not summary:
                        continue
                    
                    # 获取用户的推送令牌
                    push_tokens = PushToken.query.filter_by(
                        user_id=user.id,
                        is_active=True
                    ).all()
                    
                    if not push_tokens:
                        continue
                    
                    # 发送每日摘要
                    success = send_summary_notification(user, summary, push_tokens)
                    
                    if success:
                        total_summaries_sent += 1
                        logger.info(f"已向用户 {user.id} 发送每日摘要")
                    
                except Exception as e:
                    logger.error(f"处理用户 {user.id} 的每日摘要失败: {str(e)}")
                    continue
            
            logger.info(f"每日摘要发送完成 - 发送数量: {total_summaries_sent}")
            
    except Exception as e:
        logger.error(f"每日摘要任务失败: {str(e)}")


def get_user_expiring_foods(user_id: int, advance_days: int = 1) -> List[Food]:
    """获取用户即将过期的食物"""
    cutoff_date = datetime.utcnow() + timedelta(days=advance_days)
    
    expiring_foods = Food.query.filter(
        Food.user_id == user_id,
        Food.is_deleted == False,
        Food.quantity > 0,
        Food.expiry_date <= cutoff_date,
        Food.expiry_date >= datetime.utcnow()  # 还没过期
    ).order_by(Food.expiry_date.asc()).all()
    
    return expiring_foods


def generate_daily_summary(user_id: int) -> Dict[str, Any]:
    """生成用户的每日摘要"""
    try:
        # 获取用户的食物统计
        total_foods = Food.query.filter_by(
            user_id=user_id,
            is_deleted=False
        ).count()
        
        # 即将过期的食物
        expiring_foods = get_user_expiring_foods(user_id, advance_days=3)
        
        # 已过期的食物
        expired_foods = Food.query.filter(
            Food.user_id == user_id,
            Food.is_deleted == False,
            Food.quantity > 0,
            Food.expiry_date < datetime.utcnow()
        ).count()
        
        # 今天添加的食物
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_added = Food.query.filter(
            Food.user_id == user_id,
            Food.is_deleted == False,
            Food.created_at >= today_start
        ).count()
        
        # 如果没有什么需要报告的，就不发送摘要
        if total_foods == 0 and len(expiring_foods) == 0 and expired_foods == 0 and today_added == 0:
            return None
        
        summary = {
            'total_foods': total_foods,
            'expiring_count': len(expiring_foods),
            'expired_count': expired_foods,
            'today_added': today_added,
            'expiring_foods': [
                {
                    'name': food.name,
                    'expiry_date': food.expiry_date.isoformat(),
                    'days_until_expiry': (food.expiry_date - datetime.utcnow()).days
                }
                for food in expiring_foods[:5]  # 最多显示5个
            ]
        }
        
        return summary
        
    except Exception as e:
        logger.error(f"生成用户 {user_id} 每日摘要失败: {str(e)}")
        return None


def send_expiry_notification(user: User, expiring_foods: List[Food], push_tokens: List[PushToken]) -> bool:
    """发送过期提醒通知"""
    try:
        # 构建通知消息
        if len(expiring_foods) == 1:
            title = "食物即将过期提醒"
            body = f"您的{expiring_foods[0].name}即将过期，请尽快食用"
        else:
            title = "多个食物即将过期"
            body = f"您有{len(expiring_foods)}种食物即将过期，请及时处理"
        
        payload = {
            'title': title,
            'body': body,
            'data': {
                'type': 'expiry_reminder',
                'food_count': len(expiring_foods),
                'foods': [{'id': f.id, 'name': f.name} for f in expiring_foods[:5]]
            }
        }
        
        # 发送到所有设备
        sent_count = 0
        for token in push_tokens:
            success = send_push_notification(token.token, payload)
            if success:
                sent_count += 1
        
        return sent_count > 0
        
    except Exception as e:
        logger.error(f"发送过期通知失败: {str(e)}")
        return False


def send_summary_notification(user: User, summary: Dict[str, Any], push_tokens: List[PushToken]) -> bool:
    """发送每日摘要通知"""
    try:
        # 构建摘要消息
        title = "每日食物摘要"
        
        body_parts = []
        if summary['today_added'] > 0:
            body_parts.append(f"今日新增{summary['today_added']}种食物")
        
        if summary['expiring_count'] > 0:
            body_parts.append(f"{summary['expiring_count']}种即将过期")
        
        if summary['expired_count'] > 0:
            body_parts.append(f"{summary['expired_count']}种已过期")
        
        if not body_parts:
            body = f"您目前有{summary['total_foods']}种食物"
        else:
            body = "，".join(body_parts)
        
        payload = {
            'title': title,
            'body': body,
            'data': {
                'type': 'daily_summary',
                'summary': summary
            }
        }
        
        # 发送到所有设备
        sent_count = 0
        for token in push_tokens:
            success = send_push_notification(token.token, payload)
            if success:
                sent_count += 1
        
        return sent_count > 0
        
    except Exception as e:
        logger.error(f"发送每日摘要失败: {str(e)}")
        return False


def send_push_notification(token: str, payload: Dict[str, Any]) -> bool:
    """发送推送通知"""
    try:
        # 这里应该集成真实的推送服务
        # 目前只是模拟发送
        
        logger.info(f"模拟发送推送通知:")
        logger.info(f"  令牌: {token[:20]}...")
        logger.info(f"  标题: {payload.get('title')}")
        logger.info(f"  内容: {payload.get('body')}")
        
        return True  # 模拟发送成功
        
    except Exception as e:
        logger.error(f"推送通知发送失败: {str(e)}")
        return False


def cleanup_expired_tokens():
    """清理过期的推送令牌"""
    logger.info("开始清理过期的推送令牌...")
    
    try:
        with current_app.app_context():
            # 清理30天前创建且不活跃的令牌
            cutoff_date = datetime.utcnow() - timedelta(days=30)
            
            expired_tokens = PushToken.query.filter(
                PushToken.is_active == False,
                PushToken.created_at < cutoff_date
            ).all()
            
            for token in expired_tokens:
                db.session.delete(token)
            
            db.session.commit()
            
            logger.info(f"清理了 {len(expired_tokens)} 个过期推送令牌")
            
    except Exception as e:
        logger.error(f"清理过期令牌失败: {str(e)}")
        db.session.rollback()