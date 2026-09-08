from flask import Blueprint, request, jsonify
from products.models.product_model import Product
from db.db import db

product_controller = Blueprint('product_controller', __name__)


# Obtener todos los productos
@product_controller.route('/api/products', methods=['GET'])
def get_products():
    print("listado de productos")

    products = Product.query.all()

    result = [
        {
            'id': product.id,
            'name': product.name,
            'price': product.price,
            'stock': product.stock
        }
        for product in products
    ]

    return jsonify(result)


# Obtener un producto por ID
@product_controller.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    print("obteniendo producto")

    product = Product.query.get_or_404(product_id)

    return jsonify({
        'id': product.id,
        'name': product.name,
        'price': product.price,
        'stock': product.stock
    })


# Crear producto
@product_controller.route('/api/products', methods=['POST'])
def create_product():
    print("creando producto")

    data = request.json

    new_product = Product(
        name=data['name'],
        price=data['price'],
        stock=data.get('stock', 0)
    )

    db.session.add(new_product)
    db.session.commit()

    return jsonify({
        'message': 'Product created successfully'
    }), 201


# Actualizar producto
@product_controller.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    print("actualizando producto")

    product = Product.query.get_or_404(product_id)

    data = request.json

    product.name = data.get('name', product.name)
    product.price = data.get('price', product.price)
    product.stock = data.get('stock', product.stock)

    db.session.commit()

    return jsonify({
        'message': 'Product updated successfully'
    })


# Eliminar producto
@product_controller.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    print("eliminando producto")

    product = Product.query.get_or_404(product_id)

    db.session.delete(product)
    db.session.commit()

    return jsonify({
        'message': 'Product deleted successfully'
    })
