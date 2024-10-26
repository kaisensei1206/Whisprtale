// Function to toggle the sidebar
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("open"); // Toggles the 'open' class
}

// Function to toggle the user dropdown
function toggleUserDropdown() {
  const userlist = document.querySelector('.userlist');

  // Check if the user is logged in before toggling the dropdown
  if (userlist && userlist.dataset.isLoggedIn === 'true') {
    userlist.classList.toggle('active');
  } else {
    console.log('User is not logged in. Dropdown cannot be toggled.');
  }
}

function hideJoinUsButton() {
  console.log('hideJoinUsButton function called');
  const joinUsButton = document.getElementById('join-us-button');
  if (joinUsButton) {
    console.log('Hiding "Join Us" button');
    joinUsButton.style.display = 'none';
  } else {
    console.log('"Join Us" button not found');
  }
}

function checkAndUpdateUserStatus() {
  console.log('checkAndUpdateUserStatus function called');

  fetch('http://localhost:3001/auth/status', {
    credentials: 'include'
  })
    .then(response => response.json())
    .then(data => {
      console.log('Received user status:', data);
      updatePageContent(data);
    })
    .catch(error => console.error('Error fetching user status:', error));
}

function updatePageContent(userStatus) {
  if (userStatus.isLoggedIn) {
    updateNavbar(userStatus);
    hideJoinUsButton(); // Hide the "Join Us" button here
  } else {
    console.log("User is not logged in.");
  }
}

function updateNavbar(user) {
  console.log('User object:', user); // Add this line

  const userAvatar = document.getElementById("userAvatar");
  const usernameElement = document.createElement('span');
  const loginButtons = document.querySelector(".navbutton");
  const userProfile = document.querySelector(".userlist");

  const existingUsernameSpan = document.querySelector('.username');
  if (existingUsernameSpan) {
    existingUsernameSpan.remove();
  }

  if (user.isLoggedIn) {
    const username = user.user?.account || 'Guest';
    console.log("Extracted username:", username); // Log the extracted username

    usernameElement.innerText = username;
    usernameElement.classList.add("username");

    if (loginButtons) {
      loginButtons.style.display = 'none';
    }

    if (userProfile) {
      userProfile.style.display = 'block';

      userAvatar.insertAdjacentElement('beforebegin', usernameElement);

      if (user.user && user.user.profilePicture) {
        userAvatar.src = user.user.profilePicture.includes('http')
          ? user.user.profilePicture
          : `http://localhost:3001/auth/image/${user.user.profilePicture}`;
      } else {
        userAvatar.src = 'pictures/user_avatar.png';
      }

      userAvatar.classList.add("show-userlist");
      usernameElement.classList.add("show-username");

      // Set a data attribute to track the login status
      userProfile.dataset.isLoggedIn = 'true';
    }

  } else {
    if (userAvatar) {
      userAvatar.src = 'pictures/user_avatar.png';
      userAvatar.classList.remove("show-userlist");
    }

    if (usernameElement) {
      usernameElement.classList.remove("show-username");
      usernameElement.innerText = '';
    }

    if (loginButtons) {
      loginButtons.style.display = 'block';
    }

    if (userProfile) {
      // Set a data attribute to track the login status
      userProfile.dataset.isLoggedIn = 'false';
    }
  }
}

// Function to check the login status and update the navigation bar
function updateNavigationBar() {
  fetch('http://localhost:3001/auth/status', {
    credentials: 'include' // Ensure cookies are sent for session management
  })
    .then(response => response.json())
    .then(data => {
      console.log('Received user status:', data); // Debug log for status response
      updateNavbar(data); // Use the provided function logic

      if (data.isLoggedIn) {
        // Attach logout event listener after DOM is updated
        document.getElementById('logout').addEventListener('click', (e) => {
          e.preventDefault(); // Prevent the default link behavior
          logoutUser();
        });
      }
    })
    .catch(error => console.error('Error fetching user status:', error));
}

// Function to handle logout
function logoutUser() {
  fetch('http://localhost:3001/auth/logout', {
    method: 'POST',
    credentials: 'include' // Ensure cookies are sent for session management
  })
    .then(response => response.json())
    .then(data => {
      if (data.message === 'Logout successful') {
        console.log('Logout successful, redirecting...'); // Debug log for logout
        // Redirect to homepage or reload page
        window.location.href = data.redirectUrl;
      }
    })
    .catch(error => console.error('Error logging out:', error));
}

// Function to initialize the page and sidebar
function initPage() {
  // Load navigation bar
  fetch('navigation.html')
    .then(response => response.text())
    .then(data => {
      document.getElementById('nav-placeholder').innerHTML = data;
      updateNavigationBar(); // Check login status and update nav bar after loading nav HTML
    })
    .catch(error => console.error('Error loading navigation:', error));

  checkAndUpdateUserStatus();
}

// Search form validation and button enable/disable
document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.querySelector('.searchBox');
  const searchInput = document.getElementById('searchInput');

  if (!searchForm || !searchInput) {
    console.error("Search form or input not found.");
    return;
  }

  const searchButton = searchForm.querySelector('button');

  if (!searchButton) {
    console.error("Search button not found.");
    return;
  }

  // Disable the search button initially if the input is empty
  searchButton.disabled = !searchInput.value.trim();

  // Enable or disable the search button based on input
  searchInput.addEventListener('input', () => {
    searchButton.disabled = !searchInput.value.trim();
  });

  // Prevent form submission if the search box is empty
  searchForm.addEventListener('submit', (event) => {
    if (!searchInput.value.trim()) {
      event.preventDefault(); // Prevent form submission
      alert('Please enter a search keyword.');
    }
  });

  // Prevent the search button click if the input is empty
  searchButton.addEventListener('click', (event) => {
    if (!searchInput.value.trim()) {
      event.preventDefault(); // Prevent click from submitting the form
      alert('Please enter a search keyword.');
    }
  });
});
