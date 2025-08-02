# -*- coding: utf-8 -*-
"""Click commands."""
import os
from glob import glob
from subprocess import call

import click

HERE = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.join(HERE, os.pardir)
TEST_PATH = os.path.join(PROJECT_ROOT, "tests")


@click.command()
@click.option(
    "-c/-C",
    "--coverage/--no-coverage",
    default=True,
    is_flag=True,
    help="Show coverage report",
)
@click.option(
    "-k",
    "--filter",
    default=None,
    help="Filter tests by keyword expressions",
)
def test(coverage, filter):
    """Run the tests."""
    import pytest

    args = [TEST_PATH, "--verbose"]
    if coverage:
        args.append("--cov=foodback")
    if filter:
        args.extend(["-k", filter])
    rv = pytest.main(args=args)
    exit(rv)


@click.command()
@click.option(
    "-f",
    "--fix-imports",
    default=True,
    is_flag=True,
    help="Fix imports using isort, before linting",
)
@click.option(
    "-c",
    "--check",
    default=False,
    is_flag=True,
    help="Don't make any changes to files, just confirm they are formatted correctly",
)
def lint(fix_imports, check):
    """Lint and check code style with black, flake8 and isort."""
    skip = ["node_modules", "requirements", "migrations"]
    root_files = glob("*.py")
    root_directories = [
        name for name in next(os.walk("."))[1] if not name.startswith(".")
    ]
    files_and_directories = [
        arg for arg in root_files + root_directories if arg not in skip
    ]

    def execute_tool(description, *args):
        """Execute a checking tool with its arguments."""
        command_line = list(args) + files_and_directories
        click.echo(f"{description}: {' '.join(command_line)}")
        rv = call(command_line)
        if rv != 0:
            exit(rv)

    isort_args = []
    black_args = []
    if check:
        isort_args.append("--check")
        black_args.append("--check")
    if fix_imports:
        execute_tool("Fixing import order", "isort", *isort_args)
    execute_tool("Formatting style", "black", *black_args)
    execute_tool("Checking code style", "flake8")


@click.command()
def init_db():
    """初始化数据库"""
    from foodback.extensions import db
    from foodback.models import Category
    from foodback.utils.model_utils import get_system_categories
    
    click.echo("Creating database tables...")
    db.create_all()
    
    # 创建系统预置分类
    click.echo("Creating system categories...")
    system_categories = get_system_categories()
    
    for cat_data in system_categories:
        existing = Category.query.filter_by(name=cat_data['name'], is_system=True).first()
        if not existing:
            category = Category(
                name=cat_data['name'],
                is_system=cat_data['is_system'],
                user_id=None  # 系统分类不属于任何用户
            )
            category.save()
            click.echo(f"Created system category: {cat_data['name']}")
    
    click.echo("Database initialization completed!")


@click.command()
def reset_db():
    """重置数据库（危险操作，会删除所有数据）"""
    if click.confirm('This will delete all data. Are you sure?'):
        from foodback.extensions import db
        
        click.echo("Dropping all tables...")
        db.drop_all()
        
        click.echo("Recreating tables...")
        db.create_all()
        
        # 重新创建系统分类
        from foodback.models import Category
        from foodback.utils.model_utils import get_system_categories
        
        system_categories = get_system_categories()
        for cat_data in system_categories:
            category = Category(
                name=cat_data['name'],
                is_system=cat_data['is_system'],
                user_id=None
            )
            category.save()
        
        click.echo("Database reset completed!")


@click.command()
def seed_db():
    """填充测试数据"""
    from foodback.extensions import db
    from foodback.user.models import User
    from foodback.models import Category, Location, Food
    import datetime as dt
    
    click.echo("Creating test data...")
    
    # 创建测试用户
    test_user = User.query.filter_by(email='test@example.com').first()
    if not test_user:
        test_user = User(
            nickname='测试用户',
            email='test@example.com',
            password='password123'
        )
        test_user.save()
        click.echo("Created test user: test@example.com")
    
    # 创建测试位置
    locations_data = [
        '冰箱冷藏室',
        '冰箱冷冻室', 
        '厨房储物柜',
        '阳台储物间'
    ]
    
    for loc_name in locations_data:
        existing = Location.query.filter_by(user_id=test_user.id, name=loc_name).first()
        if not existing:
            location = Location(
                user_id=test_user.id,
                name=loc_name
            )
            location.save()
            click.echo(f"Created location: {loc_name}")
    
    # 创建测试食物
    meat_category = Category.query.filter_by(name='肉蛋奶', is_system=True).first()
    fridge_location = Location.query.filter_by(user_id=test_user.id, name='冰箱冷藏室').first()
    
    if meat_category and fridge_location:
        existing_food = Food.query.filter_by(user_id=test_user.id, name='牛奶').first()
        if not existing_food:
            test_food = Food(
                user_id=test_user.id,
                name='牛奶',
                quantity=2,
                unit='瓶',
                category_id=meat_category.id,
                location_id=fridge_location.id,
                production_date=dt.date.today() - dt.timedelta(days=5),
                shelf_life_value=15,
                shelf_life_unit='day',
                expiry_date=dt.date.today() + dt.timedelta(days=10),
                calories_kcal=150
            )
            test_food.save()
            click.echo("Created test food: 牛奶")
    
    click.echo("Test data seeding completed!")
