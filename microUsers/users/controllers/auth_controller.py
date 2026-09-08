from flask import Blueprint, request, jsonify

from users.models.user_model import Users

import jwt
import os

from datetime import datetime, timedelta, timezone


auth_controller = Blueprint(
    'auth_controller',
    __name__
)


# ============================================================
# CONFIGURACIÓN JWT
# ============================================================

JWT_SECRET = os.environ.get(
    'JWT_SECRET',
    'clave-secreta-desarrollo'
)

JWT_ALGORITHM = 'HS256'

JWT_EXPIRATION_HOURS = 2


# ============================================================
# LOGIN
# ============================================================

@auth_controller.route(
    '/api/auth/login',
    methods=['POST']
)
def login():

    data = request.json or {}


    # Buscar usuario
    user = Users.query.filter_by(
        username=data.get('username'),
        password=data.get('password')
    ).first()


    # Credenciales incorrectas
    if not user:

        return jsonify({
            'message': 'Credenciales inválidas'
        }), 401


    # ========================================================
    # CREAR JWT
    # ========================================================

    now = datetime.now(timezone.utc)

    payload = {

        # ID del usuario
        'sub': str(user.id),

        # Información del usuario
        'name': user.name,
        'email': user.email,
        'username': user.username,

        # Fecha de creación
        'iat': now,

        # Expiración
        'exp': now + timedelta(
            hours=JWT_EXPIRATION_HOURS
        )
    }


    token = jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )


    # ========================================================
    # RESPUESTA
    # ========================================================

    return jsonify({

        'token': token,

        'user': {

            'id': user.id,
            'name': user.name,
            'email': user.email,
            'username': user.username

        }

    }), 200


# ============================================================
# VALIDAR JWT
# ============================================================

@auth_controller.route(
    '/api/auth/validate',
    methods=['GET']
)
def validate_token():

    # Obtener Authorization
    auth_header = request.headers.get(
        'Authorization',
        ''
    )


    # Debe ser:
    # Authorization: Bearer TOKEN
    if not auth_header.startswith('Bearer '):

        return jsonify({
            'message': 'Token no proporcionado'
        }), 401


    # Extraer token
    token = auth_header.split(
        ' ',
        1
    )[1]


    try:

        # ====================================================
        # VALIDAR JWT
        # ====================================================

        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )


        # Obtener ID
        user_id = payload.get('sub')


        if not user_id:

            return jsonify({
                'message': 'Token inválido'
            }), 401


        # ====================================================
        # VERIFICAR QUE EL USUARIO EXISTA
        # ====================================================

        user = Users.query.get(
            int(user_id)
        )


        if not user:

            return jsonify({
                'message': 'El usuario ya no existe'
            }), 401


        # ====================================================
        # JWT VÁLIDO
        # ====================================================

        return jsonify({

            'valid': True,

            'user': {

                'id': user.id,
                'name': user.name,
                'email': user.email,
                'username': user.username

            }

        }), 200


    except jwt.ExpiredSignatureError:

        return jsonify({
            'message': 'Token expirado'
        }), 401


    except jwt.InvalidTokenError:

        return jsonify({
            'message': 'Token inválido'
        }), 401