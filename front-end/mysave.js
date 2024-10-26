document.addEventListener('DOMContentLoaded', () => {
    const storyList = document.getElementById("storyList");
    const selectModeToggle = document.getElementById("selectModeToggle");
    const deleteSelectedButton = document.createElement('button'); // Create delete button
    deleteSelectedButton.id = "deleteSelectedButton";
    deleteSelectedButton.className = "delete-selected";
    deleteSelectedButton.textContent = "Unsave";
    deleteSelectedButton.style.display = 'none';

    // Append the delete button to the DOM if necessary
    const sortFilterDiv = document.querySelector('.sort-filter');
    if (sortFilterDiv) {
        sortFilterDiv.appendChild(deleteSelectedButton);
    }

    if (storyList && selectModeToggle && deleteSelectedButton) {
        let savedStories = [];
        let selectMode = false;
        let selectedCount = 0;
        let selectedStories = [];

        async function fetchSavedStories() {
            try {
                const response = await fetch('http://localhost:3001/api/saved-stories', {
                    method: 'GET',
                    credentials: 'include', // Include credentials to ensure cookies are sent
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                if (data.success) {
                    savedStories = data.stories;
                    renderStories(savedStories);
                } else {
                    console.error('Failed to fetch saved stories');
                }
            } catch (error) {
                console.error('Error fetching saved stories:', error);
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
                        window.location.href = `/bookPublic.html?storyId=${story._id}`;
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

        async function toggleSaveStatus(storyIds) {
            try {
                // Fetch the current user ID (assuming it's available globally or can be fetched)
                const responseStatus = await fetch('http://localhost:3001/auth/status', {
                    method: 'GET',
                    credentials: 'include',
                });
                const statusData = await responseStatus.json();
                const userId = statusData.user.userId; // Assuming user ID is available here

                // Send a request to toggle save status directly
                const response = await fetch('http://localhost:3001/toggle/toggle-save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ storyIds, userId }),
                    credentials: 'include'  // Ensure cookies are sent for session authentication
                });

                if (response.status === 401) {
                    alert('Unauthorized: Please log in to modify save status.');
                    window.location.href = '/auth/login'; // Adjust the login URL if necessary
                    return;
                }

                const data = await response.json();
                if (response.ok) {
                    return data.success;
                } else {
                    console.error('Failed to toggle save status:', data.message);
                    return false;
                }
            } catch (error) {
                console.error('Error toggling save status:', error);
                return false;
            }
        }

        async function deleteSelectedStories() {
            if (selectedStories.length === 0) return;

            if (!confirm("Are you sure you want to unsave the selected stories?")) {
                return;
            }

            const success = await toggleSaveStatus(selectedStories);

            if (success) {
                savedStories = savedStories.filter(story => !selectedStories.includes(story._id));
                selectedCount = 0;
                selectedStories = [];
                renderStories(savedStories);
                showPopupMessage('Stories unsaved');
            } else {
                console.error('Failed to unsave stories');
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

        fetchSavedStories();
    } else {
        console.error('One or more required elements are missing from the DOM.');
    }
});
