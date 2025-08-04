# -*- coding: utf-8 -*-
"""认证视图"""

from flask import Blueprint, request, jsonify, current_app
from flask_login import login_user, logout_user, current_user, login_required

from foodback.extensions import db
from foodback.user.models import User
from foodback.utils.jwt_utils import generate_jwt_token
from foodback.utils.response_utils import (
    success_response, error_response, validation_error_response,
    unauthorized_response, created_response
)
from .forms import LoginForm, RegisterForm, UpdateProfileForm, ChangePasswordForm
from .decorators import jwt_required, api_login_required, get_current_user

blueprint = Blueprint('auth', __name__)


@blueprint.route('/auth/health', methods=['GET'])
def health_check():
    """健康检查端点"""
    return success_response({
        'status': 'healthy',
        'message': '智能食物保鲜管家API服务正常运行',
        'version': '1.0.0'
    }, '服务健康检查通过')


@blueprint.route('/auth/register', methods=['POST'])
def register():
    """用户注册"""
    current_app.logger.info(f'Register request received from {request.remote_addr}')
    current_app.logger.info(f'Request headers: {dict(request.headers)}')
    
    try:
        # 获取JSON数据
        data = request.get_json()
        current_app.logger.info(f'Request data: {data}')
        
        if not data:
            current_app.logger.warning('No JSON data provided')
            return error_response('请提供注册信息', 400)

        # 验证必填字段
        required_fields = ['email', 'nickname', 'password', 'confirm_password']
        for field in required_fields:
            if not data.get(field):
                current_app.logger.warning(f'Missing field: {field}')
                return error_response(f'请提供{field}', 400)
        
        # 验证邮箱格式
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data['email']):
            current_app.logger.warning(f'Invalid email format: {data["email"]}')
            return error_response('邮箱格式不正确', 400)
        
        # 验证密码长度
        if len(data['password']) < 6:
            current_app.logger.warning('Password too short')
            return error_response('密码长度至少6位', 400)
        
        # 验证密码确认
        if data['password'] != data['confirm_password']:
            current_app.logger.warning('Password confirmation mismatch')
            return error_response('两次输入的密码不一致', 400)
        
        # 检查邮箱是否已存在
        if User.query.filter_by(email=data['email']).first():
            current_app.logger.warning(f'Email already exists: {data["email"]}')
            return error_response('该邮箱已被注册', 400)
        
        # 检查昵称是否已存在
        if User.query.filter_by(nickname=data['nickname']).first():
            current_app.logger.warning(f'Nickname already exists: {data["nickname"]}')
            return error_response('该昵称已被使用', 400)

        # 创建新用户
        user = User(
            email=data['email'],
            nickname=data['nickname'],
            password=data['password']  # 密码会在模型中自动加密
        )
        
        user.save()
        current_app.logger.info(f'New user registered: {user.email}')

        # 生成JWT Token
        token = generate_jwt_token(user.id)

        # 返回用户信息和Token
        return created_response({
            'token': token,
            'user': user.to_dict(exclude=['password_hash'])
        }, '注册成功')

    except Exception as e:
        current_app.logger.error(f'Registration error: {str(e)}', exc_info=True)
        db.session.rollback()
        return error_response('注册失败，请稍后重试', 500)


@blueprint.route('/auth/login', methods=['POST'])
def login():
    """用户登录"""
    try:
        # 获取JSON数据
        data = request.get_json()
        if not data:
            return error_response('请提供登录信息', 400)

        # 创建表单并验证
        form = LoginForm(data=data)
        if not form.validate():
            return validation_error_response(form.errors)

        # 获取用户并验证密码
        user = form.get_user()
        if not user or not user.check_password(form.password.data):
            return unauthorized_response('账号或密码错误')

        # 使用Flask-Login登录用户（用于Web端）
        login_user(user, remember=True)
        current_app.logger.info(f'User logged in: {user.email}')

        # 生成JWT Token（用于API端）
        token = generate_jwt_token(user.id)

        # 返回用户信息和Token
        return success_response({
            'token': token,
            'user': user.to_dict(exclude=['password_hash'])
        }, '登录成功')

    except Exception as e:
        current_app.logger.error(f'Login error: {str(e)}')
        return error_response('登录失败，请稍后重试', 500)


@blueprint.route('/auth/logout', methods=['POST'])
def logout():
    """用户登出"""
    try:
        # Flask-Login登出
        if current_user.is_authenticated:
            current_app.logger.info(f'User logged out: {current_user.email}')
            logout_user()

        # JWT Token在客户端处理，服务端无需特殊处理
        return success_response(None, '登出成功')

    except Exception as e:
        current_app.logger.error(f'Logout error: {str(e)}')
        return error_response('登出失败', 500)


@blueprint.route('/auth/me', methods=['GET'])
@jwt_required
def get_current_user_info():
    """获取当前用户信息"""
    try:
        current_user = get_current_user()
        return success_response(
            current_user.to_dict(exclude=['password_hash']),
            '获取用户信息成功'
        )
    except Exception as e:
        current_app.logger.error(f'Get current user error: {str(e)}')
        return error_response('获取用户信息失败', 500)


@blueprint.route('/auth/me', methods=['PUT'])
@jwt_required
def update_profile():
    """更新用户个人信息"""
    try:
        current_user = get_current_user()
        
        # 处理文件上传和表单数据
        if request.content_type and 'multipart/form-data' in request.content_type:
            # 处理包含文件的表单数据
            form_data = request.form.to_dict()
            avatar_file = request.files.get('avatar')
        else:
            # 处理JSON数据
            form_data = request.get_json() or {}
            avatar_file = None

        # 创建表单并验证
        form = UpdateProfileForm(current_user, data=form_data)
        if not form.validate():
            return validation_error_response(form.errors)

        # 更新用户信息
        update_data = {
            'nickname': form.nickname.data,
            'email': form.email.data if form.email.data else None,
            'phone': form.phone.data if form.phone.data else None,
        }

        # 处理头像上传
        if avatar_file and avatar_file.filename:
            from foodback.utils.file_utils import save_uploaded_image
            import os
            
            upload_folder = os.path.join(current_app.root_path, 'static', 'uploads', 'avatars')
            success, message, filename = save_uploaded_image(
                avatar_file, 
                upload_folder,
                max_size=(300, 300)
            )
            
            if success:
                # 删除旧头像文件（如果存在）
                if current_user.avatar_url:
                    old_filename = os.path.basename(current_user.avatar_url)
                    old_file_path = os.path.join(upload_folder, old_filename)
                    if os.path.exists(old_file_path):
                        os.remove(old_file_path)
                
                update_data['avatar_url'] = f'/static/uploads/avatars/{filename}'
            else:
                return error_response(f'头像上传失败: {message}', 400)

        # 更新用户
        current_user.update(**update_data)
        current_app.logger.info(f'User profile updated: {current_user.email}')

        return success_response(
            current_user.to_dict(exclude=['password_hash']),
            '个人信息更新成功'
        )

    except Exception as e:
        current_app.logger.error(f'Update profile error: {str(e)}')
        db.session.rollback()
        return error_response('更新个人信息失败', 500)


@blueprint.route('/auth/change-password', methods=['POST'])
@jwt_required
def change_password():
    """修改密码"""
    try:
        current_user = get_current_user()
        
        # 获取JSON数据
        data = request.get_json()
        if not data:
            return error_response('请提供密码信息', 400)

        # 创建表单并验证
        form = ChangePasswordForm(current_user, data=data)
        if not form.validate():
            return validation_error_response(form.errors)

        # 更新密码
        current_user.password = form.new_password.data
        current_user.save()
        
        current_app.logger.info(f'User password changed: {current_user.email}')

        return success_response(None, '密码修改成功')

    except Exception as e:
        current_app.logger.error(f'Change password error: {str(e)}')
        db.session.rollback()
        return error_response('密码修改失败', 500)


@blueprint.route('/auth/check-email', methods=['POST'])
def check_email():
    """检查邮箱是否已被注册"""
    try:
        data = request.get_json()
        if not data or 'email' not in data:
            return error_response('请提供邮箱地址', 400)

        email = data['email'].strip()
        if not email:
            return error_response('邮箱地址不能为空', 400)

        # 检查邮箱是否已存在
        exists = User.query.filter_by(email=email).first() is not None

        return success_response({
            'exists': exists,
            'message': '该邮箱已被注册' if exists else '该邮箱可以使用'
        })

    except Exception as e:
        current_app.logger.error(f'Check email error: {str(e)}')
        return error_response('检查邮箱失败', 500)


@blueprint.route('/auth/check-nickname', methods=['POST'])
def check_nickname():
    """检查昵称是否已被使用"""
    try:
        data = request.get_json()
        if not data or 'nickname' not in data:
            return error_response('请提供昵称', 400)

        nickname = data['nickname'].strip()
        if not nickname:
            return error_response('昵称不能为空', 400)

        # 检查昵称是否已存在
        exists = User.query.filter_by(nickname=nickname).first() is not None

        return success_response({
            'exists': exists,
            'message': '该昵称已被使用' if exists else '该昵称可以使用'
        })

    except Exception as e:
        current_app.logger.error(f'Check nickname error: {str(e)}')
        return error_response('检查昵称失败', 500)