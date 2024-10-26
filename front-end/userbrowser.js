import { initializeNavigationBar } from './navigationbar.js';

document.addEventListener('DOMContentLoaded', () => {
    // Fetch and load the navigation bar
    fetch('Navigationbar.html')
        .then(response => response.text())
        .then(data => {
            const navigationContainer = document.getElementById('Navigationbar');
            navigationContainer.innerHTML = data;

            // Call the initialization function
            initializeNavigationBar();
        })
        .catch(error => console.error('Error loading Navigationbar:', error));



    // Handle item button clicks
    const items = document.querySelectorAll('.item');
    items.forEach((item) => {
        const heartButton = item.querySelector('button:nth-child(2)');
        const dislikeButton = item.querySelector('button:nth-child(3)');
        const saveButton = item.querySelector('button:nth-child(4)');

        if (heartButton) {
            heartButton.addEventListener('click', () => {
                console.log("click heart"); // Log for debugging
                heartButton.classList.toggle('heart-clicked');
                if (dislikeButton && dislikeButton.classList.contains('heart-clicked')) {
                    dislikeButton.classList.remove('heart-clicked');
                }
            });
        } else {
            console.error("Heart button not found in item.");
        }

        if (dislikeButton) {
            dislikeButton.addEventListener('click', () => {
                console.log("click dislike"); // Log for debugging
                dislikeButton.classList.toggle('heart-clicked');
                if (heartButton && heartButton.classList.contains('heart-clicked')) {
                    heartButton.classList.remove('heart-clicked');
                }
            });
        } else {
            console.error("Dislike button not found in item.");
        }

        if (saveButton) {
            saveButton.addEventListener('click', () => {
                console.log("click save"); // Log for debugging
                saveButton.classList.toggle('heart-clicked');
            });
        } else {
            console.error("Save button not found in item.");
        }
    });

    // Search form logic
    var searchForm = document.getElementById("searchForm");
    var searchInput = document.getElementById("searchInput");

    // Additional functionality for managing items
    const itemsPerPage = 8;
    let currentPage = 1;
    let manageMode = false;
    let storyIndex = 1; // Initialize story index

    function setupDeleteButton(deleteButton) {
        deleteButton.addEventListener('click', function() {
            const item = deleteButton.closest('.item');
            if (item) {
                items = items.filter(i => i !== item);
                renderItems();
            }
        });
    }

    function addNewItem() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        fileInput.addEventListener('change', function() {
            const file = fileInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const newItem = document.createElement('span');
                    newItem.className = 'item';
                    const defaultName = `故事檔案${storyIndex++}`; // Default name
                    newItem.innerHTML = `
                        <div class="item-header">
                            <input type="text" class="image-name" placeholder="输入图片名称" value="${defaultName}">
                        </div>
                        <button type="button" class="like"><img src="pictures/like.png" alt="Like"></button>
                        <button type="button" class="dislike"><img src="pictures/dislike.png" alt="Dislike"></button>
                        <div class="image-container"><img src="${e.target.result}" alt="User Image"></div>
                        <button class="delete-button"><img src="pictures/trash.png" alt="Delete" style="width: 40px; height: 40px;"></button>
                    `;
                    setupDeleteButton(newItem.querySelector('.delete-button'));
                    items.push(newItem);
                    renderItems();
                }
                reader.readAsDataURL(file);
            }
            document.body.removeChild(fileInput); // Remove file input
        });

        // Trigger file input
        fileInput.click();
    }

    function renderItems() {
        const container = document.querySelector('.container');
        container.innerHTML = '';
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageItems = items.slice(startIndex, endIndex);
        pageItems.forEach(item => container.appendChild(item));
        updatePageControls();
    }

    function updatePageControls() {
        document.getElementById('currentPage').value = currentPage;
        document.getElementById('prevPageButton').disabled = currentPage === 1;
        document.getElementById('nextPageButton').disabled = items.length <= currentPage * itemsPerPage;
    }

    function toggleManageMode() {
        manageMode = !manageMode;
        document.querySelectorAll('.delete-button').forEach(button => {
            button.style.display = manageMode ? 'block' : 'none';
        });
    }

    document.getElementById('newStoryButton').addEventListener('click', addNewItem);
    document.getElementById('prevPageButton').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderItems();
        }
    });

    document.getElementById('nextPageButton').addEventListener('click', () => {
        if (items.length > currentPage * itemsPerPage) {
            currentPage++;
            renderItems();
        }
    });

    document.getElementById('manageButton').addEventListener('click', toggleManageMode);

    document.querySelectorAll('.delete-button').forEach(setupDeleteButton);

    document.getElementById('searchButton').addEventListener('click', () => {
        const query = document.getElementById('search').value.toLowerCase();
        const container = document.querySelector('.container');
        container.innerHTML = '';
        const filteredItems = items.filter(item => {
            const name = item.querySelector('.image-name').value.toLowerCase();
            return name.includes(query);
        });
        filteredItems.forEach(item => container.appendChild(item));
    });
});
