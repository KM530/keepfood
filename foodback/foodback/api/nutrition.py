"""营养分析相关API"""
from flask import Blueprint, request, jsonify
from typing import Dict, List, Any, Optional
import json

from ..utils.response_utils import success_response, error_response, validation_error_response
from ..auth.decorators import jwt_required

bp = Blueprint('nutrition', __name__, url_prefix='/api/nutrition')

# 营养数据库 - 实际项目中应该从专业的营养数据库获取
NUTRITION_DATABASE = {
    '苹果': {
        'calories_per_100g': 52,
        'protein': 0.3,
        'fat': 0.2,
        'carbs': 14.0,
        'fiber': 2.4,
        'sugar': 10.4,
        'sodium': 1,
        'potassium': 107,
        'calcium': 6,
        'iron': 0.1,
        'vitamin_c': 4.6,
        'vitamin_a': 54,
        'water': 85.6,
        'category': '水果',
        'glycemic_index': 36
    },
    '香蕉': {
        'calories_per_100g': 89,
        'protein': 1.1,
        'fat': 0.3,
        'carbs': 23.0,
        'fiber': 2.6,
        'sugar': 12.2,
        'sodium': 1,
        'potassium': 358,
        'calcium': 5,
        'iron': 0.3,
        'vitamin_c': 8.7,
        'vitamin_a': 64,
        'water': 74.9,
        'category': '水果',
        'glycemic_index': 51
    },
    '大米': {
        'calories_per_100g': 130,
        'protein': 2.7,
        'fat': 0.3,
        'carbs': 28.0,
        'fiber': 0.4,
        'sugar': 0.1,
        'sodium': 5,
        'potassium': 35,
        'calcium': 28,
        'iron': 0.8,
        'vitamin_c': 0,
        'vitamin_a': 0,
        'water': 68.4,
        'category': '谷物',
        'glycemic_index': 73
    },
    '鸡蛋': {
        'calories_per_100g': 155,
        'protein': 13.0,
        'fat': 11.0,
        'carbs': 1.1,
        'fiber': 0,
        'sugar': 1.1,
        'sodium': 124,
        'potassium': 138,
        'calcium': 56,
        'iron': 1.8,
        'vitamin_c': 0,
        'vitamin_a': 540,
        'water': 76.2,
        'category': '蛋白质',
        'glycemic_index': 0
    },
    '牛奶': {
        'calories_per_100g': 42,
        'protein': 3.4,
        'fat': 1.0,
        'carbs': 5.0,
        'fiber': 0,
        'sugar': 5.0,
        'sodium': 44,
        'potassium': 150,
        'calcium': 113,
        'iron': 0.0,
        'vitamin_c': 0,
        'vitamin_a': 46,
        'water': 90.8,
        'category': '乳制品',
        'glycemic_index': 15
    }
}

# 每日营养素推荐摄入量 (成年人)
DAILY_RECOMMENDED_INTAKE = {
    'calories': {'male': 2500, 'female': 2000},
    'protein': {'male': 65, 'female': 50},  # 克
    'fat': {'male': 78, 'female': 62},      # 克
    'carbs': {'male': 300, 'female': 230},  # 克
    'fiber': {'male': 30, 'female': 25},    # 克
    'sodium': {'male': 2300, 'female': 2300},  # 毫克
    'potassium': {'male': 3500, 'female': 3500},  # 毫克
    'calcium': {'male': 1000, 'female': 1000},    # 毫克
    'iron': {'male': 8, 'female': 18},      # 毫克
    'vitamin_c': {'male': 90, 'female': 75}, # 毫克
    'vitamin_a': {'male': 900, 'female': 700}  # 微克
}

# 健康目标配置
HEALTH_GOALS = {
    'weight_loss': {
        'name': '减重',
        'calorie_adjustment': -0.2,  # 减少20%卡路里
        'protein_boost': 1.2,       # 增加20%蛋白质
        'carb_reduction': 0.8       # 减少20%碳水化合物
    },
    'muscle_gain': {
        'name': '增肌',
        'calorie_adjustment': 0.15,  # 增加15%卡路里
        'protein_boost': 1.5,       # 增加50%蛋白质
        'carb_boost': 1.1           # 增加10%碳水化合物
    },
    'maintenance': {
        'name': '维持',
        'calorie_adjustment': 0,
        'protein_boost': 1.0,
        'carb_adjustment': 1.0
    }
}


@bp.route('/analyze', methods=['POST'])
@jwt_required
def analyze_nutrition():
    """分析食物营养成分"""
    current_user = request.current_user
    data = request.get_json()
    
    if not data:
        return validation_error_response('请提供分析数据')
    
    foods = data.get('foods', [])
    if not foods:
        return validation_error_response('请提供要分析的食物列表')
    
    # 验证食物数据格式
    for food in foods:
        if not all(key in food for key in ['name', 'quantity']):
            return validation_error_response('食物数据格式错误，需要包含name和quantity字段')
    
    try:
        # 计算营养成分
        nutrition_result = calculate_nutrition(foods)
        
        # 生成营养建议
        recommendations = generate_nutrition_recommendations(nutrition_result)
        
        # 健康评估
        health_assessment = assess_health_status(nutrition_result)
        
        result = {
            'nutrition_summary': nutrition_result,
            'recommendations': recommendations,
            'health_assessment': health_assessment,
            'analysis_date': '2024-01-01',
            'total_foods': len(foods)
        }
        
        return success_response(result, '营养分析完成')
        
    except Exception as e:
        return error_response(f'营养分析失败: {str(e)}')


@bp.route('/calculate-calories', methods=['POST'])
@jwt_required
def calculate_calories():
    """计算食物卡路里"""
    current_user = request.current_user
    data = request.get_json()
    
    if not data:
        return validation_error_response('请提供计算数据')
    
    food_name = data.get('name', '').strip()
    quantity = data.get('quantity', 0)
    unit = data.get('unit', 'g')
    
    if not food_name:
        return validation_error_response('请提供食物名称')
    
    if not quantity or quantity <= 0:
        return validation_error_response('请提供有效的数量')
    
    try:
        # 查找营养数据
        nutrition_data = find_nutrition_data(food_name)
        
        if not nutrition_data:
            return error_response(f'未找到"{food_name}"的营养数据')
        
        # 计算实际营养值
        actual_nutrition = calculate_actual_nutrition(nutrition_data, quantity, unit)
        
        result = {
            'food_name': food_name,
            'quantity': quantity,
            'unit': unit,
            'nutrition': actual_nutrition,
            'calories': actual_nutrition['calories'],
            'nutrition_density': actual_nutrition['calories'] / quantity if quantity > 0 else 0
        }
        
        return success_response(result, '卡路里计算完成')
        
    except Exception as e:
        return error_response(f'卡路里计算失败: {str(e)}')


@bp.route('/daily-goal', methods=['POST'])
@jwt_required
def calculate_daily_goal():
    """计算每日营养目标"""
    current_user = request.current_user
    data = request.get_json()
    
    if not data:
        return validation_error_response('请提供用户信息')
    
    gender = data.get('gender', 'male')  # male/female
    age = data.get('age', 30)
    weight = data.get('weight', 70)  # kg
    height = data.get('height', 170)  # cm
    activity_level = data.get('activity_level', 'moderate')  # sedentary/light/moderate/active/very_active
    health_goal = data.get('health_goal', 'maintenance')  # weight_loss/muscle_gain/maintenance
    
    try:
        # 计算基础代谢率 (BMR)
        bmr = calculate_bmr(gender, age, weight, height)
        
        # 根据活动水平计算总能量消耗 (TDEE)
        tdee = calculate_tdee(bmr, activity_level)
        
        # 根据健康目标调整
        adjusted_goals = adjust_goals_for_health_target(tdee, health_goal, gender)
        
        # 计算BMI和健康状态
        bmi = calculate_bmi(weight, height)
        health_status = assess_bmi_status(bmi)
        
        result = {
            'user_info': {
                'gender': gender,
                'age': age,
                'weight': weight,
                'height': height,
                'activity_level': activity_level,
                'health_goal': health_goal
            },
            'calculated_values': {
                'bmr': round(bmr, 1),
                'tdee': round(tdee, 1),
                'bmi': round(bmi, 1),
                'health_status': health_status
            },
            'daily_goals': adjusted_goals,
            'recommendations': generate_daily_recommendations(adjusted_goals, health_goal)
        }
        
        return success_response(result, '每日营养目标计算完成')
        
    except Exception as e:
        return error_response(f'目标计算失败: {str(e)}')


@bp.route('/food-database', methods=['GET'])
@jwt_required
def get_food_database():
    """获取食物营养数据库"""
    search_query = request.args.get('q', '').strip()
    category = request.args.get('category', '')
    
    results = []
    
    for food_name, nutrition_data in NUTRITION_DATABASE.items():
        # 搜索过滤
        if search_query and search_query.lower() not in food_name.lower():
            continue
        
        # 分类过滤
        if category and nutrition_data.get('category', '') != category:
            continue
        
        results.append({
            'name': food_name,
            'category': nutrition_data.get('category', ''),
            'calories_per_100g': nutrition_data['calories_per_100g'],
            'protein': nutrition_data['protein'],
            'fat': nutrition_data['fat'],
            'carbs': nutrition_data['carbs'],
            'fiber': nutrition_data['fiber']
        })
    
    return success_response({
        'foods': results,
        'total': len(results),
        'query': search_query,
        'category': category
    })


def find_nutrition_data(food_name: str) -> Optional[Dict[str, Any]]:
    """查找食物营养数据"""
    # 精确匹配
    if food_name in NUTRITION_DATABASE:
        return NUTRITION_DATABASE[food_name]
    
    # 模糊匹配
    for name, data in NUTRITION_DATABASE.items():
        if food_name in name or name in food_name:
            return data
    
    return None


def calculate_actual_nutrition(nutrition_data: Dict[str, Any], quantity: float, unit: str) -> Dict[str, float]:
    """计算实际营养值"""
    # 单位转换为克
    quantity_in_grams = quantity
    if unit == 'kg':
        quantity_in_grams = quantity * 1000
    elif unit == '个' and 'egg' in nutrition_data.get('category', '').lower():
        quantity_in_grams = quantity * 50  # 假设一个鸡蛋50g
    elif unit == '杯' and 'milk' in nutrition_data.get('category', '').lower():
        quantity_in_grams = quantity * 240  # 假设一杯牛奶240ml
    
    # 计算比例
    ratio = quantity_in_grams / 100.0
    
    result = {}
    for key, value in nutrition_data.items():
        if isinstance(value, (int, float)) and key != 'glycemic_index':
            result[key.replace('_per_100g', '')] = round(value * ratio, 2)
    
    return result


def calculate_nutrition(foods: List[Dict[str, Any]]) -> Dict[str, Any]:
    """计算食物列表的总营养成分"""
    total_nutrition = {
        'calories': 0,
        'protein': 0,
        'fat': 0,
        'carbs': 0,
        'fiber': 0,
        'sugar': 0,
        'sodium': 0,
        'potassium': 0,
        'calcium': 0,
        'iron': 0,
        'vitamin_c': 0,
        'vitamin_a': 0
    }
    
    food_details = []
    
    for food in foods:
        food_name = food['name']
        quantity = food['quantity']
        unit = food.get('unit', 'g')
        
        nutrition_data = find_nutrition_data(food_name)
        if nutrition_data:
            actual_nutrition = calculate_actual_nutrition(nutrition_data, quantity, unit)
            
            # 累加到总营养中
            for key in total_nutrition:
                if key in actual_nutrition:
                    total_nutrition[key] += actual_nutrition[key]
            
            food_details.append({
                'name': food_name,
                'quantity': quantity,
                'unit': unit,
                'nutrition': actual_nutrition
            })
    
    return {
        'total_nutrition': total_nutrition,
        'food_details': food_details,
        'macros_percentage': calculate_macros_percentage(total_nutrition)
    }


def calculate_macros_percentage(nutrition: Dict[str, float]) -> Dict[str, float]:
    """计算宏量营养素百分比"""
    protein_calories = nutrition['protein'] * 4
    fat_calories = nutrition['fat'] * 9
    carb_calories = nutrition['carbs'] * 4
    total_calories = protein_calories + fat_calories + carb_calories
    
    if total_calories == 0:
        return {'protein': 0, 'fat': 0, 'carbs': 0}
    
    return {
        'protein': round((protein_calories / total_calories) * 100, 1),
        'fat': round((fat_calories / total_calories) * 100, 1),
        'carbs': round((carb_calories / total_calories) * 100, 1)
    }


def calculate_bmr(gender: str, age: int, weight: float, height: float) -> float:
    """计算基础代谢率 (Harris-Benedict公式)"""
    if gender.lower() == 'male':
        return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
    else:
        return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)


def calculate_tdee(bmr: float, activity_level: str) -> float:
    """计算总能量消耗"""
    activity_multipliers = {
        'sedentary': 1.2,      # 久坐
        'light': 1.375,        # 轻度活动
        'moderate': 1.55,      # 中度活动
        'active': 1.725,       # 积极活动
        'very_active': 1.9     # 非常活跃
    }
    
    multiplier = activity_multipliers.get(activity_level, 1.55)
    return bmr * multiplier


def calculate_bmi(weight: float, height: float) -> float:
    """计算BMI"""
    height_in_meters = height / 100.0
    return weight / (height_in_meters ** 2)


def assess_bmi_status(bmi: float) -> str:
    """评估BMI状态"""
    if bmi < 18.5:
        return '偏瘦'
    elif bmi < 25:
        return '正常'
    elif bmi < 30:
        return '超重'
    else:
        return '肥胖'


def adjust_goals_for_health_target(tdee: float, health_goal: str, gender: str) -> Dict[str, float]:
    """根据健康目标调整营养目标"""
    base_goals = DAILY_RECOMMENDED_INTAKE.copy()
    goal_config = HEALTH_GOALS.get(health_goal, HEALTH_GOALS['maintenance'])
    
    # 调整卡路里
    adjusted_calories = tdee * (1 + goal_config['calorie_adjustment'])
    
    # 调整蛋白质
    protein_goal = base_goals['protein'][gender] * goal_config.get('protein_boost', 1.0)
    
    # 调整碳水化合物
    carb_goal = base_goals['carbs'][gender] * goal_config.get('carb_adjustment', 1.0)
    
    return {
        'calories': round(adjusted_calories, 0),
        'protein': round(protein_goal, 1),
        'fat': round(base_goals['fat'][gender], 1),
        'carbs': round(carb_goal, 1),
        'fiber': base_goals['fiber'][gender],
        'sodium': base_goals['sodium'][gender],
        'potassium': base_goals['potassium'][gender],
        'calcium': base_goals['calcium'][gender],
        'iron': base_goals['iron'][gender],
        'vitamin_c': base_goals['vitamin_c'][gender],
        'vitamin_a': base_goals['vitamin_a'][gender]
    }


def generate_nutrition_recommendations(nutrition_result: Dict[str, Any]) -> List[str]:
    """生成营养建议"""
    recommendations = []
    total_nutrition = nutrition_result['total_nutrition']
    macros = nutrition_result['macros_percentage']
    
    # 卡路里建议
    if total_nutrition['calories'] < 1200:
        recommendations.append('⚠️ 卡路里摄入过低，可能影响基础代谢')
    elif total_nutrition['calories'] > 3000:
        recommendations.append('⚠️ 卡路里摄入过高，注意控制饮食')
    
    # 宏量营养素建议
    if macros['protein'] < 15:
        recommendations.append('💪 蛋白质比例偏低，建议增加优质蛋白质摄入')
    elif macros['protein'] > 35:
        recommendations.append('⚠️ 蛋白质比例过高，注意营养均衡')
    
    if macros['fat'] > 35:
        recommendations.append('🥑 脂肪比例偏高，建议选择健康脂肪来源')
    elif macros['fat'] < 20:
        recommendations.append('🥑 脂肪摄入偏低，适量增加健康油脂')
    
    if macros['carbs'] > 65:
        recommendations.append('🌾 碳水化合物比例过高，建议选择复合碳水')
    elif macros['carbs'] < 45:
        recommendations.append('🌾 碳水化合物偏低，注意能量供应')
    
    # 微量营养素建议
    if total_nutrition['fiber'] < 25:
        recommendations.append('🥬 膳食纤维不足，多吃蔬菜水果')
    
    if total_nutrition['sodium'] > 2300:
        recommendations.append('🧂 钠摄入过高，注意减少盐分')
    
    if total_nutrition['calcium'] < 800:
        recommendations.append('🥛 钙质不足，建议增加乳制品摄入')
    
    if not recommendations:
        recommendations.append('✅ 营养搭配较为均衡，继续保持')
    
    return recommendations


def generate_daily_recommendations(goals: Dict[str, float], health_goal: str) -> List[str]:
    """生成每日营养建议"""
    recommendations = []
    goal_name = HEALTH_GOALS.get(health_goal, {}).get('name', '维持')
    
    recommendations.append(f'🎯 当前目标：{goal_name}')
    recommendations.append(f'🔥 建议每日摄入：{int(goals["calories"])}卡路里')
    recommendations.append(f'💪 蛋白质：{goals["protein"]}g（约{int(goals["protein"]*4/goals["calories"]*100)}%）')
    recommendations.append(f'🥑 脂肪：{goals["fat"]}g（约{int(goals["fat"]*9/goals["calories"]*100)}%）')
    recommendations.append(f'🌾 碳水化合物：{goals["carbs"]}g（约{int(goals["carbs"]*4/goals["calories"]*100)}%）')
    
    if health_goal == 'weight_loss':
        recommendations.extend([
            '📉 减重建议：适量减少精制碳水，增加蛋白质摄入',
            '🏃‍♀️ 配合有氧运动，每周3-5次',
            '💧 多喝水，每天至少2升'
        ])
    elif health_goal == 'muscle_gain':
        recommendations.extend([
            '💪 增肌建议：餐后1小时内补充蛋白质',
            '🏋️‍♀️ 配合力量训练，每周3-4次',
            '😴 保证充足睡眠，有助肌肉恢复'
        ])
    else:
        recommendations.extend([
            '⚖️ 维持建议：保持营养均衡，规律饮食',
            '🚶‍♀️ 适量运动，每周至少150分钟中等强度活动',
            '🧘‍♀️ 注意压力管理，保持良好心态'
        ])
    
    return recommendations


def assess_health_status(nutrition_result: Dict[str, Any]) -> Dict[str, Any]:
    """健康状态评估"""
    total_nutrition = nutrition_result['total_nutrition']
    macros = nutrition_result['macros_percentage']
    
    # 计算健康评分
    score = 100
    issues = []
    
    # 宏量营养素评分
    if not (15 <= macros['protein'] <= 35):
        score -= 10
        issues.append('蛋白质比例不理想')
    
    if not (20 <= macros['fat'] <= 35):
        score -= 10
        issues.append('脂肪比例不理想')
    
    if not (45 <= macros['carbs'] <= 65):
        score -= 10
        issues.append('碳水化合物比例不理想')
    
    # 微量营养素评分
    if total_nutrition['fiber'] < 25:
        score -= 5
        issues.append('膳食纤维不足')
    
    if total_nutrition['sodium'] > 2300:
        score -= 10
        issues.append('钠摄入过高')
    
    if total_nutrition['calcium'] < 800:
        score -= 5
        issues.append('钙质不足')
    
    # 确定健康等级
    if score >= 90:
        level = '优秀'
        color = '#4CAF50'
    elif score >= 75:
        level = '良好'
        color = '#8BC34A'
    elif score >= 60:
        level = '一般'
        color = '#FF9800'
    else:
        level = '需要改善'
        color = '#F44336'
    
    return {
        'score': max(0, score),
        'level': level,
        'color': color,
        'issues': issues,
        'strengths': ['营养均衡'] if score >= 90 else []
    }