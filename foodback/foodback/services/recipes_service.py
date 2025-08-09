"""
菜谱生成服务
使用Google Gemini API根据用户食材匹配菜谱
"""

import os
import json
import logging
from typing import List, Dict, Any
import google.generativeai as genai
from flask import current_app

logger = logging.getLogger(__name__)


class RecipesService:
    """菜谱生成服务类"""
    
    def __init__(self):
        self.api_key = os.getenv('GOOGLE_API_KEY')
        self.model = None
        self.recipes_data = {}  # 延迟加载
        
        if not self.api_key:
            logger.warning("GOOGLE_API_KEY not found in environment variables")
            return
        
        try:
            # 配置代理设置
            self._setup_proxy()
            
            # 配置Gemini API
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash-latest')
            logger.info("Recipes Service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Recipes Service: {e}")
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
            
            logger.info(f"✅ 代理配置完成: {proxy_url}")
        else:
            logger.info("🚫 未配置代理，使用直连")
    
    def _load_recipes_data(self) -> Dict[str, Any]:
        """加载菜谱数据"""
        if self.recipes_data:  # 如果已经加载过，直接返回
            return self.recipes_data
            
        try:
            # 确保在应用上下文中运行
            if current_app:
                recipes_file = os.path.join(current_app.root_path, 'api', 'recipes_prompt.txt')
            else:
                # 如果没有应用上下文，使用相对路径
                recipes_file = os.path.join(os.path.dirname(__file__), '..', 'api', 'recipes_prompt.txt')
            
            if not os.path.exists(recipes_file):
                logger.warning(f"Recipes file not found: {recipes_file}")
                return {}
            
            with open(recipes_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 解析菜谱数据
            recipes = {}
            lines = content.strip().split('\n')
            
            for line in lines:
                if line.strip():
                    try:
                        line_recipes = json.loads(line.strip())
                        recipes.update(line_recipes)
                    except json.JSONDecodeError:
                        logger.warning(f"Failed to parse recipe line: {line}")
                        continue
            
            logger.info(f"📚 加载了 {len(recipes)} 道菜谱")
            self.recipes_data = recipes
            return recipes
            
        except Exception as e:
            logger.error(f"Failed to load recipes data: {e}")
            return {}
    
    def is_available(self) -> bool:
        """检查菜谱服务是否可用"""
        # 确保菜谱数据已加载
        if not self.recipes_data:
            self._load_recipes_data()
        return self.model is not None and self.api_key is not None and bool(self.recipes_data)
    
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
    
    def generate_recipes(self, food_names: List[str]) -> List[Dict[str, Any]]:
        """
        根据食材名称生成菜谱推荐
        
        Args:
            food_names: 食材名称列表
            
        Returns:
            菜谱列表
        """
        if not self.is_available():
            raise ValueError("Recipes Service is not available")
        
        if not food_names:
            raise ValueError("No food names provided")
        
        try:
            # 确保代理设置在每次调用时都生效
            self._ensure_proxy_settings()
            
            # 确保菜谱数据已加载
            if not self.recipes_data:
                self._load_recipes_data()
            
            # 构建提示词
            prompt = self._build_recipes_prompt(food_names)
            
            # 发送请求到Gemini API
            logger.info(f"🚀 通过代理发送菜谱生成请求，食材: {food_names}")
            logger.info(f"🌐 当前代理设置: HTTP_PROXY={os.environ.get('HTTP_PROXY', 'None')}")
            
            response = self.model.generate_content(prompt)
            
            # 解析响应
            recipes = self._parse_recipes_response(response.text)
            logger.info("✅ 菜谱生成完成")
            
            return recipes
            
        except Exception as e:
            logger.error(f"❌ 菜谱生成失败: {str(e)}")
            logger.error(f"错误类型: {type(e).__name__}")
            raise
    
    def _build_recipes_prompt(self, food_names: List[str]) -> str:
        """构建菜谱生成提示词"""
        food_names_str = '、'.join(food_names)
        
        prompt = f"""
我有一些食材：{food_names_str}，想把它做成菜。我还有很多做菜的教程，里面包含了各道菜以及做他们需要的原材料和教学视频链接。

请你根据我现有的食材，在教程中进行模糊匹配，告诉我能做哪些菜以及他们的链接。

教程数据如下：
{json.dumps(self.recipes_data, ensure_ascii=False, indent=2)}

请严格按照以下JSON格式返回结果：
{{
  "recipes": [
    {{
      "name": "菜名",
      "ingredients": ["需要的食材1", "需要的食材2"],
      "video_url": "https://www.bilibili.com/video/BV号",
      "matched_ingredients": ["匹配到的用户食材1", "匹配到的用户食材2"],
      "missing_ingredients": ["缺少的食材1", "缺少的食材2"]
    }}
  ]
}}

匹配规则：
1. 模糊匹配：只要用户的食材在菜谱的原材料中出现，就认为匹配
2. 一道菜可以在教程中出现多次，可以返回多个同一道菜的教程
3. 视频链接格式：将BV号转换为 https://www.bilibili.com/video/BV号
4. 如果用户食材完全覆盖菜谱所需食材，missing_ingredients为空数组
5. 优先返回匹配度高的菜谱（missing_ingredients少的）

请只返回JSON格式，不要包含其他文字说明。
"""
        return prompt
    
    def _parse_recipes_response(self, response_text: str) -> List[Dict[str, Any]]:
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
            recipes = result.get('recipes', [])
            cleaned_recipes = []
            
            for recipe in recipes:
                if isinstance(recipe, dict):
                    cleaned_recipe = {
                        'name': recipe.get('name', ''),
                        'ingredients': recipe.get('ingredients', []),
                        'video_url': recipe.get('video_url', ''),
                        'matched_ingredients': recipe.get('matched_ingredients', []),
                        'missing_ingredients': recipe.get('missing_ingredients', [])
                    }
                    
                    # 验证必要字段
                    if cleaned_recipe['name'] and cleaned_recipe['video_url']:
                        cleaned_recipes.append(cleaned_recipe)
            
            return cleaned_recipes
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse recipes response as JSON: {e}")
            logger.error(f"Raw response: {response_text}")
            raise ValueError("Recipes response format is invalid")


# 创建全局服务实例
recipes_service = RecipesService() 