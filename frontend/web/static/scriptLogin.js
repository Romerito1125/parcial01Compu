async function getServiceBase(name) {

    const res = await fetch('/api/discovery');


    if (!res.ok) {

        throw new Error(
            'Error obteniendo los servicios'
        );

    }


    const services = await res.json();

    const ports = services[name] || [];


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


/*
 * Obtener JWT
 */
function getToken() {

    return localStorage.getItem(
        'token'
    );

}


/*
 * Login
 */
async function login() {

    const username =
        document.getElementById(
            'login-username'
        ).value;


    const password =
        document.getElementById(
            'login-password'
        ).value;


    const messageEl =
        document.getElementById(
            'login-message'
        );


    messageEl.textContent = '';

    messageEl.style.color = 'red';


    try {

        /*
         * Descubrir Users mediante Consul
         */
        const base =
            await getServiceBase(
                'users'
            );


        /*
         * Login
         */
        const response =
            await fetch(
                base + '/api/auth/login',
                {

                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({

                        username: username,
                        password: password

                    })

                }
            );


        const data =
            await response.json();


        /*
         * Credenciales inválidas
         */
        if (!response.ok) {

            messageEl.textContent =
                data.message ||
                'Credenciales inválidas';

            return;

        }


        /*
         * ==================================================
         * GUARDAR JWT
         * ==================================================
         */

        localStorage.setItem(
            'token',
            data.token
        );


        /*
         * Información del usuario
         * para mostrar en pantalla.
         */
        localStorage.setItem(
            'userId',
            data.user.id
        );


        localStorage.setItem(
            'userName',
            data.user.name
        );


        localStorage.setItem(
            'userEmail',
            data.user.email
        );


        /*
         * Limpiar formulario
         */
        document.getElementById(
            'login-username'
        ).value = '';


        document.getElementById(
            'login-password'
        ).value = '';


        /*
         * Ir a Orders
         */
        window.location.href =
            '/orders';


    } catch (error) {

        messageEl.textContent =
            'Error iniciando sesión: ' +
            error.message;

    }
}


/*
 * Submit del formulario
 */
document.addEventListener(
    'DOMContentLoaded',
    function () {

        const form =
            document.getElementById(
                'login-form'
            );


        if (!form) {
            return;
        }


        form.addEventListener(
            'submit',
            function (event) {

                event.preventDefault();

                login();

            }
        );

    }
);