# -*- coding: utf-8 -*-
"""The app module, containing the app factory function."""
import logging
import sys

from flask import Flask, render_template

from foodback import commands, public, user, auth, api
from foodback.extensions import (
    bcrypt,
    cache,
    cors,
    db,
    debug_toolbar,
    flask_static_digest,
    login_manager,
    migrate,
)


def create_app(config_object="foodback.settings"):
    """Create application factory, as explained here: http://flask.pocoo.org/docs/patterns/appfactories/.

    :param config_object: The configuration object to use.
    """
    app = Flask(__name__.split(".")[0])
    app.config.from_object(config_object)
    register_extensions(app)
    register_blueprints(app)
    register_errorhandlers(app)
    register_shellcontext(app)
    register_commands(app)
    configure_logger(app)
    register_scheduler(app)
    return app


def register_extensions(app):
    """Register Flask extensions."""
    bcrypt.init_app(app)
    cache.init_app(app)
    db.init_app(app)
    migrate.init_app(app, db)
    
    # CORS配置
    cors.init_app(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://localhost:8081", "exp://192.168.*:*"],
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    login_manager.init_app(app)
    login_manager.login_view = 'public.home'
    login_manager.login_message_category = 'info'
    
    debug_toolbar.init_app(app)
    migrate.init_app(app, db)
    flask_static_digest.init_app(app)
    return None


def register_blueprints(app):
    """Register Flask blueprints."""
    app.register_blueprint(public.views.blueprint)
    app.register_blueprint(user.views.blueprint)
    app.register_blueprint(auth.views.blueprint, url_prefix='/api')
    
    # API蓝图
    app.register_blueprint(api.categories_blueprint, url_prefix='/api')
    app.register_blueprint(api.locations_blueprint, url_prefix='/api')
    app.register_blueprint(api.shopping_blueprint, url_prefix='/api')
    app.register_blueprint(api.foods_blueprint, url_prefix='/api')
    app.register_blueprint(api.ocr_blueprint)
    app.register_blueprint(api.nutrition_blueprint)
    app.register_blueprint(api.push_blueprint)
    
    # AI分析API
    from .api.ai_analysis import blueprint as ai_analysis_blueprint
    app.register_blueprint(ai_analysis_blueprint, url_prefix='/api')
    
    # 菜谱生成API
    from .api.recipes import blueprint as recipes_blueprint
    app.register_blueprint(recipes_blueprint, url_prefix='/api')
    
    return None


def register_errorhandlers(app):
    """Register error handlers."""

    def render_error(error):
        """Render error template."""
        # If a HTTPException, pull the `code` attribute; default to 500
        error_code = getattr(error, "code", 500)
        return render_template(f"{error_code}.html"), error_code

    for errcode in [401, 404, 500]:
        app.errorhandler(errcode)(render_error)
    return None


def register_shellcontext(app):
    """Register shell context objects."""

    def shell_context():
        """Shell context objects."""
        return {"db": db, "User": user.models.User}

    app.shell_context_processor(shell_context)


def register_commands(app):
    """Register Click commands."""
    app.cli.add_command(commands.test)
    app.cli.add_command(commands.lint)
    app.cli.add_command(commands.init_db)
    app.cli.add_command(commands.reset_db)
    app.cli.add_command(commands.seed_db)


def configure_logger(app):
    """Configure loggers."""
    handler = logging.StreamHandler(sys.stdout)
    if not app.logger.handlers:
        app.logger.addHandler(handler)


def register_scheduler(app):
    """Register task scheduler."""
    try:
        from .tasks import init_scheduler, start_scheduler
        
        # 初始化调度器
        init_scheduler()
        
        # 在应用上下文中启动调度器
        with app.app_context():
            start_scheduler()
            
    except ImportError:
        app.logger.warning("Task scheduler not available - tasks module not found")
    except Exception as e:
        app.logger.error(f"Failed to register scheduler: {str(e)}")
