document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email');
    const accountInput = document.getElementById('account');
    const passwordInput = document.getElementById('password');
    const cpasswordInput = document.getElementById('cpassword');
    const togglePassword = document.getElementById('togglePassword');
    const toggleCPassword = document.getElementById('toggleCPassword');

    const profilePictureInput = document.getElementById('profile-picture');
    const cropModal = document.getElementById('cropModal');
    const cropImage = document.getElementById('crop-image');
    const cropButton = document.getElementById('crop-button');
    const croppedImage = document.getElementById('cropped-image');
    let croppedBlob;
    let cropper;

    const warnings = {
        email: document.getElementById('email-warning'),
        account: document.getElementById('account-warning'),
        password: document.getElementById('password-warning'),
        cpassword: document.getElementById('cpassword-warning')
    };

    // Ensure the modal is hidden on page load
    cropModal.style.display = 'none';

    // Validation functions
    const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.toLowerCase());
    const validateUsername = (username) => /^[A-Za-z]{2,}$/.test(username); // Require at least 5 letters
    const validatePassword = (password) => /^(?=.*[A-Z])(?=.*\d.*\d)[A-Za-z\d]{1,}$/.test(password);

    // Show and hide warnings
    const showWarning = (input, message) => {
        warnings[input].innerText = message;
        warnings[input].style.display = 'block';
    };

    const hideWarning = (input) => {
        warnings[input].innerText = '';
        warnings[input].style.display = 'none';
    };

    // Check for existing email or username
    const checkExisting = async (field, value) => {
        try {
            const response = await fetch(`http://localhost:3001/auth/check-existence`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ field, value })
            });

            if (response.ok) {
                const result = await response.json();
                return result.exists;
            } else {
                console.error('Error checking existence:', await response.text());
                return false;
            }
        } catch (error) {
            console.error('Error:', error);
            return false;
        }
    };

    // Event listeners for input validation
    emailInput.addEventListener('blur', async () => {
        hideWarning('email');
        if (!validateEmail(emailInput.value)) {
            showWarning('email', 'Invalid email format');
            return;
        }
        const emailExists = await checkExisting('email', emailInput.value);
        if (emailExists) {
            showWarning('email', 'This email already exists');
        }
    });

    accountInput.addEventListener('blur', async () => {
        hideWarning('account');
        if (!validateUsername(accountInput.value)) {
            showWarning('account', 'Username must contain at least 2 letters');
            return;
        }
        const accountExists = await checkExisting('account', accountInput.value);
        if (accountExists) {
            showWarning('account', 'This username already exists');
        }
    });

    passwordInput.addEventListener('input', () => {
        hideWarning('password');
        if (!validatePassword(passwordInput.value)) {
            showWarning('password', 'Password must contain at least 1 capital letter and 2 numbers');
        }
    });

    cpasswordInput.addEventListener('input', () => {
        hideWarning('cpassword');
        if (passwordInput.value !== cpasswordInput.value) {
            showWarning('cpassword', 'Passwords do not match');
        } else {
            hideWarning('cpassword');
        }
    });

    // Image Upload and Crop Logic
    profilePictureInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                cropImage.src = reader.result;
                cropModal.style.display = 'flex'; // Show modal when the image is ready

                // Initialize Cropper only after the image has been loaded
                if (cropper) {
                    cropper.destroy(); // Destroy previous cropper instance if it exists
                }
                cropper = new Cropper(cropImage, {
                    aspectRatio: 1,
                    viewMode: 1,
                    dragMode: 'move',
                    autoCropArea: 1,
                    restore: false,
                    guides: false,
                    center: false,
                    highlight: false,
                    cropBoxMovable: false,
                    cropBoxResizable: false,
                    toggleDragModeOnDblclick: false,
                });
            };
            reader.readAsDataURL(file);
        }
    });

    cropButton.addEventListener('click', () => {
        if (cropper) {
            const canvas = cropper.getCroppedCanvas({
                width: 55,
                height: 55,
            });
            canvas.toBlob((blob) => {
                croppedBlob = blob;
                croppedImage.src = URL.createObjectURL(blob);
                croppedImage.style.display = 'block';
                cropModal.style.display = 'none'; // Hide modal after cropping
            });
        }
    });

    // Close modal on click outside of the content
    window.addEventListener('click', (event) => {
        if (event.target === cropModal) {
            cropModal.style.display = 'none';
        }
    });

    // Registration form submission
    document.getElementById('registerBtn').addEventListener('click', async () => {
        hideWarning('password');
        hideWarning('cpassword');

        const email = emailInput.value;
        const account = accountInput.value;
        const password = passwordInput.value;
        const cpassword = cpasswordInput.value;

        if (!validatePassword(password)) {
            showWarning('password', 'Password must contain at least 1 capital letter and 2 numbers');
            return;
        }

        if (password !== cpassword) {
            showWarning('cpassword', 'Passwords do not match');
            return;
        }

        const formData = new FormData();
        formData.append('email', email);
        formData.append('account', account);
        formData.append('password', password);
        if (croppedBlob) {
            formData.append('profilePicture', croppedBlob, 'profile.jpg');
        }

        try {
            const response = await fetch('http://localhost:3001/auth/register', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message);
                window.location.href = 'index.html'; // Redirect to homepage
            } else {
                // Try to parse the response as JSON, otherwise log the response
                try {
                    const error = await response.json();
                    alert(`Error: ${error.message}`);
                } catch (e) {
                    console.error('Unexpected error:', await response.text());
                    alert('An unexpected error occurred. Please try again later.');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again later.');
        }
    });

    // Toggle password visibility
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.classList.toggle('fa-eye');
        togglePassword.classList.toggle('fa-eye-slash');
    });

    toggleCPassword.addEventListener('click', () => {
        const type = cpasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        cpasswordInput.setAttribute('type', type);
        toggleCPassword.classList.toggle('fa-eye');
        toggleCPassword.classList.toggle('fa-eye-slash');
    });

    // Google Sign-In
    document.getElementById('google-signin').addEventListener('click', () => {
        window.location.href = 'http://localhost:3001/auth/google';
    });

    fetch('navigation.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('nav-placeholder').innerHTML = data;
            console.log('Navigation HTML loaded successfully'); // Log success
        })
        .catch(error => console.error('Error loading navigation:', error));
});
s