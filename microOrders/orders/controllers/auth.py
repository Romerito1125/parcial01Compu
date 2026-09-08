import functools

import requests
from flask import request, jsonify, g

from config import Config


def _service_url(service_name):
    consul_host = Config.CONSUL_HOST
    consul_port = Config.CONSUL_PORT

    try:
        response = requests.get(
            f'http://{consul_host}:{consul_port}/v1/health/service/{service_name}?passing=true',
            timeout=3
        )
        instances = response.json()
    except Exception:
        return None

    if not instances:
        return None

    service = instances[0]['Service']
    return f"http://{service['Address']}:{service['Port']}"


def user_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        user_id = request.headers.get('X-User-Id')
        if not user_id:
            return jsonify({'message': 'No autorizado'}), 401

        users_url = _service_url('users')
        if not users_url:
            return jsonify({'message': 'Microservicio de usuarios no disponible'}), 503

        try:
            response = requests.get(f'{users_url}/api/users/{user_id}', timeout=3)
        except Exception:
            return jsonify({'message': 'Microservicio de usuarios no disponible'}), 503

        if response.status_code != 200:
            return jsonify({'message': 'Usuario no encontrado'}), 401

        user = response.json()
        g.user = {
            'id': user['id'],
            'name': user['name'],
            'email': user['email']
        }

        return f(*args, **kwargs)

    return decorated