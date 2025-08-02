"""任务调度器"""
import atexit
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 全局调度器实例
scheduler = None


def init_scheduler():
    """初始化调度器"""
    global scheduler
    
    if scheduler is not None:
        return scheduler
    
    scheduler = BackgroundScheduler(
        timezone='Asia/Shanghai',  # 设置时区
        job_defaults={
            'coalesce': False,
            'max_instances': 1
        }
    )
    
    # 注册应用退出时停止调度器
    atexit.register(stop_scheduler)
    
    logger.info("任务调度器初始化完成")
    return scheduler


def start_scheduler():
    """启动调度器"""
    global scheduler
    
    if scheduler is None:
        init_scheduler()
    
    if not scheduler.running:
        scheduler.start()
        logger.info("任务调度器已启动")
        
        # 添加定时任务
        add_scheduled_jobs()
    else:
        logger.info("任务调度器已在运行中")


def stop_scheduler():
    """停止调度器"""
    global scheduler
    
    if scheduler is not None and scheduler.running:
        scheduler.shutdown()
        logger.info("任务调度器已停止")


def add_scheduled_jobs():
    """添加定时任务"""
    global scheduler
    
    if scheduler is None:
        return
    
    try:
        # 导入任务函数
        from .notification_tasks import check_expiring_foods, send_daily_summary
        
        # 每天早上9点检查即将过期的食物
        scheduler.add_job(
            func=check_expiring_foods,
            trigger=CronTrigger(hour=9, minute=0),
            id='check_expiring_foods',
            name='检查即将过期的食物',
            replace_existing=True
        )
        
        # 每天晚上8点发送每日摘要
        scheduler.add_job(
            func=send_daily_summary,
            trigger=CronTrigger(hour=20, minute=0),
            id='send_daily_summary',
            name='发送每日摘要',
            replace_existing=True
        )
        
        # 每小时检查一次过期食物（用于测试）
        scheduler.add_job(
            func=check_expiring_foods,
            trigger=CronTrigger(minute=0),  # 每小时的0分执行
            id='hourly_expiry_check',
            name='每小时过期检查',
            replace_existing=True
        )
        
        logger.info("定时任务已添加完成")
        
        # 打印已注册的任务
        jobs = scheduler.get_jobs()
        logger.info(f"当前注册的任务数量: {len(jobs)}")
        for job in jobs:
            logger.info(f"任务: {job.name} ({job.id}) - 下次运行: {job.next_run_time}")
            
    except Exception as e:
        logger.error(f"添加定时任务失败: {str(e)}")


def get_scheduler():
    """获取调度器实例"""
    global scheduler
    return scheduler


def list_jobs():
    """列出所有任务"""
    global scheduler
    
    if scheduler is None:
        return []
    
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            'id': job.id,
            'name': job.name,
            'func': job.func.__name__,
            'trigger': str(job.trigger),
            'next_run_time': job.next_run_time.isoformat() if job.next_run_time else None,
            'misfire_grace_time': job.misfire_grace_time,
            'max_instances': job.max_instances
        })
    
    return jobs


def run_job_now(job_id: str):
    """立即运行指定任务"""
    global scheduler
    
    if scheduler is None:
        raise Exception("调度器未初始化")
    
    try:
        job = scheduler.get_job(job_id)
        if job is None:
            raise Exception(f"未找到任务: {job_id}")
        
        # 立即执行任务
        scheduler.modify_job(job_id, next_run_time=datetime.now())
        logger.info(f"任务 {job_id} 已设置为立即执行")
        
    except Exception as e:
        logger.error(f"执行任务失败: {str(e)}")
        raise