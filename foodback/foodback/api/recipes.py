"""AI菜谱生成相关API"""
from flask import Blueprint, request, jsonify
from typing import Dict, List, Any, Optional
import json
import random
from datetime import datetime, timedelta

from ..utils.response_utils import success_response, error_response, validation_error_response
from ..auth.decorators import jwt_required
from ..models import Food
from ..database import db

bp = Blueprint('recipes', __name__, url_prefix='/api/recipes')

# 模拟菜谱数据库 - 实际项目中应该集成真实的AI菜谱生成服务
RECIPE_TEMPLATES = {
    '炒菜类': [
        {
            'name': '{main_ingredient}炒{side_ingredient}',
            'cooking_time': 15,
            'difficulty': '简单',
            'cuisine': '家常菜',
            'steps': [
                '将{main_ingredient}洗净切好备用',
                '将{side_ingredient}处理干净',
                '热锅下油，爆香葱姜蒜',
                '下{main_ingredient}炒至半熟',
                '加入{side_ingredient}一起炒制',
                '调味炒匀即可出锅'
            ],
            'tips': '火候要掌握好，避免炒过头影响口感'
        },
        {
            'name': '蒜蓉{main_ingredient}',
            'cooking_time': 10,
            'difficulty': '简单',
            'cuisine': '粤菜',
            'steps': [
                '将{main_ingredient}洗净处理好',
                '大蒜切末备用',
                '热锅下油，爆香蒜蓉',
                '下{main_ingredient}大火炒制',
                '调味后炒匀即可'
            ],
            'tips': '蒜蓉要小火慢炒，避免炒糊'
        }
    ],
    '汤类': [
        {
            'name': '{main_ingredient}{side_ingredient}汤',
            'cooking_time': 30,
            'difficulty': '简单',
            'cuisine': '家常菜',
            'steps': [
                '将{main_ingredient}和{side_ingredient}洗净切好',
                '锅中加水烧开',
                '下{main_ingredient}煮10分钟',
                '加入{side_ingredient}继续煮',
                '调味后即可出锅'
            ],
            'tips': '煮汤时间不宜过长，保持食材的营养'
        },
        {
            'name': '清汤{main_ingredient}',
            'cooking_time': 20,
            'difficulty': '简单',
            'cuisine': '清淡',
            'steps': [
                '将{main_ingredient}洗净处理',
                '锅中加清水烧开',
                '下{main_ingredient}煮至软烂',
                '加盐调味即可'
            ],
            'tips': '保持清淡口味，突出食材本味'
        }
    ],
    '蒸菜类': [
        {
            'name': '清蒸{main_ingredient}',
            'cooking_time': 25,
            'difficulty': '简单',
            'cuisine': '粤菜',
            'steps': [
                '将{main_ingredient}洗净摆盘',
                '撒上姜丝和葱丝',
                '蒸锅水开后放入蒸15分钟',
                '出锅后淋上蒸鱼豉油',
                '热油爆香后浇在上面'
            ],
            'tips': '蒸制时间要根据食材厚度调整'
        }
    ],
    '凉拌类': [
        {
            'name': '凉拌{main_ingredient}',
            'cooking_time': 10,
            'difficulty': '简单',
            'cuisine': '家常菜',
            'steps': [
                '将{main_ingredient}洗净切丝',
                '用盐腌制10分钟后挤去水分',
                '加入蒜蓉、醋、生抽',
                '淋上香油拌匀即可'
            ],
            'tips': '腌制时间不宜过长，保持脆嫩口感'
        }
    ]
}

# 食材分类映射
INGREDIENT_CATEGORIES = {
    '蔬菜': ['白菜', '菠菜', '芹菜', '韭菜', '豆芽', '萝卜', '胡萝卜', '土豆', '番茄', '黄瓜', '茄子', '青椒', '洋葱'],
    '肉类': ['猪肉', '牛肉', '鸡肉', '鱼肉', '虾', '蟹', '鸭肉', '羊肉'],
    '豆制品': ['豆腐', '豆干', '腐竹', '豆皮'],
    '蛋类': ['鸡蛋', '鸭蛋', '鹌鹑蛋'],
    '菌类': ['香菇', '平菇', '金针菇', '木耳', '银耳']
}

# 营养搭配建议
NUTRITION_PAIRING = {
    '蛋白质': ['肉类', '蛋类', '豆制品'],
    '维生素': ['蔬菜', '水果'],
    '纤维': ['蔬菜', '菌类'],
    '钙质': ['豆制品', '蛋类']
}

# 烹饪方式适配
COOKING_METHOD_MAPPING = {
    '嫩菜': ['炒菜类', '凉拌类'],
    '硬菜': ['炒菜类', '汤类', '蒸菜类'],
    '肉类': ['炒菜类', '汤类', '蒸菜类'],
    '蛋类': ['炒菜类', '蒸菜类'],
    '豆制品': ['炒菜类', '汤类']
}


@bp.route('/generate', methods=['POST'])
@jwt_required
def generate_recipes():
    """基于临期食物生成AI菜谱"""
    current_user = request.current_user
    data = request.get_json()
    
    if not data:
        return validation_error_response('请提供生成参数')
    
    food_ids = data.get('food_ids', [])
    preferences = data.get('preferences', {})
    
    if not food_ids:
        return validation_error_response('请选择要使用的食物')
    
    try:
        # 获取选中的食物
        foods = Food.query.filter(
            Food.id.in_(food_ids),
            Food.user_id == current_user.id,
            Food.is_deleted == False
        ).all()
        
        if not foods:
            return error_response('未找到有效的食物')
        
        # 生成菜谱
        recipes = generate_ai_recipes(foods, preferences)
        
        # 计算营养信息
        nutrition_analysis = analyze_recipe_nutrition(recipes, foods)
        
        result = {
            'recipes': recipes,
            'nutrition_analysis': nutrition_analysis,
            'generation_time': datetime.now().isoformat(),
            'total_recipes': len(recipes),
            'used_ingredients': [{'id': f.id, 'name': f.name, 'quantity': f.quantity} for f in foods]
        }
        
        return success_response(result, 'AI菜谱生成完成')
        
    except Exception as e:
        return error_response(f'菜谱生成失败: {str(e)}')


@bp.route('/expiring-ingredients', methods=['GET'])
@jwt_required
def get_expiring_ingredients():
    """获取即将过期的食材"""
    current_user = request.current_user
    days = request.args.get('days', 3, type=int)
    
    try:
        # 计算截止日期
        cutoff_date = datetime.now() + timedelta(days=days)
        
        # 查询即将过期的食物
        expiring_foods = Food.query.filter(
            Food.user_id == current_user.id,
            Food.is_deleted == False,
            Food.quantity > 0,
            Food.expiry_date <= cutoff_date
        ).order_by(Food.expiry_date.asc()).all()
        
        # 按过期时间分组
        urgent = []  # 1天内过期
        soon = []    # 2-3天内过期
        
        now = datetime.now()
        for food in expiring_foods:
            days_until_expiry = (food.expiry_date - now).days
            
            food_data = {
                'id': food.id,
                'name': food.name,
                'quantity': food.quantity,
                'unit': food.unit,
                'expiry_date': food.expiry_date.isoformat(),
                'days_until_expiry': days_until_expiry,
                'category': food.category.name if food.category else '未分类',
                'image_url': food.image_url
            }
            
            if days_until_expiry <= 1:
                urgent.append(food_data)
            else:
                soon.append(food_data)
        
        result = {
            'urgent': urgent,
            'soon': soon,
            'total_count': len(expiring_foods),
            'urgent_count': len(urgent),
            'soon_count': len(soon)
        }
        
        return success_response(result, '即将过期食材获取成功')
        
    except Exception as e:
        return error_response(f'获取过期食材失败: {str(e)}')


@bp.route('/recipe-history', methods=['GET'])
@jwt_required
def get_recipe_history():
    """获取用户的菜谱生成历史"""
    current_user = request.current_user
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # 这里应该从数据库获取历史记录
    # 目前返回模拟数据
    mock_history = [
        {
            'id': 1,
            'generated_at': (datetime.now() - timedelta(days=1)).isoformat(),
            'recipe_count': 3,
            'ingredients_used': ['番茄', '鸡蛋', '青椒'],
            'recipes': ['番茄炒蛋', '青椒炒蛋', '番茄青椒汤']
        },
        {
            'id': 2,
            'generated_at': (datetime.now() - timedelta(days=3)).isoformat(),
            'recipe_count': 2,
            'ingredients_used': ['土豆', '胡萝卜'],
            'recipes': ['土豆炒胡萝卜', '土豆胡萝卜汤']
        }
    ]
    
    # 分页处理
    start = (page - 1) * per_page
    end = start + per_page
    paginated_history = mock_history[start:end]
    
    result = {
        'history': paginated_history,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': len(mock_history),
            'pages': (len(mock_history) + per_page - 1) // per_page
        }
    }
    
    return success_response(result, '菜谱历史获取成功')


@bp.route('/save-recipe', methods=['POST'])
@jwt_required
def save_recipe():
    """保存喜欢的菜谱"""
    current_user = request.current_user
    data = request.get_json()
    
    if not data:
        return validation_error_response('请提供菜谱数据')
    
    recipe_data = data.get('recipe')
    if not recipe_data:
        return validation_error_response('请提供菜谱信息')
    
    # 这里应该保存到数据库
    # 目前返回成功响应
    
    result = {
        'saved_at': datetime.now().isoformat(),
        'recipe_id': random.randint(1000, 9999)
    }
    
    return success_response(result, '菜谱保存成功')


def generate_ai_recipes(foods: List[Food], preferences: Dict[str, Any]) -> List[Dict[str, Any]]:
    """生成AI菜谱"""
    recipes = []
    used_ingredients = set()
    
    # 根据食材数量和类型生成菜谱
    main_ingredients = [f for f in foods if f.quantity >= 100]  # 主要食材
    side_ingredients = [f for f in foods if f.quantity < 100]   # 辅助食材
    
    # 生成主菜
    for main_food in main_ingredients[:3]:  # 最多3个主菜
        if main_food.id in used_ingredients:
            continue
            
        # 选择合适的烹饪方式
        cooking_methods = get_suitable_cooking_methods(main_food.name)
        selected_method = random.choice(cooking_methods)
        
        # 选择模板
        templates = RECIPE_TEMPLATES.get(selected_method, RECIPE_TEMPLATES['炒菜类'])
        template = random.choice(templates)
        
        # 选择配菜
        side_food = None
        for side in side_ingredients:
            if side.id not in used_ingredients and is_good_pairing(main_food.name, side.name):
                side_food = side
                break
        
        # 生成菜谱
        recipe = generate_recipe_from_template(template, main_food, side_food, preferences)
        recipes.append(recipe)
        
        used_ingredients.add(main_food.id)
        if side_food:
            used_ingredients.add(side_food.id)
    
    # 如果还有剩余食材，生成简单料理
    remaining_foods = [f for f in foods if f.id not in used_ingredients]
    if remaining_foods:
        for food in remaining_foods[:2]:  # 最多2个简单料理
            simple_recipe = generate_simple_recipe(food, preferences)
            recipes.append(simple_recipe)
    
    return recipes


def generate_recipe_from_template(template: Dict[str, Any], main_food: Food, side_food: Optional[Food], preferences: Dict[str, Any]) -> Dict[str, Any]:
    """根据模板生成具体菜谱"""
    recipe_name = template['name'].format(
        main_ingredient=main_food.name,
        side_ingredient=side_food.name if side_food else '蒜蓉'
    )
    
    # 处理步骤
    steps = []
    for step in template['steps']:
        formatted_step = step.format(
            main_ingredient=main_food.name,
            side_ingredient=side_food.name if side_food else '蒜蓉'
        )
        steps.append(formatted_step)
    
    # 计算用量
    ingredients = [
        {
            'name': main_food.name,
            'amount': min(main_food.quantity, 200),  # 最多用200g
            'unit': main_food.unit or 'g'
        }
    ]
    
    if side_food:
        ingredients.append({
            'name': side_food.name,
            'amount': min(side_food.quantity, 100),
            'unit': side_food.unit or 'g'
        })
    
    # 添加调料
    seasonings = get_seasonings_for_recipe(template['cuisine'])
    ingredients.extend(seasonings)
    
    return {
        'id': random.randint(1000, 9999),
        'name': recipe_name,
        'description': f'使用{main_food.name}制作的{template["cuisine"]}',
        'cooking_time': template['cooking_time'],
        'difficulty': template['difficulty'],
        'cuisine': template['cuisine'],
        'servings': 2,
        'ingredients': ingredients,
        'steps': steps,
        'tips': template['tips'],
        'nutrition': estimate_recipe_nutrition(ingredients),
        'tags': generate_recipe_tags(main_food, side_food, template)
    }


def generate_simple_recipe(food: Food, preferences: Dict[str, Any]) -> Dict[str, Any]:
    """生成简单料理"""
    simple_methods = {
        '蔬菜': '清炒{ingredient}',
        '肉类': '香煎{ingredient}',
        '蛋类': '水煮{ingredient}',
        '豆制品': '红烧{ingredient}'
    }
    
    food_category = classify_ingredient(food.name)
    recipe_name = simple_methods.get(food_category, '清炒{ingredient}').format(ingredient=food.name)
    
    return {
        'id': random.randint(1000, 9999),
        'name': recipe_name,
        'description': f'简单快手的{food.name}料理',
        'cooking_time': 10,
        'difficulty': '简单',
        'cuisine': '家常菜',
        'servings': 1,
        'ingredients': [
            {
                'name': food.name,
                'amount': min(food.quantity, 150),
                'unit': food.unit or 'g'
            },
            {'name': '盐', 'amount': 2, 'unit': 'g'},
            {'name': '油', 'amount': 10, 'unit': 'ml'}
        ],
        'steps': [
            f'将{food.name}洗净处理好',
            '热锅下油',
            f'下{food.name}炒制',
            '调味后即可出锅'
        ],
        'tips': '简单快手，保持食材原味',
        'nutrition': {'calories': 120, 'protein': 8, 'fat': 6, 'carbs': 10},
        'tags': ['简单', '快手', '家常']
    }


def get_suitable_cooking_methods(ingredient: str) -> List[str]:
    """获取适合的烹饪方式"""
    category = classify_ingredient(ingredient)
    return COOKING_METHOD_MAPPING.get(category, ['炒菜类'])


def classify_ingredient(ingredient: str) -> str:
    """分类食材"""
    for category, ingredients in INGREDIENT_CATEGORIES.items():
        if any(ing in ingredient for ing in ingredients):
            return category
    return '其他'


def is_good_pairing(ingredient1: str, ingredient2: str) -> bool:
    """判断两种食材是否适合搭配"""
    # 简单的搭配逻辑
    category1 = classify_ingredient(ingredient1)
    category2 = classify_ingredient(ingredient2)
    
    # 肉类+蔬菜是好搭配
    if (category1 == '肉类' and category2 == '蔬菜') or (category1 == '蔬菜' and category2 == '肉类'):
        return True
    
    # 蛋类+蔬菜是好搭配
    if (category1 == '蛋类' and category2 == '蔬菜') or (category1 == '蔬菜' and category2 == '蛋类'):
        return True
    
    return True  # 默认都可以搭配


def get_seasonings_for_recipe(cuisine: str) -> List[Dict[str, Any]]:
    """获取菜系对应的调料"""
    seasonings_map = {
        '粤菜': [
            {'name': '生抽', 'amount': 5, 'unit': 'ml'},
            {'name': '蒸鱼豉油', 'amount': 3, 'unit': 'ml'},
            {'name': '料酒', 'amount': 5, 'unit': 'ml'}
        ],
        '川菜': [
            {'name': '郫县豆瓣酱', 'amount': 10, 'unit': 'g'},
            {'name': '花椒', 'amount': 2, 'unit': 'g'},
            {'name': '干辣椒', 'amount': 3, 'unit': '个'}
        ],
        '家常菜': [
            {'name': '盐', 'amount': 3, 'unit': 'g'},
            {'name': '生抽', 'amount': 5, 'unit': 'ml'},
            {'name': '油', 'amount': 15, 'unit': 'ml'}
        ]
    }
    
    return seasonings_map.get(cuisine, seasonings_map['家常菜'])


def estimate_recipe_nutrition(ingredients: List[Dict[str, Any]]) -> Dict[str, float]:
    """估算菜谱营养成分"""
    # 简单的营养估算
    total_calories = 0
    total_protein = 0
    total_fat = 0
    total_carbs = 0
    
    for ingredient in ingredients:
        amount = ingredient['amount']
        name = ingredient['name']
        
        # 根据食材类型估算营养
        if any(meat in name for meat in ['肉', '鸡', '鱼', '虾']):
            total_calories += amount * 1.5
            total_protein += amount * 0.2
            total_fat += amount * 0.1
        elif any(veg in name for veg in ['菜', '萝卜', '番茄', '黄瓜']):
            total_calories += amount * 0.2
            total_protein += amount * 0.02
            total_carbs += amount * 0.05
        elif '蛋' in name:
            total_calories += amount * 1.4
            total_protein += amount * 0.13
            total_fat += amount * 0.11
    
    return {
        'calories': round(total_calories, 1),
        'protein': round(total_protein, 1),
        'fat': round(total_fat, 1),
        'carbs': round(total_carbs, 1)
    }


def generate_recipe_tags(main_food: Food, side_food: Optional[Food], template: Dict[str, Any]) -> List[str]:
    """生成菜谱标签"""
    tags = [template['difficulty'], template['cuisine']]
    
    # 根据烹饪时间添加标签
    if template['cooking_time'] <= 15:
        tags.append('快手')
    elif template['cooking_time'] >= 30:
        tags.append('慢炖')
    
    # 根据食材添加标签
    main_category = classify_ingredient(main_food.name)
    if main_category in ['蔬菜']:
        tags.append('素食')
    elif main_category in ['肉类']:
        tags.append('荤菜')
    
    # 添加营养标签
    if side_food:
        tags.append('营养搭配')
    
    return list(set(tags))  # 去重


def analyze_recipe_nutrition(recipes: List[Dict[str, Any]], foods: List[Food]) -> Dict[str, Any]:
    """分析菜谱营养信息"""
    total_nutrition = {'calories': 0, 'protein': 0, 'fat': 0, 'carbs': 0}
    
    for recipe in recipes:
        nutrition = recipe.get('nutrition', {})
        for key in total_nutrition:
            total_nutrition[key] += nutrition.get(key, 0)
    
    # 计算营养密度
    total_weight = sum(f.quantity for f in foods)
    nutrition_density = total_nutrition['calories'] / total_weight if total_weight > 0 else 0
    
    # 生成营养建议
    recommendations = []
    if total_nutrition['protein'] < 50:
        recommendations.append('建议增加蛋白质摄入')
    if total_nutrition['calories'] > 800:
        recommendations.append('注意控制总热量')
    if len(recipes) >= 3:
        recommendations.append('菜品丰富，营养均衡')
    
    return {
        'total_nutrition': total_nutrition,
        'nutrition_density': round(nutrition_density, 2),
        'recommendations': recommendations,
        'recipe_count': len(recipes)
    }