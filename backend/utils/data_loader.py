import json
import os
from flask import current_app

def load_json_file(filename):
    path = os.path.join(os.path.dirname(__file__), '..', 'data', filename)
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_podcasts():
    return load_json_file('top_podcasts.json')

def load_editors_picks():
    return load_json_file('editors_picks.json')

def get_categories_data():
    data_path = os.path.join(current_app.root_path, 'data', 'categories.json')
    with open(data_path, 'r', encoding='utf-8') as f:
        return json.load(f)
