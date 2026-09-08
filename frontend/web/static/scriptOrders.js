async function getServiceBase(name) {

    const res = await fetch('/api/discovery');

    if (!res.ok) {
        throw new Error('Error obteniendo los servicios');
    }

    const services = await res.json();

    const ports = services[name] || [];

    if (!ports.length) {
        throw new Error('Service not available: ' + name);
    }

    return (
        window.location.protocol +
        '//' +
        window.location.hostname +
        ':' +
        ports[0]
    );
}


function getUserId() {
    return localStorage.getItem('userId');
}


function getUserName() {
    return localStorage.getItem('userName');
}


function logout() {

    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');

    window.location.href = '/';
}


/*
 * Comunicación con el microservicio Orders
 */
async function apiOrders(fetchOptions = {}) {

    const base = await getServiceBase('orders');

    const headers = Object.assign(
        {},
        fetchOptions.headers || {},
        {
            'X-User-Id': getUserId()
        }
    );

    return fetch(
        base + '/api/orders',
        Object.assign(
            {},
            fetchOptions,
            {
                headers: headers
            }
        )
    );
}


/*
 * Obtener las órdenes del usuario
 */
async function getOrders() {

    try {

        const response = await apiOrders();


        /*
         * Si el backend considera que la sesión
         * ya no es válida.
         */
        if (response.status === 401) {

            logout();

            alert('Session expired. Please log in again.');

            return;
        }


        if (!response.ok) {

            throw new Error(
                'Error obteniendo las órdenes: ' +
                response.status
            );

        }


        const data = await response.json();


        const orderListBody =
            document.querySelector('#order-list tbody');


        orderListBody.innerHTML = '';


        data.forEach(function (order) {

            const row = document.createElement('tr');


            /*
             * Order ID
             */
            const idCell = document.createElement('td');

            idCell.textContent = order.id;

            row.appendChild(idCell);


            /*
             * Total
             */
            const totalCell = document.createElement('td');

            totalCell.textContent = order.total;

            row.appendChild(totalCell);


            /*
             * Status
             */
            const statusCell = document.createElement('td');

            statusCell.textContent = order.status;

            row.appendChild(statusCell);


            /*
             * Created At
             */
            const createdCell = document.createElement('td');

            createdCell.textContent = order.created_at;

            row.appendChild(createdCell);


            /*
             * Items
             */
            const itemsCell = document.createElement('td');


            const itemsText = (order.items || [])
                .map(function (item) {

                    return (
                        'Product ' +
                        item.product_id +
                        ' x' +
                        item.quantity
                    );

                })
                .join(', ');


            itemsCell.textContent = itemsText;

            row.appendChild(itemsCell);


            orderListBody.appendChild(row);

        });

    } catch (error) {

        console.error('Error:', error);

        alert(
            'Error obteniendo las órdenes: ' +
            error.message
        );

    }
}


/*
 * Crear una orden
 */
async function createOrder() {

    const productId = parseInt(
        document.getElementById('product-id').value
    );


    const quantity = parseInt(
        document.getElementById('quantity').value
    );


    const data = {

        products: [

            {
                product_id: productId,
                quantity: quantity
            }

        ]

    };


    try {

        const response = await apiOrders({

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(data)

        });


        const result = await response.json();


        /*
         * Sesión inválida
         */
        if (response.status === 401) {

            logout();

            alert('Session expired. Please log in again.');

            return;
        }


        /*
         * Otro error del backend
         */
        if (!response.ok) {

            alert(
                result.message ||
                'Error creando la orden'
            );

            return;

        }


        console.log(result);


        /*
         * Limpiar formulario
         */
        document.getElementById('product-id').value = '';

        document.getElementById('quantity').value = '';


        /*
         * Recargar órdenes
         */
        getOrders();


    } catch (error) {

        alert(
            'Error creando la orden: ' +
            error.message
        );

    }
}


/*
 * Inicialización de la página
 */
document.addEventListener('DOMContentLoaded', function () {

    const userId = getUserId();


    /*
     * Verificar que el usuario haya iniciado sesión
     */
    if (!userId) {

        window.location.href = '/';

        return;

    }


    /*
     * Mostrar usuario actual
     */
    document.getElementById('current-user').textContent =
        getUserName() || 'User';


    /*
     * Cargar órdenes automáticamente
     */
    getOrders();


    /*
     * Cargar productos automáticamente
     *
     * Esta función está definida
     * en scriptProducts.js
     */
    getProductForOrder();


    /*
     * Configurar formulario
     */
    const form =
        document.getElementById('add-order-form');


    form.addEventListener('submit', function (event) {

        event.preventDefault();

        createOrder();

    });

});