document.addEventListener('DOMContentLoaded', () => {
    // Load profile data with session credentials
    fetch('http://localhost:3001/api/profile', {
        credentials: 'include' // Ensure cookies are sent with the request
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch profile data');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const userAvatar = document.getElementById('avatar');

                if (data.user && data.user.profilePicture) {
                    let imageUrl;

                    // Determine if the profilePicture is a URL or an ID
                    if (data.user.profilePicture.includes('http') || data.user.profilePicture.includes('https')) {
                        // If it's a URL, use it directly
                        imageUrl = data.user.profilePicture;
                    } else {
                        // Otherwise, assume it's an ID and construct the URL for GridFS
                        imageUrl = `http://localhost:3001/auth/image/${data.user.profilePicture}`;
                    }

                    console.log('Profile picture URL:', imageUrl);
                    userAvatar.src = imageUrl;

                    // Add an error handler to revert to the fallback image if the image fails to load
                    userAvatar.onerror = () => {
                        console.error('Failed to load profile picture, falling back to default image.');
                        userAvatar.src = 'pictures/user_avatar.png';
                    };
                } else {
                    userAvatar.src = 'pictures/user_avatar.png'; // Fallback image
                }

                // Set other profile details
                document.getElementById('username').textContent = data.user.account || 'Username not provided';
                document.getElementById('email').textContent = data.user.email || 'Email not provided';
                document.getElementById('phonenum').textContent = data.user.phoneNumber || 'Phone number not provided';
                document.getElementById('realname').textContent = data.user.realname || 'Name not provided';
                document.getElementById('bday').textContent = data.user.bday ? new Date(data.user.bday).toDateString() : 'Birthday not provided';
            } else {
                console.error('Failed to load profile data:', data.message);
            }
        })
        .catch(error => console.error('Error loading profile data:', error));

    // Add event listener for the Edit Profile button
    document.querySelector('button[type="submit"]').addEventListener('click', () => {
        window.location.href = 'profile_edit.html'; // Redirect to profile_edit.html
    });
});

function loadNavigation() {
    fetch('navigation.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('nav-placeholder').innerHTML = data;
            console.log('Navigation HTML loaded successfully'); // Log success
            initPage(); // Only initialize the page after navigation is loaded
        })
        .catch(error => console.error('Error loading navigation:', error));
}

function initNavigation() {
    checkAndUpdateUserStatus(); // Example function to check if the user is logged in
}

window.onload = function () {
    loadNavigation(); // Load the navigation on page load
};
