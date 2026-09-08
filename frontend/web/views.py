import os

import requests as http_requests
from flask import Flask, render_template, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

app.config.from_object('config.Config')

SERVICES = ['users', 'products', 'orders']


# Descubrimiento de microservicios vía Consul
@app.route('/api/discovery')
def discovery():
    consul_url = os.environ.get('CONSUL_SERVER_URL')
    result = {}

    for name in SERVICES:
        ports = []
        if consul_url:
            try:
                response = http_requests.get(
                    f'{consul_url}/v1/health/service/{name}?passing=true',
                    timeout=3
                )
                instances = response.json()
                ports = sorted(set(instance['Service']['Port'] for instance in instances))
            except Exception:
                ports = []
        result[name] = ports

    return jsonify(result)


# Ruta principal
@app.route('/')
def index():
    return render_template('index.html')


# =========================
# USERS
# =========================

# Lista de usuarios
@app.route('/users')
def users():
    return render_template('users.html')


# Editar usuario
@app.route('/editUser/<string:id>')
def edit_user(id):
    print("id recibido", id)
    return render_template('editUser.html', id=id)


# =========================
# PRODUCTS
# =========================

# Lista de productos
@app.route('/products')
def products():
    return render_template('products.html')


# Editar producto
@app.route('/editProduct/<string:id>')
def edit_product(id):
    print("id producto recibido", id)
    return render_template('editProduct.html', id=id)


# =========================
# ORDERS
# =========================

# Gestión de pedidos (requiere usuario logueado)
@app.route('/orders')
def orders():
    return render_template('orders.html')


if __name__ == '__main__':
    app.run()
