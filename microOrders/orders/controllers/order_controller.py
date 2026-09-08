import requests

from flask import Blueprint, request, jsonify, g

from config import Config

from db.db import db

from orders.controllers.auth import user_required

from orders.models.order_model import Order, OrderItem


order_controller = Blueprint(
    'order_controller',
    __name__
)


# ============================================================
# BUSCAR PRODUCTS EN CONSUL
# ============================================================

def _products_service_url():

    consul_host = Config.CONSUL_HOST
    consul_port = Config.CONSUL_PORT

    try:

        response = requests.get(

            f'http://{consul_host}:{consul_port}/v1/health/service/products?passing=true',

            timeout=3

        )

        instances = response.json()

    except Exception:

        return None


    if not instances:

        return None


    service = instances[0]['Service']


    return (
        f"http://{service['Address']}:{service['Port']}"
    )


# ============================================================
# ORDER → DICT
# ============================================================

def _order_dict(order):

    return {

        'id': order.id,

        'user_name': order.user_name,

        'user_email': order.user_email,

        'total': order.total,

        'status': order.status,

        'created_at':
            order.created_at.strftime(
                '%Y-%m-%d %H:%M:%S'
            )
            if order.created_at
            else None

    }


# ============================================================
# ORDER ITEM → DICT
# ============================================================

def _item_dict(item):

    return {

        'id': item.id,

        'product_id': item.product_id,

        'quantity': item.quantity,

        'unit_price': item.unit_price,

        'subtotal': item.subtotal

    }


# ============================================================
# GET ORDERS
# ============================================================

@order_controller.route(
    '/api/orders',
    methods=['GET']
)
@user_required
def get_orders():

    orders = (

        Order.query

        .filter_by(
            user_email=g.user['email']
        )

        .order_by(
            Order.created_at.desc()
        )

        .all()

    )


    result = []


    for order in orders:

        order_data = _order_dict(
            order
        )


        order_data['items'] = [

            _item_dict(item)

            for item in order.items

        ]


        result.append(
            order_data
        )


    return jsonify(
        result
    )


# ============================================================
# GET ONE ORDER
# ============================================================

@order_controller.route(
    '/api/orders/<int:order_id>',
    methods=['GET']
)
@user_required
def get_order(order_id):

    order = (

        Order.query

        .filter_by(

            id=order_id,

            user_email=g.user['email']

        )

        .first_or_404()

    )


    order_data = _order_dict(
        order
    )


    order_data['items'] = [

        _item_dict(item)

        for item in order.items

    ]


    return jsonify(
        order_data
    )


# ============================================================
# CREATE ORDER
# ============================================================

@order_controller.route(
    '/api/orders',
    methods=['POST']
)
@user_required
def create_order():

    data = request.json or {}


    products = data.get(
        'products'
    )


    urlProducts = _products_service_url()


    print(
        f"URL del microservicio de productos: {urlProducts}"
    )


    # ========================================================
    # VALIDAR PRODUCTS
    # ========================================================

    if (
        not products
        or not isinstance(products, list)
    ):

        return jsonify({

            'message':
                'La lista de productos es requerida'

        }), 400


    if any(

        'product_id' not in p
        or p.get('quantity', 0) <= 0

        for p in products

    ):

        return jsonify({

            'message':
                'Cada línea requiere product_id y quantity mayor a 0'

        }), 400


    # ========================================================
    # PRODUCTS SERVICE
    # ========================================================

    products_url = _products_service_url()


    if not products_url:

        return jsonify({

            'message':
                'Microservicio de productos no disponible'

        }), 503


    lines = []


    # ========================================================
    # OBTENER PRODUCTOS
    # ========================================================

    for p in products:

        product_id = p[
            'product_id'
        ]

        quantity = p[
            'quantity'
        ]


        response = requests.get(

            f'{products_url}/api/products/{product_id}'

        )


        if response.status_code != 200:

            return jsonify({

                'message':
                    f'Producto {product_id} no encontrado'

            }), 404


        product = response.json()


        if quantity > product['stock']:

            return jsonify({

                'message':
                    f'Stock insuficiente para el producto {product_id}'

            }), 400


        lines.append({

            'product_id':
                product_id,

            'quantity':
                quantity,

            'name':
                product['name'],

            'price':
                product['price'],

            'stock':
                product['stock']

        })


    # ========================================================
    # CALCULAR TOTAL
    # ========================================================

    total = sum(

        line['quantity'] *
        line['price']

        for line in lines

    )


    # ========================================================
    # ACTUALIZAR STOCK
    # ========================================================

    for line in lines:

        response = requests.put(

            f'{products_url}/api/products/{line["product_id"]}',

            json={

                'name':
                    line['name'],

                'price':
                    line['price'],

                'stock':
                    line['stock'] -
                    line['quantity']

            }

        )


        if response.status_code != 200:

            return jsonify({

                'message':
                    'No se pudo actualizar el inventario del producto '
                    + str(line['product_id'])

            }), 500


    # ========================================================
    # CREAR ORDER
    # ========================================================

    order = Order(

        user_name=
            g.user['name'],

        user_email=
            g.user['email'],

        total=
            total,

        status=
            'confirmed'

    )


    # ========================================================
    # ORDER ITEMS
    # ========================================================

    for line in lines:

        order.items.append(

            OrderItem(

                product_id=
                    line['product_id'],

                quantity=
                    line['quantity'],

                unit_price=
                    line['price'],

                subtotal=
                    line['quantity'] *
                    line['price']

            )

        )


    # ========================================================
    # GUARDAR
    # ========================================================

    db.session.add(
        order
    )

    db.session.commit()


    return jsonify({

        'message':
            'Orden creada satisfactoriamente',

        'order_id':
            order.id,

        'total':
            total,

        'urlProducts':
            urlProducts

    }), 201