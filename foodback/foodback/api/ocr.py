"""OCR识别相关API"""
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
import tempfile
import json
from typing import Dict, List, Any

from ..utils.response_utils import success_response, error_response, validation_error_response
from ..utils.file_utils import allowed_file
from ..auth.decorators import jwt_required

bp = Blueprint('ocr', __name__, url_prefix='/api/ocr')

# 模拟OCR识别结果 - 实际项目中应该集成真实的OCR服务
MOCK_OCR_RESULTS = {
    'ingredients': [
        {
            'name': '小麦粉',
            'confidence': 0.95,
            'position': {'x': 100, 'y': 50, 'width': 60, 'height': 20}
        },
        {
            'name': '白砂糖',
            'confidence': 0.92,
            'position': {'x': 200, 'y': 50, 'width': 60, 'height': 20}
        },
        {
            'name': '植物油',
            'confidence': 0.88,
            'position': {'x': 300, 'y': 50, 'width': 60, 'height': 20}
        },
        {
            'name': '鸡蛋',
            'confidence': 0.90,
            'position': {'x': 100, 'y': 80, 'width': 40, 'height': 20}
        },
        {
            'name': '牛奶',
            'confidence': 0.85,
            'position': {'x': 200, 'y': 80, 'width': 40, 'height': 20}
        }
    ],
    'text_blocks': [
        {
            'text': '配料表：小麦粉、白砂糖、植物油、鸡蛋、牛奶',
            'confidence': 0.93,
            'position': {'x': 50, 'y': 30, 'width': 400, 'height': 100}
        }
    ]
}

# 有害成分数据库 - 实际项目中应该从数据库获取
HARMFUL_INGREDIENTS = {
    '反式脂肪酸': {
        'level': 'high',
        'description': '可能增加心血管疾病风险',
        'alternatives': ['天然植物油', '橄榄油']
    },
    '人工色素': {
        'level': 'medium',
        'description': '可能引起过敏反应',
        'alternatives': ['天然色素', '胡萝卜素']
    },
    '防腐剂': {
        'level': 'medium',
        'description': '长期摄入可能对健康有影响',
        'alternatives': ['天然保鲜剂', '维生素E']
    },
    '味精': {
        'level': 'low',
        'description': '部分人群可能敏感',
        'alternatives': ['天然调味料', '香菇精']
    }
}


@bp.route('/analyze', methods=['POST'])
@jwt_required
def analyze_ingredients():
    """分析食物配料表图片"""
    current_user = request.current_user
    
    # 检查是否有文件上传
    if 'image' not in request.files:
        return validation_error_response('请上传配料表图片')
    
    file = request.files['image']
    if file.filename == '':
        return validation_error_response('请选择要上传的图片')
    
    if not allowed_file(file.filename):
        return validation_error_response('不支持的文件格式，请上传 jpg, jpeg, png, gif 格式的图片')
    
    try:
        # 保存临时文件
        filename = secure_filename(file.filename)
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, filename)
        file.save(temp_path)
        
        # 模拟OCR处理过程
        # 实际项目中应该调用真实的OCR服务，如：
        # - 百度OCR API
        # - 腾讯云OCR API  
        # - Google Vision API
        # - Azure Computer Vision API
        
        # 获取模拟结果
        ocr_result = MOCK_OCR_RESULTS.copy()
        
        # 分析有害成分
        harmful_analysis = analyze_harmful_ingredients(ocr_result['ingredients'])
        
        # 生成营养建议
        nutrition_advice = generate_nutrition_advice(ocr_result['ingredients'])
        
        # 清理临时文件
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        result = {
            'ocr_result': ocr_result,
            'harmful_analysis': harmful_analysis,
            'nutrition_advice': nutrition_advice,
            'processing_time': 1.2,  # 模拟处理时间
            'confidence_score': 0.91  # 整体识别置信度
        }
        
        return success_response(result, '配料分析完成')
        
    except Exception as e:
        # 清理临时文件
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.remove(temp_path)
        
        return error_response(f'配料分析失败: {str(e)}')


def analyze_harmful_ingredients(ingredients: List[Dict[str, Any]]) -> Dict[str, Any]:
    """分析有害成分"""
    harmful_found = []
    total_ingredients = len(ingredients)
    
    for ingredient in ingredients:
        ingredient_name = ingredient['name']
        
        # 检查是否包含有害成分关键词
        for harmful_name, harmful_info in HARMFUL_INGREDIENTS.items():
            if harmful_name in ingredient_name or any(
                keyword in ingredient_name for keyword in [harmful_name.split()[0]]
            ):
                harmful_found.append({
                    'name': ingredient_name,
                    'harmful_type': harmful_name,
                    'level': harmful_info['level'],
                    'description': harmful_info['description'],
                    'alternatives': harmful_info['alternatives'],
                    'confidence': ingredient['confidence']
                })
    
    # 计算安全评分
    if not harmful_found:
        safety_score = 95
        safety_level = 'excellent'
    elif len(harmful_found) == 1 and harmful_found[0]['level'] == 'low':
        safety_score = 80
        safety_level = 'good'
    elif any(h['level'] == 'high' for h in harmful_found):
        safety_score = 40
        safety_level = 'poor'
    else:
        safety_score = 60
        safety_level = 'fair'
    
    return {
        'harmful_ingredients': harmful_found,
        'safety_score': safety_score,
        'safety_level': safety_level,
        'total_ingredients': total_ingredients,
        'harmful_count': len(harmful_found),
        'recommendations': generate_safety_recommendations(harmful_found)
    }


def generate_nutrition_advice(ingredients: List[Dict[str, Any]]) -> Dict[str, Any]:
    """生成营养建议"""
    advice = []
    nutrition_score = 75  # 基础分数
    
    ingredient_names = [ing['name'] for ing in ingredients]
    
    # 检查营养成分
    if any('全麦' in name or '燕麦' in name for name in ingredient_names):
        advice.append('✓ 含有全谷物，有助于提供膳食纤维')
        nutrition_score += 5
    
    if any('蛋白' in name or '鸡蛋' in name or '牛奶' in name for name in ingredient_names):
        advice.append('✓ 富含优质蛋白质')
        nutrition_score += 5
    
    if any('糖' in name for name in ingredient_names):
        advice.append('⚠ 含有添加糖，建议适量食用')
        nutrition_score -= 10
    
    if any('盐' in name or '钠' in name for name in ingredient_names):
        advice.append('⚠ 含有较多钠，高血压患者需注意')
        nutrition_score -= 5
    
    # 默认建议
    if not advice:
        advice.append('建议均衡饮食，适量食用')
    
    return {
        'nutrition_score': max(0, min(100, nutrition_score)),
        'advice': advice,
        'dietary_notes': [
            '请根据个人体质和健康状况选择食用',
            '如有特殊疾病或过敏史，请咨询医生'
        ]
    }


def generate_safety_recommendations(harmful_ingredients: List[Dict[str, Any]]) -> List[str]:
    """生成安全建议"""
    if not harmful_ingredients:
        return ['该食品配料相对安全，可以适量食用']
    
    recommendations = []
    
    # 根据有害成分等级给出建议
    high_risk = [h for h in harmful_ingredients if h['level'] == 'high']
    medium_risk = [h for h in harmful_ingredients if h['level'] == 'medium']
    
    if high_risk:
        recommendations.append('⚠️ 发现高风险成分，建议谨慎食用或寻找替代品')
        for ingredient in high_risk:
            recommendations.append(f'• {ingredient["harmful_type"]}: {ingredient["description"]}')
    
    if medium_risk:
        recommendations.append('⚠️ 发现中等风险成分，建议适量食用')
    
    recommendations.append('💡 建议选择天然、无添加的食品')
    recommendations.append('💡 注意查看食品标签，了解配料信息')
    
    return recommendations


@bp.route('/ingredients/search', methods=['GET'])
@jwt_required
def search_ingredients():
    """搜索配料信息"""
    query = request.args.get('q', '').strip()
    
    if not query:
        return validation_error_response('请输入搜索关键词')
    
    # 模拟配料搜索结果
    mock_results = [
        {
            'name': '小麦粉',
            'category': '谷物',
            'nutrition': {
                'calories': 364,  # 每100g卡路里
                'protein': 11.2,  # 蛋白质g
                'fat': 1.5,       # 脂肪g
                'carbs': 75.2     # 碳水化合物g
            },
            'allergens': ['麸质'],
            'description': '由小麦磨制而成的粉状物，是制作面包、面条等的主要原料'
        },
        {
            'name': '白砂糖',
            'category': '糖类',
            'nutrition': {
                'calories': 387,
                'protein': 0,
                'fat': 0,
                'carbs': 99.9
            },
            'allergens': [],
            'description': '精制的蔗糖，提供快速能量但营养价值较低'
        }
    ]
    
    # 简单的模糊匹配
    results = [r for r in mock_results if query.lower() in r['name'].lower()]
    
    return success_response({
        'ingredients': results,
        'total': len(results),
        'query': query
    })


@bp.route('/harmful-ingredients', methods=['GET'])
@jwt_required
def get_harmful_ingredients():
    """获取有害成分列表"""
    return success_response({
        'harmful_ingredients': HARMFUL_INGREDIENTS,
        'total': len(HARMFUL_INGREDIENTS),
        'last_updated': '2024-01-01'
    })