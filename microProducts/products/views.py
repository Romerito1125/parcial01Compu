import socket

from flask import Flask
from products.controllers.product_controller import product_controller
from db.db import db
from flask_cors import CORS
from flask_consulate import Consul

app = Flask(__name__)
CORS(app)

app.config.from_object('config.Config')

db.init_app(app)

# Registrando el blueprint del controlador de productos
app.register_blueprint(product_controller)

consul = Consul(app=app)

with app.app_context():
    container_ip = socket.gethostbyname(socket.gethostname())
    consul.apply_remote_config(namespace='mynamespace/')
    consul.register_service(
        name='products',
        address='products',
        interval='10s',
        tags=['products', 'flask'],
        port=5003,
        httpcheck=f'http://products:5003/healthcheck'
    )


@app.route('/healthcheck')
def healthcheck():
    return '', 200


if __name__ == '__main__':
    app.run()