document.addEventListener('DOMContentLoaded', () => {
    const storyList = document.getElementById("storyList");
    const selectModeToggle = document.getElementById("selectModeToggle");
    const deleteSelectedButton = document.getElementById("deleteSelectedButton");

    if (storyList && selectModeToggle && deleteSelectedButton) {
        let userStories = [];
        let selectMode = false;
        let selectedCount = 0;
        let selectedStories = [];

        async function fetchStories() {
            try {
                const response = await fetch('http://localhost:3001/collection/my-collection', {
                    method: 'GET',
                    credentials: 'include',
                });

                if (response.status === 401) {
                    alert('Unauthorized: Please log in to access this resource.');
                    window.location.href = '/login';
                    return;
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const data = await response.json();
                    if (data.success) {
                        userStories = data.stories;
                        renderStories(userStories);
                    } else {
                        console.error('Failed to fetch stories');
                    }
                } else {
                    console.error("Expected JSON, but got:", contentType);
                }
            } catch (error) {
                console.error('Error fetching stories:', error);
            }
        }

        function renderStories(stories) {
            storyList.innerHTML = '';
            stories.forEach(story => {
                const listItem = document.createElement("div");
                listItem.className = "story-item";
                listItem.innerHTML = `
                    <img src="http://localhost:3001/api/image/${story.content[0].imageUrl}" alt="${story.title}">
                    <h2>${story.title}</h2>
                    <div class="checkmark"></div>
                `;
                listItem.dataset.id = story._id;
                listItem.addEventListener('click', () => {
                    if (selectMode) {
                        toggleSelection(listItem);
                    } else {
                        window.location.href = `/book.html?storyId=${story._id}`;
                    }
                });
                storyList.appendChild(listItem);
            });
        }

        function toggleSelection(item) {
            const checkmark = item.querySelector('.checkmark');
            const id = item.dataset.id;

            if (selectedStories.includes(id)) {
                selectedStories = selectedStories.filter(storyId => storyId !== id);
                selectedCount--;
                item.classList.remove('selected');
                checkmark.style.display = 'none';
            } else {
                selectedStories.push(id);
                selectedCount++;
                item.classList.add('selected');
                checkmark.style.display = 'block';
            }

            updateSelectionBar();
            showPopupMessage(`${selectedCount} story(ies) selected`);
        }

        function updateSelectionBar() {
            if (selectMode && selectedCount > 0) {
                deleteSelectedButton.style.display = 'inline-block';
            } else {
                deleteSelectedButton.style.display = 'none';
            }
        }

        async function deleteSelectedStories() {
            if (selectedStories.length === 0) return;

            if (!confirm("Are you sure you want to delete the selected stories? This action cannot be undone.")) {
                return;
            }

            try {
                const response = await fetch('http://localhost:3001/delete/delete-books', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ storyIds: selectedStories }),
                    credentials: 'include'  // Ensure cookies are sent for session authentication
                });

                if (response.status === 401) {
                    alert('Unauthorized: Please log in to delete stories.');
                    window.location.href = '/auth/login'; // Adjust the login URL if necessary
                    return;
                }

                if (response.ok) {
                    userStories = userStories.filter(story => !selectedStories.includes(story._id));
                    selectedCount = 0;
                    selectedStories = [];
                    renderStories(userStories);
                    showPopupMessage('Stories deleted');
                } else {
                    console.error('Failed to delete stories');
                }
            } catch (error) {
                console.error('Error deleting stories:', error);
            }
        }

        function toggleSelectMode() {
            selectMode = !selectMode;
            if (!selectMode) {
                selectedCount = 0;
                selectedStories = [];
                const storyItems = document.querySelectorAll('.story-item');
                storyItems.forEach(item => {
                    item.classList.remove('selected');
                    const checkmark = item.querySelector('.checkmark');
                    if (checkmark) {
                        checkmark.style.display = 'none';
                    }
                });
            }
            updateSelectionBar();
            showPopupMessage(selectMode ? 'Select Mode On' : 'Select Mode Off');
        }

        function showPopupMessage(message) {
            const popup = document.createElement('div');
            popup.className = 'popup-message';
            popup.textContent = message;
            document.body.appendChild(popup);
            popup.style.display = 'block';

            setTimeout(() => {
                popup.style.display = 'none';
                document.body.removeChild(popup);
            }, 2000);
        }

        selectModeToggle.addEventListener('click', toggleSelectMode);
        deleteSelectedButton.addEventListener('click', deleteSelectedStories);

        fetchStories();
    } else {
        console.error('One or more required elements are missing from the DOM.');
    }
});
