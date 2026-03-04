from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime

db = SQLAlchemy()
bcrypt = Bcrypt()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    saved_products = db.relationship('SavedProduct', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }


class SavedProduct(db.Model):
    __tablename__ = 'saved_products'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    ebay_item_id = db.Column(db.String(100), nullable=False)
    title = db.Column(db.String(300), nullable=False)
    price = db.Column(db.String(50))
    watch_count = db.Column(db.Integer, default=0)
    image_url = db.Column(db.String(500))
    notes = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'ebay_item_id': self.ebay_item_id,
            'title': self.title,
            'price': self.price,
            'watch_count': self.watch_count,
            'image_url': self.image_url,
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }