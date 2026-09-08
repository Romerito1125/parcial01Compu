async function getServiceBase(name) {
    const res = await fetch('/api/discovery');
    const services = await res.json();
    const ports = services[name] || [];
    if (!ports.length) {
        throw new Error('Service not available: ' + name);
    }
    return window.location.protocol + '//' + window.location.hostname + ':' + ports[0];
}

async function getUsers() {
    try {
        const base = await getServiceBase('users');
        const response = await fetch(base + '/api/users');
        const data = await response.json();
        console.log(data);

        // Get table body
        var userListBody = document.querySelector('#user-list tbody');
        userListBody.innerHTML = ''; // Clear previous data

        // Loop through users and populate table rows
        data.forEach(user => {
            var row = document.createElement('tr');

            // Name
            var nameCell = document.createElement('td');
            nameCell.textContent = user.name;
            row.appendChild(nameCell);

            // Email
            var emailCell = document.createElement('td');
            emailCell.textContent = user.email;
            row.appendChild(emailCell);

            // Username
            var usernameCell = document.createElement('td');
            usernameCell.textContent = user.username;
            row.appendChild(usernameCell);

            // Actions
            var actionsCell = document.createElement('td');

            // Edit link
            var editLink = document.createElement('a');
            editLink.href = `/editUser/${user.id}`;
            editLink.textContent = 'Edit';
            editLink.className = 'btn btn-primary mr-2';
            actionsCell.appendChild(editLink);

            // Delete link
            var deleteLink = document.createElement('a');
            deleteLink.href = '#';
            deleteLink.textContent = 'Delete';
            deleteLink.className = 'btn btn-danger';
            deleteLink.addEventListener('click', function() {
                deleteUser(user.id);
            });
            actionsCell.appendChild(deleteLink);

            row.appendChild(actionsCell);

            userListBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

async function createUser() {
    var data = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    };

    try {
        const base = await getServiceBase('users');
        const response = await fetch(base + '/api/users', {
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

async function updateUser() {
    var userId = document.getElementById('user-id').value;
    var data = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    };

    try {
        const base = await getServiceBase('users');
        const response = await fetch(`${base}/api/users/${userId}`, {
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

async function deleteUser(userId) {
    console.log('Deleting user with ID:', userId);
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            const base = await getServiceBase('users');
            const response = await fetch(`${base}/api/users/${userId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const result = await response.json();
            console.log('User deleted successfully:', result);
            await getUsers();
        } catch (error) {
            console.error('Error:', error);
        }
    }
}