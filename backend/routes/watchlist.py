from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import SavedProduct, db

watchlist_bp = Blueprint('watchlist', __name__)

@watchlist_bp.route('', methods=['GET'])
@jwt_required()
def get_watchlist():
    user_id = get_jwt_identity()

    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    paginated = SavedProduct.query.filter_by(user_id=user_id)\
        .order_by(SavedProduct.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'products': [p.to_dict() for p in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200


@watchlist_bp.route('', methods=['POST'])
@jwt_required()
def save_product():
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data.get('ebay_item_id') or not data.get('title'):
        return jsonify({'error': 'ebay_item_id and title are required'}), 400

    # Prevent duplicates
    existing = SavedProduct.query.filter_by(
        user_id=user_id,
        ebay_item_id=data['ebay_item_id']
    ).first()

    if existing:
        return jsonify({'error': 'Product already in watchlist'}), 409

    product = SavedProduct(
        user_id=user_id,
        ebay_item_id=data['ebay_item_id'],
        title=data['title'],
        price=data.get('price'),
        watch_count=data.get('watch_count', 0),
        image_url=data.get('image_url'),
        notes=data.get('notes', '')
    )

    db.session.add(product)
    db.session.commit()

    return jsonify({'product': product.to_dict()}), 201


@watchlist_bp.route('/<int:product_id>', methods=['PATCH'])
@jwt_required()
def update_product(product_id):
    user_id = get_jwt_identity()

    product = SavedProduct.query.filter_by(
        id=product_id,
        user_id=user_id  # ownership check
    ).first()

    if not product:
        return jsonify({'error': 'Product not found'}), 404

    data = request.get_json()

    if 'notes' in data:
        product.notes = data['notes']

    db.session.commit()
    return jsonify({'product': product.to_dict()}), 200


@watchlist_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    user_id = get_jwt_identity()

    product = SavedProduct.query.filter_by(
        id=product_id,
        user_id=user_id  # ownership check
    ).first()

    if not product:
        return jsonify({'error': 'Product not found'}), 404

    db.session.delete(product)
    db.session.commit()

    return jsonify({'message': 'Product removed from watchlist'}), 200