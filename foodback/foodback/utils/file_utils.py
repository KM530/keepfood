# -*- coding: utf-8 -*-
"""文件处理工具函数"""
import os
import uuid
import mimetypes
from PIL import Image
from werkzeug.utils import secure_filename
from flask import current_app
from typing import Optional, Tuple, List

# 尝试导入python-magic，如果失败则使用mimetypes作为替代
try:
    import magic
    MAGIC_AVAILABLE = True
except ImportError:
    MAGIC_AVAILABLE = False
    print("Warning: python-magic not available, using mimetypes as fallback")


# 允许的图片文件扩展名
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# 允许的图片MIME类型
ALLOWED_IMAGE_MIMES = {
    'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'
}

# 最大文件大小（5MB）
MAX_FILE_SIZE = 5 * 1024 * 1024


def allowed_file(filename: str, allowed_extensions: set = None) -> bool:
    """
    检查文件扩展名是否被允许
    
    Args:
        filename: 文件名
        allowed_extensions: 允许的扩展名集合
    
    Returns:
        是否允许
    """
    if allowed_extensions is None:
        allowed_extensions = ALLOWED_IMAGE_EXTENSIONS
    
    return ('.' in filename and 
            filename.rsplit('.', 1)[1].lower() in allowed_extensions)


def validate_image_file(file) -> Tuple[bool, str]:
    """
    验证上传的图片文件
    
    Args:
        file: 上传的文件对象
    
    Returns:
        (是否有效, 错误信息)
    """
    if not file or not file.filename:
        return False, "No file selected"
    
    # 检查文件扩展名
    if not allowed_file(file.filename):
        return False, f"File type not allowed. Allowed types: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
    
    # 检查文件大小
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)  # 重置文件指针
    
    if file_size > MAX_FILE_SIZE:
        return False, f"File size too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
    
    # 检查MIME类型
    file_content = file.read(1024)  # 读取前1KB用于检测
    file.seek(0)  # 重置文件指针
    
    try:
        if MAGIC_AVAILABLE:
            mime_type = magic.from_buffer(file_content, mime=True)
        else:
            # 使用mimetypes作为替代方案
            mime_type, _ = mimetypes.guess_type(filename)
            
        if mime_type and mime_type not in ALLOWED_IMAGE_MIMES:
            return False, f"Invalid file type: {mime_type}"
    except Exception:
        # 如果MIME检测失败，仅依赖扩展名检查
        pass
    
    return True, ""


def generate_unique_filename(original_filename: str) -> str:
    """
    生成唯一的文件名
    
    Args:
        original_filename: 原始文件名
    
    Returns:
        唯一的文件名
    """
    # 获取文件扩展名
    ext = ''
    if '.' in original_filename:
        ext = '.' + original_filename.rsplit('.', 1)[1].lower()
    
    # 生成UUID作为文件名
    unique_name = str(uuid.uuid4()) + ext
    return secure_filename(unique_name)


def save_uploaded_image(file, upload_folder: str, 
                       max_size: Tuple[int, int] = (1200, 1200)) -> Tuple[bool, str, Optional[str]]:
    """
    保存上传的图片文件
    
    Args:
        file: 上传的文件对象
        upload_folder: 上传文件夹路径
        max_size: 最大尺寸 (width, height)
    
    Returns:
        (是否成功, 消息, 文件路径)
    """
    # 验证文件
    is_valid, error_msg = validate_image_file(file)
    if not is_valid:
        return False, error_msg, None
    
    try:
        # 确保上传目录存在
        os.makedirs(upload_folder, exist_ok=True)
        
        # 生成唯一文件名
        filename = generate_unique_filename(file.filename)
        file_path = os.path.join(upload_folder, filename)
        
        # 打开图片
        image = Image.open(file)
        
        # 转换RGBA到RGB（如果需要）
        if image.mode in ('RGBA', 'LA', 'P'):
            # 创建白色背景
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        
        # 调整图片大小（保持宽高比）
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # 保存图片
        image.save(file_path, 'JPEG', quality=85, optimize=True)
        
        return True, "File uploaded successfully", filename
        
    except Exception as e:
        current_app.logger.error(f"Error saving image: {str(e)}")
        return False, f"Error processing image: {str(e)}", None


def create_thumbnail(image_path: str, thumbnail_path: str, 
                    size: Tuple[int, int] = (300, 300)) -> bool:
    """
    创建缩略图
    
    Args:
        image_path: 原图片路径
        thumbnail_path: 缩略图保存路径
        size: 缩略图尺寸
    
    Returns:
        是否成功
    """
    try:
        with Image.open(image_path) as image:
            # 创建缩略图
            image.thumbnail(size, Image.Resampling.LANCZOS)
            
            # 确保目录存在
            os.makedirs(os.path.dirname(thumbnail_path), exist_ok=True)
            
            # 保存缩略图
            image.save(thumbnail_path, 'JPEG', quality=80, optimize=True)
            
        return True
    except Exception as e:
        current_app.logger.error(f"Error creating thumbnail: {str(e)}")
        return False


def delete_file(file_path: str) -> bool:
    """
    删除文件
    
    Args:
        file_path: 文件路径
    
    Returns:
        是否成功
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
        return True
    except Exception as e:
        current_app.logger.error(f"Error deleting file: {str(e)}")
        return False


def get_file_url(filename: str, folder: str = 'uploads') -> str:
    """
    获取文件的URL
    
    Args:
        filename: 文件名
        folder: 文件夹名
    
    Returns:
        文件URL
    """
    if not filename:
        return ''
    
    # 这里应该根据实际的静态文件服务配置来生成URL
    # 如果使用CDN，应该返回CDN的URL
    base_url = current_app.config.get('STATIC_URL', '/static')
    return f"{base_url}/{folder}/{filename}"


def batch_resize_images(image_paths: List[str], target_size: Tuple[int, int]) -> List[str]:
    """
    批量调整图片大小
    
    Args:
        image_paths: 图片路径列表
        target_size: 目标尺寸
    
    Returns:
        成功处理的图片路径列表
    """
    processed_paths = []
    
    for image_path in image_paths:
        try:
            with Image.open(image_path) as image:
                # 调整大小
                image.thumbnail(target_size, Image.Resampling.LANCZOS)
                
                # 覆盖原文件
                image.save(image_path, 'JPEG', quality=85, optimize=True)
                processed_paths.append(image_path)
                
        except Exception as e:
            current_app.logger.error(f"Error resizing image {image_path}: {str(e)}")
    
    return processed_paths