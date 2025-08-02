"""API模块"""

from .categories import blueprint as categories_blueprint
from .locations import blueprint as locations_blueprint
from .shopping import blueprint as shopping_blueprint
from .foods import blueprint as foods_blueprint
from .ocr import bp as ocr_blueprint
from .nutrition import bp as nutrition_blueprint
from .recipes import bp as recipes_blueprint
from .push import bp as push_blueprint