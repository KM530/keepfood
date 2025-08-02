# -*- coding: utf-8 -*-
"""核心数据模型定义"""
import datetime as dt
from enum import Enum

from foodback.database import Column, PkModel, db, reference_col, relationship


class Category(PkModel):
    """食物分类模型"""
    
    __tablename__ = "categories"
    
    user_id = reference_col("users", nullable=True, comment="外键，关联到users表。NULL表示为系统预置分类")
    name = Column(db.String(50), nullable=False, comment="分类名称")
    is_system = Column(db.Boolean, nullable=False, default=False, comment="是否为系统预置分类")
    
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
    user = relationship("User", back_populates="categories")
    foods = relationship("Food", back_populates="category")
    
    def __repr__(self):
        return f"<Category({self.name!r})>"


class Location(PkModel):
    """存放位置模型"""
    
    __tablename__ = "locations"
    
    user_id = reference_col("users", nullable=False, comment="外键，关联到users表")
    name = Column(db.String(100), nullable=False, comment="位置名称")
    
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
    
    # 唯一约束：同一用户下位置名称不能重复
    __table_args__ = (
        db.UniqueConstraint('user_id', 'name', name='uk_user_location_name'),
    )
    
    # 关联关系
    user = relationship("User", back_populates="locations")
    foods = relationship("Food", back_populates="location")
    
    def __repr__(self):
        return f"<Location({self.name!r})>"


class Food(PkModel):
    """食物库存模型"""
    
    __tablename__ = "foods"
    
    # 基础信息
    user_id = reference_col("users", nullable=False, comment="外键，关联到users表")
    name = Column(db.String(100), nullable=False, comment="食物名称")
    image_url = Column(db.JSON, nullable=True, comment="食物图片的URL（JSON数组，可以有多个图片）")
    
    # 数量和单位
    quantity = Column(db.Numeric(10, 2), nullable=False, comment="数量")
    unit = Column(db.String(20), nullable=False, comment="数量单位")
    
    # 分类和位置
    category_id = reference_col("categories", nullable=False, comment="外键，关联到categories表")
    location_id = reference_col("locations", nullable=True, comment="外键，关联到locations表")
    
    # 日期信息
    production_date = Column(db.Date, nullable=True, comment="生产日期")
    shelf_life_value = Column(db.Integer, nullable=True, comment="保质期数值")
    shelf_life_unit = Column(
        db.Enum('day', 'month', 'year', name='shelf_life_unit_enum'),
        nullable=True,
        comment="保质期单位"
    )
    expiry_date = Column(db.Date, nullable=False, comment="过期日期，核心排序字段")
    
    # 配料和营养信息
    ingredients_text = Column(db.Text, nullable=True, comment="AI识别的配料表原文")
    harmful_ingredients_json = Column(db.JSON, nullable=True, comment="检测到的有害成分列表（JSON数组）")
    calories_kcal = Column(db.Integer, nullable=True, comment="AI分析的卡路里(千卡)")
    energy_offset_info = Column(db.String(255), nullable=True, comment="AI分析的热量抵消运动建议")
    
    # 软删除
    is_deleted = Column(db.Boolean, nullable=False, default=False, comment="软删除标记")
    
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
    
    # 索引
    __table_args__ = (
        db.Index('idx_expiry_date', 'expiry_date'),
        db.Index('idx_user_id', 'user_id'),
    )
    
    # 关联关系
    user = relationship("User", back_populates="foods")
    category = relationship("Category", back_populates="foods")
    location = relationship("Location", back_populates="foods")
    shopping_items = relationship("ShoppingListItem", back_populates="source_food")
    
    @property
    def status(self):
        """计算食物过期状态"""
        if not self.expiry_date:
            return 'unknown'
            
        today = dt.date.today()
        days_diff = (self.expiry_date - today).days
        
        if days_diff < 0:
            return 'expired'
        elif days_diff <= 3:
            return 'expiring_soon'
        else:
            return 'normal'
    
    @property
    def days_until_expiry(self):
        """计算距离过期还有多少天"""
        if not self.expiry_date:
            return None
        
        today = dt.date.today()
        return (self.expiry_date - today).days
    
    def __repr__(self):
        return f"<Food({self.name!r})>"


class ShoppingListItem(PkModel):
    """购物清单项模型"""
    
    __tablename__ = "shopping_list_items"
    
    user_id = reference_col("users", nullable=False, comment="外键，关联到users表")
    item_name = Column(db.String(100), nullable=False, comment="商品名称")
    is_checked = Column(db.Boolean, nullable=False, default=False, comment="是否已勾选购买")
    
    # 可选的关联食物ID，记录该项是否由某个库存食物添加而来
    created_from_food_id = reference_col("foods", nullable=True, comment="外键，关联到foods表，记录该项是否由某个库存食物添加而来")
    
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
    
    # 索引
    __table_args__ = (
        db.Index('idx_user_checked', 'user_id', 'is_checked'),
    )
    
    # 关联关系
    user = relationship("User", back_populates="shopping_items")
    source_food = relationship("Food", back_populates="shopping_items")
    
    def __repr__(self):
        return f"<ShoppingListItem({self.item_name!r})>"


class PushToken(PkModel):
    """推送令牌模型"""
    
    __tablename__ = "push_tokens"
    
    user_id = reference_col("users", nullable=False, comment="外键，关联到users表")
    device_token = Column(db.String(255), nullable=False, unique=True, comment="从APNS或FCM获取的设备令牌")
    device_type = Column(
        db.Enum('ios', 'android', name='device_type_enum'),
        nullable=False,
        comment="设备类型"
    )
    is_active = Column(db.Boolean, nullable=False, default=True, comment="令牌是否有效")
    
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
    user = relationship("User", back_populates="push_tokens")
    
    def __repr__(self):
        return f"<PushToken({self.device_type!r})>"