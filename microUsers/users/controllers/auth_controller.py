from flask import Blueprint, request, jsonify

from users.models.user_model import Users

auth_controller = Blueprint('auth_controller', __name__)


@auth_controller.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json or {}

    user = Users.query.filter_by(
        username=data.get('username'),
        password=data.get('password')
    ).first()

    if not user:
        return jsonify({'message': 'Credenciales inválidas'}), 401

    return jsonify({
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'username': user.username
    })