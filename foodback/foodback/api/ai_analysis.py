"""
AI分析API端点
"""

import os
from flask import Blueprint, request, current_app
from werkzeug.utils import secure_filename

from ..auth.decorators import jwt_required
from ..utils.response_utils import success_response, error_response
from ..utils.file_utils import allowed_file
from ..services.ai_analysis import ai_analysis_service

# 创建蓝图
blueprint = Blueprint('ai_analysis', __name__)


@blueprint.route('/ai/analyze-food', methods=['POST'])
@jwt_required
def analyze_food_images():
    """
    AI分析食物包装图片
    
    接收多张图片，返回分析结果
    """
    try:
        # 检查AI服务是否可用
        if not ai_analysis_service.is_available():
            return error_response('AI分析服务暂时不可用', 503)
        
        # 获取上传的图片文件
        images = request.files.getlist('images')
        if not images or len(images) == 0:
            return error_response('请至少上传一张图片', 400)
        
        # 验证文件类型和保存临时文件
        temp_paths = []
        upload_folder = os.path.join(current_app.root_path, 'static', 'temp')
        os.makedirs(upload_folder, exist_ok=True)
        
        try:
            for image in images:
                if image and image.filename:
                    # 验证文件类型
                    is_allowed, mime_type = allowed_file(image.filename)
                    if not is_allowed:
                        return error_response(f'不支持的文件类型: {image.filename}', 400)
                    
                    # 保存临时文件
                    filename = secure_filename(image.filename)
                    temp_path = os.path.join(upload_folder, f"temp_{filename}")
                    image.save(temp_path)
                    temp_paths.append(temp_path)
            
            if not temp_paths:
                return error_response('没有有效的图片文件', 400)
            
            # 调用AI分析服务
            current_app.logger.info(f'Starting AI analysis for {len(temp_paths)} images')
            analysis_result = ai_analysis_service.analyze_food_images(temp_paths)
            
            current_app.logger.info('AI analysis completed successfully')
            
            return success_response(analysis_result, 'AI分析完成')
            
        finally:
            # 清理临时文件
            for temp_path in temp_paths:
                try:
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
                except Exception as e:
                    current_app.logger.warning(f'Failed to remove temp file {temp_path}: {e}')
    
    except Exception as e:
        current_app.logger.error(f'AI analysis failed: {str(e)}')
        return error_response(f'AI分析失败: {str(e)}', 500)


@blueprint.route('/ai/status', methods=['GET'])
@jwt_required
def get_ai_status():
    """
    获取AI服务状态
    """
    try:
        is_available = ai_analysis_service.is_available()
        
        return success_response({
            'available': is_available,
            'message': 'AI服务正常' if is_available else 'AI服务不可用'
        }, '获取AI服务状态成功')
        
    except Exception as e:
        current_app.logger.error(f'Failed to get AI status: {str(e)}')
        return error_response('获取AI服务状态失败', 500)