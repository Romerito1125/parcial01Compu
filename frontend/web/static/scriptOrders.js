let currentOrder = [];



async function getServiceBase(name) {

    const res = await fetch(
        '/api/discovery'
    );


    if (!res.ok) {

        throw new Error(
            'Error obteniendo los servicios'
        );

    }


    const services =
        await res.json();


    const ports =
        services[name] || [];


    if (!ports.length) {

        throw new Error(
            'Service not available: ' + name
        );

    }


    return (

        window.location.protocol +

        '//' +

        window.location.hostname +

        ':' +

        ports[0]

    );

}



function getToken() {

    return localStorage.getItem(
        'token'
    );

}


function getUserName() {

    return localStorage.getItem(
        'userName'
    );

}


function logout() {

    localStorage.removeItem(
        'token'
    );

    localStorage.removeItem(
        'userId'
    );

    localStorage.removeItem(
        'userName'
    );

    localStorage.removeItem(
        'userEmail'
    );


    window.location.href = '/';

}


async function apiOrders(
    fetchOptions = {},
    endpoint = '/api/orders'
) {

    const token =
        getToken();


    if (!token) {

        logout();

        return null;

    }


    const base =
        await getServiceBase(
            'orders'
        );


    const headers =
        Object.assign(

            {},

            fetchOptions.headers || {},

            {

                'Authorization':
                    'Bearer ' + token

            }

        );


    return fetch(

        base + endpoint,

        Object.assign(

            {},

            fetchOptions,

            {

                headers: headers

            }

        )

    );

}



function addProductToOrder() {

    const productId =
        parseInt(

            document.getElementById(
                'product-id'
            ).value

        );


    const quantity =
        parseInt(

            document.getElementById(
                'quantity'
            ).value

        );


    if (!productId || productId <= 0) {

        alert(
            'Ingrese un Product ID válido'
        );

        return;

    }


    if (!quantity || quantity <= 0) {

        alert(
            'Ingrese una cantidad válida'
        );

        return;

    }


    /*
     * Buscar si el producto
     * ya está en la orden.
     */

    const existingProduct =
        currentOrder.find(

            function (product) {

                return (
                    product.product_id === productId
                );

            }

        );


    /*
     * Si existe, sumar cantidad.
     */

    if (existingProduct) {

        existingProduct.quantity +=
            quantity;

    }


    /*
     * Si no existe, agregarlo.
     */

    else {

        currentOrder.push({

            product_id:
                productId,

            quantity:
                quantity

        });

    }


    /*
     * Limpiar formulario.
     */

    document.getElementById(
        'product-id'
    ).value = '';


    document.getElementById(
        'quantity'
    ).value = '';


    renderCurrentOrder();

}


function renderCurrentOrder() {

    const orderBody =
        document.querySelector(
            '#current-order-list tbody'
        );


    orderBody.innerHTML = '';


    currentOrder.forEach(

        function (
            product,
            index
        ) {


            const row =
                document.createElement(
                    'tr'
                );


            /*
             * Product ID
             */

            const idCell =
                document.createElement(
                    'td'
                );


            idCell.textContent =
                product.product_id;


            row.appendChild(
                idCell
            );


            /*
             * Quantity
             */

            const quantityCell =
                document.createElement(
                    'td'
                );


            quantityCell.textContent =
                product.quantity;


            row.appendChild(
                quantityCell
            );


            /*
             * Action
             */

            const actionCell =
                document.createElement(
                    'td'
                );


            const deleteButton =
                document.createElement(
                    'button'
                );


            deleteButton.textContent =
                'Remove';


            deleteButton.className =
                'btn btn-danger btn-sm';


            deleteButton.addEventListener(

                'click',

                function () {

                    removeProductFromOrder(
                        index
                    );

                }

            );


            actionCell.appendChild(
                deleteButton
            );


            row.appendChild(
                actionCell
            );


            orderBody.appendChild(
                row
            );


        }

    );

}



function removeProductFromOrder(
    index
) {

    currentOrder.splice(
        index,
        1
    );


    renderCurrentOrder();

}


async function createOrder() {

    /*
     * Verificar que existan productos.
     */

    if (currentOrder.length === 0) {

        alert(
            'Debe agregar al menos un producto a la orden'
        );

        return;

    }


    const data = {

        products:
            currentOrder

    };


    try {

        const response =
            await apiOrders({

                method:
                    'POST',

                headers: {

                    'Content-Type':
                        'application/json'

                },

                body:
                    JSON.stringify(
                        data
                    )

            });


        if (!response) {

            return;

        }


        const result =
            await response.json();


        /*
         * JWT inválido.
         */

        if (
            response.status === 401
        ) {

            alert(

                result.message ||

                'Session expired'

            );


            logout();

            return;

        }


        /*
         * Error del backend.
         */

        if (!response.ok) {

            alert(

                result.message ||

                'Error creando la orden'

            );

            return;

        }


        /*
         * Orden creada.
         */

        alert(
            'Orden creada correctamente'
        );


        /*
         * Vaciar orden actual.
         */

        currentOrder = [];


        renderCurrentOrder();


        /*
         * Recargar productos.
         */

        getProductForOrder();


        /*
         * Recargar órdenes.
         */

        getOrders();


    } catch (error) {

        console.error(
            error
        );


        alert(

            'Error creando la orden: ' +

            error.message

        );

    }

}



async function getOrders() {

    try {

        const response =
            await apiOrders();


        if (!response) {

            return;

        }


        /*
         * JWT inválido.
         */

        if (
            response.status === 401
        ) {

            logout();

            return;

        }


        if (!response.ok) {

            throw new Error(
                'Error obteniendo órdenes'
            );

        }


        const data =
            await response.json();


        const orderListBody =
            document.querySelector(
                '#order-list tbody'
            );


        orderListBody.innerHTML =
            '';


        data.forEach(

            function (order) {


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
                    order.id;


                row.appendChild(
                    idCell
                );


                /*
                 * Total
                 */

                const totalCell =
                    document.createElement(
                        'td'
                    );


                totalCell.textContent =
                    order.total;


                row.appendChild(
                    totalCell
                );


                /*
                 * Status
                 */

                const statusCell =
                    document.createElement(
                        'td'
                    );


                statusCell.textContent =
                    order.status;


                row.appendChild(
                    statusCell
                );


                /*
                 * Fecha
                 */

                const createdCell =
                    document.createElement(
                        'td'
                    );


                createdCell.textContent =
                    order.created_at;


                row.appendChild(
                    createdCell
                );


                /*
                 * Items resumidos
                 */

                const itemsCell =
                    document.createElement(
                        'td'
                    );


                const itemsText =

                    (order.items || [])

                    .map(

                        function (item) {

                            return (

                                'Product ' +

                                item.product_id +

                                ' x' +

                                item.quantity

                            );

                        }

                    )

                    .join(', ');


                itemsCell.textContent =
                    itemsText;


                row.appendChild(
                    itemsCell
                );


                /*
                 * BOTÓN VER DETALLE
                 */

                const actionCell =
                    document.createElement(
                        'td'
                    );


                const detailButton =
                    document.createElement(
                        'button'
                    );


                detailButton.textContent =
                    'View Detail';


                detailButton.className =
                    'btn btn-info btn-sm';


                detailButton.addEventListener(

                    'click',

                    function () {

                        getOrderDetail(
                            order.id
                        );

                    }

                );


                actionCell.appendChild(
                    detailButton
                );


                row.appendChild(
                    actionCell
                );


                orderListBody.appendChild(
                    row
                );


            }

        );


    } catch (error) {

        console.error(
            'Error:',
            error
        );

    }

}



async function getOrderDetail(
    orderId
) {

    try {

        /*
         * Llamar al endpoint:
         *
         * GET /api/orders/<id>
         */

        const response =
            await apiOrders(
                {},
                '/api/orders/' + orderId
            );


        if (!response) {

            return;

        }


        /*
         * JWT inválido.
         */

        if (
            response.status === 401
        ) {

            alert(
                'Session expired'
            );


            logout();

            return;

        }


        /*
         * Orden no encontrada.
         */

        if (
            response.status === 404
        ) {

            alert(
                'Orden no encontrada'
            );

            return;

        }


        /*
         * Otro error.
         */

        if (!response.ok) {

            throw new Error(
                'Error obteniendo el detalle de la orden'
            );

        }


        const order =
            await response.json();


        /*
         * Obtener contenedor del modal.
         */

        const detailContent =
            document.getElementById(
                'order-detail-content'
            );


        detailContent.innerHTML =
            '';


        /*
         * INFORMACIÓN GENERAL
         */

        const generalInfo =
            document.createElement(
                'div'
            );


        generalInfo.innerHTML = `

            <h5 class="mb-3">
                Order #${order.id}
            </h5>

            <p>
                <strong>User:</strong>
                ${order.user_name}
            </p>

            <p>
                <strong>Email:</strong>
                ${order.user_email}
            </p>

            <p>
                <strong>Status:</strong>
                ${order.status}
            </p>

            <p>
                <strong>Created At:</strong>
                ${order.created_at}
            </p>

            <p>
                <strong>Total:</strong>
                ${order.total}
            </p>

            <hr>

            <h5>
                Products
            </h5>

        `;


        detailContent.appendChild(
            generalInfo
        );


        /*
         * LISTA DE ITEMS
         */

        const items =
            order.items || [];


        if (items.length === 0) {

            const emptyMessage =
                document.createElement(
                    'p'
                );


            emptyMessage.textContent =
                'Esta orden no contiene productos.';


            detailContent.appendChild(
                emptyMessage
            );

        }


        items.forEach(

            function (item) {

                const itemContainer =
                    document.createElement(
                        'div'
                    );


                itemContainer.className =
                    'detail-item';


                itemContainer.innerHTML = `

                    <div>

                        <strong>
                            Product ID:
                        </strong>

                        ${item.product_id}

                    </div>


                    <div>

                        <strong>
                            Quantity:
                        </strong>

                        ${item.quantity}

                    </div>


                    <div>

                        <strong>
                            Unit Price:
                        </strong>

                        ${item.unit_price}

                    </div>


                    <div>

                        <strong>
                            Subtotal:
                        </strong>

                        ${item.subtotal}

                    </div>

                `;


                detailContent.appendChild(
                    itemContainer
                );

            }

        );


        /*
         * Mostrar modal.
         */

        $('#orderDetailModal').modal(
            'show'
        );


    } catch (error) {

        console.error(
            'Error obteniendo detalle:',
            error
        );


        alert(

            'Error obteniendo el detalle: ' +

            error.message

        );

    }

}


// ============================================================
// INICIALIZACIÓN
// ============================================================

document.addEventListener(

    'DOMContentLoaded',

    function () {


        const token =
            getToken();


        /*
         * Si no hay JWT.
         */

        if (!token) {

            window.location.href =
                '/';

            return;

        }


        /*
         * Mostrar usuario.
         */

        document.getElementById(
            'current-user'
        ).textContent =

            getUserName() ||

            'User';


        /*
         * Cargar órdenes.
         */

        getOrders();


        /*
         * Cargar productos.
         */

        getProductForOrder();


        /*
         * Formulario agregar producto.
         */

        const form =
            document.getElementById(
                'add-product-form'
            );


        form.addEventListener(

            'submit',

            function (event) {

                event.preventDefault();


                addProductToOrder();

            }

        );

    }

);