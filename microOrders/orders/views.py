import socket

from flask import Flask

from orders.controllers.order_controller import order_controller

from db.db import db

from flask_cors import CORS

from flask_consulate import Consul


app = Flask(__name__)


CORS(app)

app.config.from_object(
    'config.Config'
)


db.init_app(
    app
)


app.register_blueprint(
    order_controller
)


consul = Consul(
    app=app
)


with app.app_context():

    container_ip = socket.gethostbyname(
        socket.gethostname()
    )


    consul.apply_remote_config(
        namespace='mynamespace/'
    )


    consul.register_service(

        name='orders',

        address='orders',

        interval='10s',

        tags=[
            'orders',
            'flask'
        ],

        port=5004,

        httpcheck=
            f'http://orders:5004/healthcheck'

    )


@app.route('/healthcheck')
def healthcheck():

    return '', 200