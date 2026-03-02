# backend/routes/categories.py
import json
import os
from flask import Blueprint, render_template, current_app

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('/categories')
def categories_page():
    return render_template('categories.html')
