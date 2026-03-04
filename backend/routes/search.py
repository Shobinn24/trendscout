from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import requests
import os
import base64

search_bp = Blueprint('search', __name__)

def get_ebay_token():
    # Encode credentials for Basic Auth
    credentials = f"{os.getenv('EBAY_CLIENT_ID')}:{os.getenv('EBAY_CLIENT_SECRET')}"
    encoded = base64.b64encode(credentials.encode()).decode()

    response = requests.post(
        'https://api.ebay.com/identity/v1/oauth2/token',
        headers={
            'Authorization': f'Basic {encoded}',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data='grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
    )

    if response.status_code != 200:
        return None

    return response.json().get('access_token')


@search_bp.route('/search', methods=['GET'])
@jwt_required()
def search():
    query = request.args.get('q', '').strip()

    if not query:
        return jsonify({'error': 'Search query is required'}), 400

    token = get_ebay_token()
    if not token:
        return jsonify({'error': 'Failed to authenticate with eBay API'}), 502

    response = requests.get(
        'https://api.ebay.com/buy/browse/v1/item_summary/search',
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
        },
        params={
            'q': query,
            'limit': 20,
            'fieldgroups': 'EXTENDED'
        }
    )

    if response.status_code != 200:
        return jsonify({'error': 'eBay API request failed', 'details': response.text}), 502

    data = response.json()
    items = data.get('itemSummaries', [])

    # Shape the response to only what the frontend needs
    results = []
    for item in items:
        results.append({
            'ebay_item_id': item.get('itemId'),
            'title': item.get('title'),
            'price': item.get('price', {}).get('value'),
            'currency': item.get('price', {}).get('currency'),
            'watch_count': item.get('watchCount', 0),
            'image_url': item.get('image', {}).get('imageUrl'),
            'condition': item.get('condition'),
            'item_url': item.get('itemWebUrl')
        })

    return jsonify({'results': results, 'total': len(results)}), 200