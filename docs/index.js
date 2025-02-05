document.getElementById('login-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    console.log('Login Request:', { username, password });

    try {
        const response = await fetch('https://adam-jerusalem.nd.edu/api/auth/signin', { 
            method: 'POST',
            headers: {
                Authorization: 'Basic ' + btoa(`${username}:${password}`),
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) { 
            const errorText = await response.text();
            throw new Error(`Login Error: ${errorText}`);
        }

        let token = (await response.text()).trim(); // Get JWT as text

        // ✅ Remove any extra quotes that may have been added
        token = token.replace(/^"|"$/g, '');

        if (!token || token.split('.').length !== 3) { 
            throw new Error('Invalid JWT received');
        }

        localStorage.setItem('token', token);
        console.log('JWT stored:', token);
        window.location.href = 'page.html'; 

    } catch (error) {
        console.error('Login Failed:', error.message);
        document.getElementById('login-message').textContent = `Error: ${error.message}`;
    }
});
