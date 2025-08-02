# -*- coding: utf-8 -*-
"""User models."""
import datetime as dt

from flask_login import UserMixin
from sqlalchemy.ext.hybrid import hybrid_property

from foodback.database import Column, PkModel, db, reference_col, relationship
from foodback.extensions import bcrypt


class User(UserMixin, PkModel):
    """智能食物保鲜管家用户模型"""

    __tablename__ = "users"
    
    # 基础信息
    nickname = Column(db.String(50), nullable=False, comment="用户昵称")
    avatar_url = Column(db.String(255), nullable=True, comment="用户头像图片URL")
    phone = Column(db.String(20), nullable=True, unique=True, comment="手机号码，可用于登录")
    email = Column(db.String(100), nullable=True, unique=True, comment="电子邮箱，可用于登录")
    
    # 密码和安全
    _password_hash = Column("password_hash", db.String(255), nullable=False, comment="加密后的用户密码")
    
    # 时间戳
    created_at = Column(
        db.DateTime, 
        nullable=False, 
        default=dt.datetime.now(dt.timezone.utc),
        comment="创建时间"
    )
    updated_at = Column(
        db.DateTime,
        nullable=False,
        default=dt.datetime.now(dt.timezone.utc),
        onupdate=dt.datetime.now(dt.timezone.utc),
        comment="最后更新时间"
    )

    # 关联关系
    foods = relationship("Food", back_populates="user", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    locations = relationship("Location", back_populates="user", cascade="all, delete-orphan")
    shopping_items = relationship("ShoppingListItem", back_populates="user", cascade="all, delete-orphan")
    push_tokens = relationship("PushToken", back_populates="user", cascade="all, delete-orphan")

    @hybrid_property
    def password(self):
        """Hashed password."""
        return self._password_hash

    @password.setter
    def password(self, value):
        """Set password."""
        self._password_hash = bcrypt.generate_password_hash(value).decode('utf-8')

    def check_password(self, value):
        """Check password."""
        return bcrypt.check_password_hash(self._password_hash.encode('utf-8'), value)

    def __repr__(self):
        """Represent instance as a unique string."""
        return f"<User({self.nickname!r})>"
