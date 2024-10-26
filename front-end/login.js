document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginBtn').addEventListener('click', () => {
        const account = document.getElementById('account').value;
        const password = document.getElementById('password').value;

        fetch('http://localhost:3001/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account, password }),
            credentials: 'include',
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.message === 'Login successful') {
                    window.location.href = data.redirectUrl;
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    });

    // Toggle password visibility
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.classList.toggle('fa-eye-slash');
    });

    // Google Sign-In
    document.getElementById('google-signin').addEventListener('click', () => {
        window.location.href = 'http://localhost:3001/auth/google';
    });
});
