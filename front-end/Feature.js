// Function to load the navigation HTML and initialize the page after loading
function loadNavigation() {
    fetch('navigation.html')
        .then(response => response.text())
        .then(data => {
            // Insert the loaded navigation HTML into the placeholder element
            document.getElementById('nav-placeholder').innerHTML = data;
            console.log('Navigation HTML loaded successfully'); // Log successful loading
            
            initPage(); // Initialize the page after navigation is loaded
        })
        .catch(error => console.error('Error loading navigation:', error));
}

// Function to initialize navigation, e.g., checking the user login status
function initNavigation() {
    checkAndUpdateUserStatus(); // Call function to check if the user is logged in
}

// Function to initialize the page and other functionalities after navigation is loaded
function initPage() {
    initNavigation(); // Initialize navigation-related functionalities

    // Additional page initialization logic can be added here if needed
}

// Trigger the loading of navigation and page initialization when the window loads
window.onload = function () {
    loadNavigation(); // Load the navigation HTML when the window has finished loading
};
