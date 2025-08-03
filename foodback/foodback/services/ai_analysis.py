"""
AI食物分析服务
使用Google Gemini API进行食物包装图片分析
"""

import os
import json
import logging
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from PIL import Image
import google.generativeai as genai
from flask import current_app

logger = logging.getLogger(__name__)


class AIFoodAnalysisService:
    """AI食物分析服务类"""
    
    def __init__(self):
        self.api_key = os.getenv('GOOGLE_API_KEY')
        self.model = None
        
        if not self.api_key:
            logger.warning("GOOGLE_API_KEY not found in environment variables")
            return
        
        try:
            # 配置代理设置
            self._setup_proxy()
            
            # 配置Gemini API
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash-latest')
            logger.info("AI Analysis Service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize AI Analysis Service: {e}")
            self.model = None
    
    def _setup_proxy(self):
        """配置代理设置"""
        proxy_host = os.getenv('PROXY_HOST', '127.0.0.1')
        proxy_port = os.getenv('PROXY_PORT', '7890')
        
        if proxy_host and proxy_port:
            proxy_url = f"http://{proxy_host}:{proxy_port}"
            logger.info(f"🌐 配置代理: {proxy_url}")
            
            # 设置环境变量，让requests库使用代理
            os.environ['HTTP_PROXY'] = proxy_url
            os.environ['HTTPS_PROXY'] = proxy_url
            
            # 也可以通过requests的Session来配置
            session = requests.Session()
            session.proxies = {
                'http': proxy_url,
                'https': proxy_url
            }
            
            # 为google-generativeai配置代理
            # 这个库内部使用requests，所以环境变量设置应该生效
            logger.info(f"✅ 代理配置完成: {proxy_url}")
        else:
            logger.info("🚫 未配置代理，使用直连")
    
    def is_available(self) -> bool:
        """检查AI服务是否可用"""
        return self.model is not None and self.api_key is not None
    
    def _ensure_proxy_settings(self):
        """确保代理设置生效"""
        proxy_host = os.getenv('PROXY_HOST', '127.0.0.1')
        proxy_port = os.getenv('PROXY_PORT', '7890')
        
        if proxy_host and proxy_port:
            proxy_url = f"http://{proxy_host}:{proxy_port}"
            
            # 重新设置环境变量（以防被覆盖）
            os.environ['HTTP_PROXY'] = proxy_url
            os.environ['HTTPS_PROXY'] = proxy_url
            
            logger.debug(f"🔄 重新确认代理设置: {proxy_url}")
    
    def analyze_food_images(self, image_paths: List[str]) -> Dict[str, Any]:
        """
        分析食物包装图片
        
        Args:
            image_paths: 图片文件路径列表
            
        Returns:
            分析结果字典
        """
        if not self.is_available():
            raise ValueError("AI Analysis Service is not available")
        
        if not image_paths:
            raise ValueError("No images provided for analysis")
        
        try:
            # 确保代理设置在每次调用时都生效
            self._ensure_proxy_settings()
            
            # 加载图片
            images = []
            for path in image_paths:
                if os.path.exists(path):
                    img = Image.open(path)
                    images.append(img)
                    logger.info(f"Loaded image: {path}")
                else:
                    logger.warning(f"Image not found: {path}")
            
            if not images:
                raise ValueError("No valid images found")
            
            # 构建分析提示词
            prompt = self._build_analysis_prompt()
            
            # 发送请求到Gemini API
            logger.info(f"🚀 通过代理发送分析请求，处理{len(images)}张图片")
            logger.info(f"🌐 当前代理设置: HTTP_PROXY={os.environ.get('HTTP_PROXY', 'None')}")
            
            content = [prompt] + images
            response = self.model.generate_content(content)
            
            # 解析响应
            result = self._parse_response(response.text)
            logger.info("✅ AI分析完成")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ AI分析失败: {str(e)}")
            logger.error(f"错误类型: {type(e).__name__}")
            raise
    
    def _build_analysis_prompt(self) -> str:
        """构建AI分析提示词"""
        current_date = datetime.now().strftime("%Y年%m月%d日")
        
        prompt = f"""
请仔细分析这些食品包装的图片，然后严格按照以下JSON格式返回信息。
当前日期是：{current_date}。

你的任务是：
1. 从图片中识别出完整的配料表内容，以字符串形式返回 (ingredients_text)。
2. 从配料表中，识别出常见的人工添加剂、高糖成分、防腐剂或常见过敏原（如麸质、坚果等），并列出它们 (harmful_ingredients)。
3. 从图片中找到生产日期，格式为YYYY-MM-DD (production_date)。
4. 从图片中找到保质期信息，提取数值和单位，例如"12个月"提取为数值12和单位"month" (shelf_life_value, shelf_life_unit)。
5. 根据生产日期和保质期，计算出具体的过期日期，格式为YYYY-MM-DD (expiry_date)。
6. 从图片中识别营养成分表，提取每100g的热量值，单位为千卡 (calories_kcal)。
7. 根据热量值，估算需要多少分钟的运动来消耗这些热量（假设中等强度运动每分钟消耗5千卡） (energy_offset_info)。

请将所有信息构造成一个JSON对象，结构如下：
{{
  "ingredients_text": "完整的配料表文字内容",
  "harmful_ingredients": ["需要注意的成分1", "需要注意的成分2"],
  "production_date": "YYYY-MM-DD",
  "shelf_life_value": 12,
  "shelf_life_unit": "month",
  "expiry_date": "YYYY-MM-DD",
  "calories_kcal": 350.5,
  "energy_offset_info": "需要约70分钟中等强度运动来消耗"
}}

注意事项：
- 如果某个信息无法从图片中识别出来，请将对应字段设为null
- 保质期单位请使用: "day", "month", "year" 之一
- 日期格式必须严格按照YYYY-MM-DD格式
- 热量值请保留一位小数
- 只返回JSON对象，不要包含其他文字说明
"""
        return prompt
    
    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """解析AI响应文本"""
        try:
            # 清理响应文本，移除可能的markdown标记
            clean_text = response_text.strip()
            if clean_text.startswith('```json'):
                clean_text = clean_text[7:]
            if clean_text.endswith('```'):
                clean_text = clean_text[:-3]
            clean_text = clean_text.strip()
            
            # 解析JSON
            result = json.loads(clean_text)
            
            # 验证和清理数据
            result = self._validate_and_clean_result(result)
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            logger.error(f"Raw response: {response_text}")
            raise ValueError("AI response format is invalid")
    
    def _validate_and_clean_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """验证和清理AI分析结果"""
        cleaned = {}
        
        # 配料表文字
        cleaned['ingredients_text'] = result.get('ingredients_text') or ''
        
        # 有害成分列表
        harmful = result.get('harmful_ingredients', [])
        cleaned['harmful_ingredients'] = harmful if isinstance(harmful, list) else []
        
        # 生产日期验证
        prod_date = result.get('production_date')
        if prod_date and self._is_valid_date(prod_date):
            cleaned['production_date'] = prod_date
        else:
            cleaned['production_date'] = None
        
        # 保质期数值和单位
        shelf_life_value = result.get('shelf_life_value')
        if isinstance(shelf_life_value, (int, float)) and shelf_life_value > 0:
            cleaned['shelf_life_value'] = int(shelf_life_value)
        else:
            cleaned['shelf_life_value'] = None
        
        shelf_life_unit = result.get('shelf_life_unit')
        if shelf_life_unit in ['day', 'month', 'year']:
            cleaned['shelf_life_unit'] = shelf_life_unit
        else:
            cleaned['shelf_life_unit'] = None
        
        # 过期日期验证
        expiry_date = result.get('expiry_date')
        if expiry_date and self._is_valid_date(expiry_date):
            cleaned['expiry_date'] = expiry_date
        else:
            cleaned['expiry_date'] = None
        
        # 热量值
        calories = result.get('calories_kcal')
        if isinstance(calories, (int, float)) and calories > 0:
            cleaned['calories_kcal'] = round(float(calories), 1)
        else:
            cleaned['calories_kcal'] = None
        
        # 运动消耗信息
        cleaned['energy_offset_info'] = result.get('energy_offset_info') or ''
        
        return cleaned
    
    def _is_valid_date(self, date_str: str) -> bool:
        """验证日期格式是否正确"""
        try:
            datetime.strptime(date_str, '%Y-%m-%d')
            return True
        except ValueError:
            return False


# 创建全局服务实例
ai_analysis_service = AIFoodAnalysisService()