"""Main application package."""

# 导入所有模型以确保SQLAlchemy能够正确识别关系
from foodback.user.models import User
from foodback.models import Category, Location, Food, ShoppingListItem, PushToken
