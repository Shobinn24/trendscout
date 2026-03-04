from flask import Flask
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv
from models import db, bcrypt
import os

load_dotenv()

migrate = Migrate()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)

    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///trendscout.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')

    db.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app)

    from routes.auth import auth_bp
    from routes.watchlist import watchlist_bp
    from routes.search import search_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(watchlist_bp, url_prefix='/api/watchlist')
    app.register_blueprint(search_bp, url_prefix='/api')

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5555)