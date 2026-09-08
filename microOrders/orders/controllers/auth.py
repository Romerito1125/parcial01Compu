import functools

import requests

from flask import request, jsonify, g

from config import Config


# ============================================================
# BUSCAR MICROSERVICIO USERS EN CONSUL
# ============================================================

def _service_url(service_name):

    consul_host = Config.CONSUL_HOST
    consul_port = Config.CONSUL_PORT

    try:

        response = requests.get(
            f'http://{consul_host}:{consul_port}/v1/health/service/{service_name}?passing=true',
            timeout=3
        )

        instances = response.json()

    except Exception as e:

        print(
            f'Error consultando Consul: {e}'
        )

        return None


    if not instances:

        print(
            f'No hay instancias disponibles para {service_name}'
        )

        return None


    service = instances[0]['Service']


    return (
        f"http://{service['Address']}:{service['Port']}"
    )


# ============================================================
# VALIDAR USUARIO MEDIANTE JWT
# ============================================================

def user_required(f):

    @functools.wraps(f)
    def decorated(*args, **kwargs):

        # ====================================================
        # OBTENER AUTHORIZATION
        # ====================================================

        auth_header = request.headers.get(
            'Authorization',
            ''
        )


        print(
            'Authorization recibido en Orders:',
            auth_header
        )


        # ====================================================
        # COMPROBAR BEARER
        # ====================================================

        if not auth_header.startswith('Bearer '):

            print(
                'Orders: no se recibió Bearer token'
            )

            return jsonify({
                'message': 'Token no proporcionado'
            }), 401


        # ====================================================
        # EXTRAER JWT
        # ====================================================

        token = auth_header.split(
            ' ',
            1
        )[1]


        if not token:

            print(
                'Orders: token vacío'
            )

            return jsonify({
                'message': 'Token no proporcionado'
            }), 401


        print(
            'Token extraído en Orders:',
            token
        )


        # ====================================================
        # BUSCAR USERS MEDIANTE CONSUL
        # ====================================================

        users_url = _service_url(
            'users'
        )


        if not users_url:

            return jsonify({
                'message':
                    'Microservicio de usuarios no disponible'
            }), 503


        print(
            'Users URL:',
            users_url
        )


        # ====================================================
        # ENVIAR JWT A USERS
        # ====================================================

        try:

            response = requests.get(

                f'{users_url}/api/auth/validate',

                headers={

                    'Authorization':
                        'Bearer ' + token

                },

                timeout=3

            )

        except Exception as e:

            print(
                f'Error comunicando con Users: {e}'
            )

            return jsonify({

                'message':
                    'Microservicio de usuarios no disponible'

            }), 503


        # ====================================================
        # MOSTRAR RESPUESTA DE USERS
        # ====================================================

        print(
            'Respuesta de Users:',
            response.status_code
        )

        print(
            'Body de Users:',
            response.text
        )


        # ====================================================
        # JWT INVÁLIDO / EXPIRADO
        # ====================================================

        if response.status_code != 200:

            try:

                error_data = response.json()

            except Exception:

                error_data = {}


            return jsonify({

                'message':
                    error_data.get(
                        'message',
                        'Token inválido o expirado'
                    )

            }), 401


        # ====================================================
        # OBTENER USUARIO VALIDADO
        # ====================================================

        data = response.json()


        if not data.get('valid'):

            return jsonify({

                'message':
                    'Token inválido'

            }), 401


        user = data.get(
            'user'
        )


        if not user:

            return jsonify({

                'message':
                    'Usuario no encontrado'

            }), 401


        # ====================================================
        # GUARDAR USUARIO EN g
        # ====================================================

        g.user = {

            'id': user['id'],

            'name': user['name'],

            'email': user['email']

        }


        print(
            'Usuario autenticado en Orders:',
            g.user
        )


        # ====================================================
        # CONTINUAR CON EL ENDPOINT
        # ====================================================

        return f(
            *args,
            **kwargs
        )


    return decorated