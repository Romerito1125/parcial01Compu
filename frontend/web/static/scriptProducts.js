async function getServiceBase(name) {
    const res = await fetch('/api/discovery');
    const services = await res.json();
    const ports = services[name] || [];
    if (!ports.length) {
        throw new Error('Service not available: ' + name);
    }
    return window.location.protocol + '//' + window.location.hostname + ':' + ports[0];
}



async function getProducts() {
    try {
        const base = await getServiceBase('products');
        const response = await fetch(base + '/api/products');
        const data = await response.json();
        console.log(data);

        var productListBody = document.querySelector('#product-list tbody');
        productListBody.innerHTML = '';

        data.forEach(product => {
            var row = document.createElement('tr');

            // ID
            var idCell = document.createElement('td');
            idCell.textContent = product.id;
            row.appendChild(idCell);

            // Name
            var nameCell = document.createElement('td');
            nameCell.textContent = product.name;
            row.appendChild(nameCell);

            // Price
            var priceCell = document.createElement('td');
            priceCell.textContent = product.price;
            row.appendChild(priceCell);

            // Stock
            var stockCell = document.createElement('td');
            stockCell.textContent = product.stock;
            row.appendChild(stockCell);

            // Actions
            var actionsCell = document.createElement('td');

            // Edit link
            var editLink = document.createElement('a');
            editLink.href = `/editProduct/${product.id}`;
            editLink.textContent = 'Edit';
            editLink.className = 'btn btn-primary mr-2';
            actionsCell.appendChild(editLink);

            // Delete link
            var deleteLink = document.createElement('a');
            deleteLink.href = '#';
            deleteLink.textContent = 'Delete';
            deleteLink.className = 'btn btn-danger';

            deleteLink.addEventListener('click', function() {
                deleteProduct(product.id);
            });

            actionsCell.appendChild(deleteLink);
            row.appendChild(actionsCell);

            productListBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}



/*
 * ============================================================
 * OBTENER PRODUCTOS PARA CREAR UNA ORDEN
 * ============================================================
 */

async function getProductForOrder() {

    try {


        const base =
            await getServiceBase(
                'products'
            );


        const response =
            await fetch(
                base + '/api/products'
            );


        if (!response.ok) {

            throw new Error(
                'Error obteniendo productos'
            );

        }


        const data =
            await response.json();


        const productListBody =
            document.querySelector(
                '#product-list tbody'
            );


        productListBody.innerHTML =
            '';


        data.forEach(

            function (product) {


                const row =
                    document.createElement(
                        'tr'
                    );


                /*
                 * ID
                 */

                const idCell =
                    document.createElement(
                        'td'
                    );


                idCell.textContent =
                    product.id;


                row.appendChild(
                    idCell
                );



                /*
                 * Name
                 */

                const nameCell =
                    document.createElement(
                        'td'
                    );


                nameCell.textContent =
                    product.name;


                row.appendChild(
                    nameCell
                );



                /*
                 * Price
                 */

                const priceCell =
                    document.createElement(
                        'td'
                    );


                priceCell.textContent =
                    product.price;


                row.appendChild(
                    priceCell
                );



                /*
                 * Stock
                 */

                const stockCell =
                    document.createElement(
                        'td'
                    );


                stockCell.textContent =
                    product.stock;


                row.appendChild(
                    stockCell
                );



                productListBody.appendChild(
                    row
                );


            }

        );


    } catch (error) {


        console.error(
            'Error obteniendo productos:',
            error
        );


        alert(
            'Error obteniendo productos: ' +
            error.message
        );


    }

}

async function createProduct() {
    var data = {
        name: document.getElementById('name').value,
        price: document.getElementById('price').value,
        stock: document.getElementById('stock').value
    };

    try {
        const base = await getServiceBase('products');
        const response = await fetch(base + '/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const result = await response.json();
        console.log(result);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function updateProduct() {
    var productId = document.getElementById('product-id').value;
    var data = {
        name: document.getElementById('name').value,
        price: document.getElementById('price').value,
        stock: document.getElementById('stock').value
    };

    try {
        const base = await getServiceBase('products');
        const response = await fetch(`${base}/api/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const result = await response.json();
        console.log(result);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function deleteProduct(productId) {
    console.log('Deleting product with ID:', productId);

    if (confirm('Are you sure you want to delete this product?')) {
        try {
            const base = await getServiceBase('products');
            const response = await fetch(`${base}/api/products/${productId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const result = await response.json();
            console.log('Product deleted successfully:', result);
            await getProducts();
        } catch (error) {
            console.error('Error:', error);
        }
    }
}