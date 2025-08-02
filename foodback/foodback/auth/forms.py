# -*- coding: utf-8 -*-
"""认证相关表单"""

from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField
from wtforms.validators import DataRequired, Email, Length, EqualTo, ValidationError
from wtforms.fields import EmailField

from foodback.user.models import User


class LoginForm(FlaskForm):
    """登录表单"""
    account = StringField(
        '账号',
        validators=[
            DataRequired(message='请输入账号'),
            Length(min=3, max=100, message='账号长度应在3-100个字符之间')
        ],
        render_kw={'placeholder': '请输入邮箱或手机号'}
    )
    
    password = PasswordField(
        '密码',
        validators=[
            DataRequired(message='请输入密码'),
            Length(min=6, max=50, message='密码长度应在6-50个字符之间')
        ],
        render_kw={'placeholder': '请输入密码'}
    )

    def validate_account(self, field):
        """验证账号是否存在"""
        account = field.data.strip()
        
        # 尝试通过邮箱或手机号查找用户
        user = None
        if '@' in account:
            user = User.query.filter_by(email=account).first()
        else:
            user = User.query.filter_by(phone=account).first()
        
        if not user:
            raise ValidationError('账号不存在')
        
        # 将找到的用户存储在表单中，供视图使用
        self._user = user

    def get_user(self):
        """获取验证通过的用户"""
        return getattr(self, '_user', None)


class RegisterForm(FlaskForm):
    """注册表单"""
    email = EmailField(
        '邮箱',
        validators=[
            DataRequired(message='请输入邮箱'),
            Email(message='请输入有效的邮箱地址'),
            Length(max=100, message='邮箱长度不能超过100个字符')
        ],
        render_kw={'placeholder': '请输入邮箱地址'}
    )
    
    nickname = StringField(
        '昵称',
        validators=[
            DataRequired(message='请输入昵称'),
            Length(min=2, max=20, message='昵称长度应在2-20个字符之间')
        ],
        render_kw={'placeholder': '请输入昵称'}
    )
    
    password = PasswordField(
        '密码',
        validators=[
            DataRequired(message='请输入密码'),
            Length(min=6, max=50, message='密码长度应在6-50个字符之间')
        ],
        render_kw={'placeholder': '请输入密码，至少6位'}
    )
    
    confirm_password = PasswordField(
        '确认密码',
        validators=[
            DataRequired(message='请确认密码'),
            EqualTo('password', message='两次输入的密码不一致')
        ],
        render_kw={'placeholder': '请再次输入密码'}
    )

    def validate_email(self, field):
        """验证邮箱是否已被注册"""
        if User.query.filter_by(email=field.data).first():
            raise ValidationError('该邮箱已被注册')

    def validate_nickname(self, field):
        """验证昵称是否已被使用"""
        if User.query.filter_by(nickname=field.data).first():
            raise ValidationError('该昵称已被使用')


class UpdateProfileForm(FlaskForm):
    """更新个人信息表单"""
    nickname = StringField(
        '昵称',
        validators=[
            DataRequired(message='请输入昵称'),
            Length(min=2, max=20, message='昵称长度应在2-20个字符之间')
        ]
    )
    
    phone = StringField(
        '手机号',
        validators=[
            Length(max=20, message='手机号长度不能超过20个字符')
        ],
        render_kw={'placeholder': '请输入手机号（可选）'}
    )

    def __init__(self, current_user, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.current_user = current_user

    def validate_nickname(self, field):
        """验证昵称是否已被其他用户使用"""
        if field.data != self.current_user.nickname:
            if User.query.filter_by(nickname=field.data).first():
                raise ValidationError('该昵称已被使用')

    def validate_phone(self, field):
        """验证手机号是否已被其他用户使用"""
        if field.data and field.data != self.current_user.phone:
            if User.query.filter_by(phone=field.data).first():
                raise ValidationError('该手机号已被注册')


class ChangePasswordForm(FlaskForm):
    """修改密码表单"""
    current_password = PasswordField(
        '当前密码',
        validators=[
            DataRequired(message='请输入当前密码')
        ],
        render_kw={'placeholder': '请输入当前密码'}
    )
    
    new_password = PasswordField(
        '新密码',
        validators=[
            DataRequired(message='请输入新密码'),
            Length(min=6, max=50, message='密码长度应在6-50个字符之间')
        ],
        render_kw={'placeholder': '请输入新密码，至少6位'}
    )
    
    confirm_new_password = PasswordField(
        '确认新密码',
        validators=[
            DataRequired(message='请确认新密码'),
            EqualTo('new_password', message='两次输入的新密码不一致')
        ],
        render_kw={'placeholder': '请再次输入新密码'}
    )

    def __init__(self, current_user, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.current_user = current_user

    def validate_current_password(self, field):
        """验证当前密码是否正确"""
        if not self.current_user.check_password(field.data):
            raise ValidationError('当前密码不正确')

    def validate_new_password(self, field):
        """验证新密码不能与当前密码相同"""
        if self.current_user.check_password(field.data):
            raise ValidationError('新密码不能与当前密码相同')