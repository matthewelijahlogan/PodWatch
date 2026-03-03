# backend/app.py

from flask import Flask, render_template, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

from routes.podcasts import podcast_bp
from routes.editors_picks import editors_bp
from routes.api import api_bp
from routes.categories import categories_bp
from routes.reviews import reviews_bp
from routes.youtube import youtube_bp

# Create Flask app with correct folders
app = Flask(
    __name__,
    static_folder='../frontend',              # Root of static files
    template_folder='../frontend/html'        # HTML templates
)
CORS(app)

# Register Blueprints
app.register_blueprint(podcast_bp, url_prefix='/api')
app.register_blueprint(editors_bp, url_prefix='/api')
app.register_blueprint(api_bp)
app.register_blueprint(categories_bp)
app.register_blueprint(youtube_bp, url_prefix='/api')
app.register_blueprint(reviews_bp)

# Route for root index page
@app.route('/')
def index():
    return render_template('index.html')

# Serve CSS files
@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory('../frontend/css', filename)

# Serve JS files
@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('../frontend/js', filename)

# Serve image assets (logos, UI)
@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory('../frontend/assets', filename)

# Serve public folder content
@app.route('/public/<path:filename>')
def serve_public(filename):
    return send_from_directory('../public', filename)

# ✅ Serve podcast images scraped into backend/data/images/
@app.route('/images/<path:filename>')
def serve_podcast_image(filename):
    return send_from_directory('data/images', filename)

# Serve favicon
@app.route('/favicon.ico')
def favicon():
    return send_from_directory('../frontend/assets/img', 'favicon.ico')

# Optional fallback for any unmatched static path
@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory('../frontend', path)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', '5000'))
    debug = os.environ.get('FLASK_ENV', '').lower() == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
