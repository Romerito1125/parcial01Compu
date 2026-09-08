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


async function login() {

    const username =
        document.getElementById('login-username').value;

    const password =
        document.getElementById('login-password').value;


    const messageEl =
        document.getElementById('login-message');


    messageEl.textContent = '';
    messageEl.style.color = 'red';


    try {

        const base =
            await getServiceBase('users');


        const response =
            await fetch(
                base + '/api/auth/login',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                }
            );


        const data = await response.json();


        if (!response.ok) {

            messageEl.textContent =
                data.message ||
                'Credenciales inválidas';

            return;
        }


        /*
         * Guardar temporalmente los datos
         * del usuario.
         */
        localStorage.setItem(
            'userId',
            data.id
        );

        localStorage.setItem(
            'userName',
            data.name
        );

        localStorage.setItem(
            'userEmail',
            data.email
        );


        /*
         * Ir a la página protegida.
         */
        window.location.href = '/orders';


    } catch (error) {

        messageEl.textContent =
            'Error iniciando sesión: ' +
            error.message;
    }
}


document.addEventListener(
    'DOMContentLoaded',
    function () {

        const form =
            document.getElementById('login-form');


        form.addEventListener(
            'submit',
            function (event) {

                event.preventDefault();

                login();

            }
        );

    }
);