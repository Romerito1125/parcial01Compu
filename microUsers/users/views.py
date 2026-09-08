import socket

from flask import Flask
from users.controllers.user_controller import user_controller
from users.controllers.auth_controller import auth_controller
from db.db import db
from flask_cors import CORS
from flask_consulate import Consul

app = Flask(__name__)
CORS(app)
app.config.from_object('config.Config')

db.init_app(app)

# Registrando los blueprints del microservicio de usuarios
app.register_blueprint(user_controller)
app.register_blueprint(auth_controller)

consul = Consul(app=app)

with app.app_context():
    container_ip = socket.gethostbyname(socket.gethostname())
    consul.apply_remote_config(namespace='mynamespace/')
    consul.register_service(
        name='users',
        address=container_ip,
        interval='10s',
        tags=['users', 'flask'],
        port=5002,
        httpcheck=f'http://{container_ip}:5002/healthcheck'
    )


@app.route('/healthcheck')
def healthcheck():
    return '', 200


if __name__ == '__main__':
    app.run()