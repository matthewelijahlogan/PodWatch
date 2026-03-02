from flask import Blueprint, jsonify
import json
import os

editors_bp = Blueprint('editors_bp', __name__)

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'editors_picks.json')

def load_editors_picks():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        picks = json.load(f)
    return picks

@editors_bp.route('/editors-picks', methods=['GET'])
def get_editors_picks():
    picks = load_editors_picks()
    return jsonify(picks)
