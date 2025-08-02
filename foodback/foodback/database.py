# -*- coding: utf-8 -*-
"""Database module, including the SQLAlchemy database object and DB-related utilities."""
from typing import Optional, Type, TypeVar

from .compat import basestring
from .extensions import db

T = TypeVar("T", bound="PkModel")

# Alias common SQLAlchemy names
Column = db.Column
relationship = db.relationship


class CRUDMixin(object):
    """Mixin that adds convenience methods for CRUD (create, read, update, delete) operations."""

    @classmethod
    def create(cls, **kwargs):
        """Create a new record and save it the database."""
        instance = cls(**kwargs)
        return instance.save()

    def update(self, commit=True, **kwargs):
        """Update specific fields of a record."""
        for attr, value in kwargs.items():
            setattr(self, attr, value)
        if commit:
            return self.save()
        return self

    def save(self, commit=True):
        """Save the record."""
        db.session.add(self)
        if commit:
            db.session.commit()
        return self

    def delete(self, commit: bool = True) -> None:
        """Remove the record from the database."""
        db.session.delete(self)
        if commit:
            return db.session.commit()
        return

    def soft_delete(self, commit: bool = True):
        """软删除记录（如果模型支持is_deleted字段）"""
        if hasattr(self, 'is_deleted'):
            self.is_deleted = True
            if commit:
                return self.save()
        return self

    @classmethod
    def get_all(cls, include_deleted=False):
        """获取所有记录"""
        query = cls.query
        if hasattr(cls, 'is_deleted') and not include_deleted:
            query = query.filter(cls.is_deleted == False)
        return query.all()

    @classmethod
    def get_by_user(cls, user_id, include_deleted=False):
        """根据用户ID获取记录"""
        if not hasattr(cls, 'user_id'):
            return []
        
        query = cls.query.filter(cls.user_id == user_id)
        if hasattr(cls, 'is_deleted') and not include_deleted:
            query = query.filter(cls.is_deleted == False)
        return query.all()

    @classmethod
    def paginate_query(cls, page=1, per_page=20, **filters):
        """分页查询"""
        query = cls.query
        
        # 应用过滤条件
        for key, value in filters.items():
            if hasattr(cls, key) and value is not None:
                query = query.filter(getattr(cls, key) == value)
        
        # 软删除过滤
        if hasattr(cls, 'is_deleted'):
            query = query.filter(cls.is_deleted == False)
        
        return query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

    def to_dict(self, exclude=None):
        """转换为字典格式"""
        exclude = exclude or []
        result = {}
        
        for column in self.__table__.columns:
            if column.name not in exclude:
                value = getattr(self, column.name)
                # 处理日期时间类型
                if hasattr(value, 'isoformat'):
                    value = value.isoformat()
                result[column.name] = value
        
        return result


class Model(CRUDMixin, db.Model):
    """Base model class that includes CRUD convenience methods."""

    __abstract__ = True


class PkModel(Model):
    """Base model class that includes CRUD convenience methods, plus adds a 'primary key' column named ``id``."""

    __abstract__ = True
    id = Column(db.Integer, primary_key=True)

    @classmethod
    def get_by_id(cls: Type[T], record_id, include_deleted=False) -> Optional[T]:
        """Get record by ID."""
        if not any(
            (
                isinstance(record_id, basestring) and record_id.isdigit(),
                isinstance(record_id, (int, float)),
            )
        ):
            return None
        
        query = cls.query.filter(cls.id == int(record_id))
        
        # 软删除过滤
        if hasattr(cls, 'is_deleted') and not include_deleted:
            query = query.filter(cls.is_deleted == False)
        
        return query.first()

    @classmethod
    def get_by_ids(cls: Type[T], record_ids, include_deleted=False) -> list:
        """根据ID列表批量获取记录"""
        if not record_ids:
            return []
        
        # 过滤有效的ID
        valid_ids = []
        for record_id in record_ids:
            if any(
                (
                    isinstance(record_id, basestring) and record_id.isdigit(),
                    isinstance(record_id, (int, float)),
                )
            ):
                valid_ids.append(int(record_id))
        
        if not valid_ids:
            return []
        
        query = cls.query.filter(cls.id.in_(valid_ids))
        
        # 软删除过滤
        if hasattr(cls, 'is_deleted') and not include_deleted:
            query = query.filter(cls.is_deleted == False)
        
        return query.all()

    @classmethod
    def exists(cls, record_id) -> bool:
        """检查记录是否存在"""
        return cls.get_by_id(record_id) is not None


# def reference_col(
#     tablename, nullable=False, pk_name="id", foreign_key_kwargs=None, column_kwargs=None
# ):
#     """Column that adds primary key foreign key reference.

#     Usage: ::

#         category_id = reference_col('category')
#         category = relationship('Category', backref='categories')
#     """
#     foreign_key_kwargs = foreign_key_kwargs or {}
#     column_kwargs = column_kwargs or {}

#     return Column(
#         db.ForeignKey(f"{tablename}.{pk_name}", **foreign_key_kwargs),
#         nullable=nullable,
#         **column_kwargs,
#     )


def reference_col(tablename, nullable=False, pk_name="id", **kwargs):
    """一个创建外键列的辅助函数。
    
    它接收所有 db.Column 支持的额外关键字参数, 例如 `comment`, `index` 等。
    """
    return db.Column(
        db.ForeignKey(f"{tablename}.{pk_name}"),
        nullable=nullable,
        **kwargs
    )