console.log('index.js loaded and running');
window.onload = function () {
    loadNavigation();
    fetchAndDisplayPopularBooks();
    fetchAndDisplayRecommendedBooks();
    checkAndUpdateUserStatus();
};
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

// Function to hide the "Join Us" button if the user is logged in
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

// Check user status and update content
function checkAndUpdateUserStatus() {
    console.log('checkAndUpdateUserStatus function called');

    fetch('http://localhost:3001/auth/status', {
        credentials: 'include'
    })
        .then(response => response.json())
        .then(data => {
            console.log('Received user status:', data);
            updatePageContent(data);
            if (!data.isLoggedIn) {
                // Hide Recommended Books Section if the user is not logged in
                const recommendedBooksSection = document.getElementById('recommended-books-section');
                if (recommendedBooksSection) {
                    recommendedBooksSection.style.display = 'none';
                }
            }
        })
        .catch(error => console.error('Error fetching user status:', error));
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
// Fetch popular books and update the slideshow
function fetchAndDisplayPopularBooks() {
    fetch('http://localhost:3001/api/published')
        .then(response => response.json())
        .then(data => {
            const slideshowContainer = document.querySelector('.slideshow-container');
            slideshowContainer.innerHTML = '';  // Clear existing slides

            if (data.stories.length === 0) {
                console.warn("No popular books found.");
                return;
            }

            data.stories.forEach((book, index) => {
                const slide = document.createElement('div');
                slide.className = 'slide';
                if (index === 0) slide.style.display = 'block';  // Show the first slide initially
                slide.innerHTML = `
                    <img src="http://localhost:3001/api/image/${book.content[0].imageUrl}" alt="${book.title}">
                    <div class="text">${book.title} by ${book.author}</div>
                `;
                slideshowContainer.appendChild(slide);
            });

            initSlideshow();  // Reinitialize the slideshow after loading slides
        })
        .catch(error => console.error('Error fetching popular books:', error));
}

function fetchAndDisplayRecommendedBooks() {
    const recommendedBooksSection = document.querySelector('.recommended-books');

    // Initially hide the recommended books section
    recommendedBooksSection.style.display = 'none';

    fetch('http://localhost:3001/auth/status', {
        credentials: 'include'
    })
        .then(response => response.json())
        .then(userData => {
            console.log('User data:', userData);

            // Ensure user and likedBooks/savedBooks are defined
            const likedBooks = userData.user?.likedBooks?.map(id => id.toString()) || [];
            const savedBooks = userData.user?.savedBooks?.map(id => id.toString()) || [];

            console.log('Liked Books (String IDs):', likedBooks);
            console.log('Saved Books (String IDs):', savedBooks);

            if (userData.isLoggedIn) {
                // Show the recommended books section if the user is logged in
                recommendedBooksSection.style.display = 'block';

                fetch('http://localhost:3001/api/published')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => {
                        const container = document.getElementById('recommended-books-container');
                        container.innerHTML = '';  // Clear existing content

                        data.stories.forEach(book => {
                            const bookIdStr = book._id.toString(); // Convert ObjectId to string for comparison
                            console.log('Checking book with ID:', bookIdStr);

                            const bookCard = document.createElement('div');
                            bookCard.className = 'book-card';
                            bookCard.innerHTML = `
                        <div class="book-image-container">
                            <img src="http://localhost:3001/api/image/${book.content[0].imageUrl}" alt="${book.title}">
                            <div class="book-card-info">
                                <h3>${book.title}</h3>
                                <p>By ${book.author}</p>
                            </div>
                        </div>
                        <div class="book-card-actions-container">
                            <div class="book-card-actions">
                                <button class="like-button" data-story-id="${bookIdStr}">
                                    <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                    </svg>
                                </button>
                                <button class="save-button" data-story-id="${bookIdStr}">
                                    <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M7 2v19.79l5-4.5 5 4.5V2z"/>
                                    </svg>
                                </button>
                                <button class="comment-button" data-story-id="${bookIdStr}">
                                    <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M21 6h-18c-1.105 0-2 .895-2 2v8c0 1.105.895 2 2 2h13l4 4v-14c0-1.105-.895-2-2-2zM19 14h-14v-2h14v2zm0-4h-14v-2h14v2z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    `;

                            // Append the book card to the container
                            container.appendChild(bookCard);

                            // Apply the liked state
                            const likeButton = bookCard.querySelector('.like-button');
                            if (likedBooks.includes(bookIdStr)) {
                                console.log(`Book ${bookIdStr} is liked, adding 'liked' class`);
                                likeButton.classList.add('liked');
                            } else {
                                console.log(`Book ${bookIdStr} is not liked, removing 'liked' class`);
                                likeButton.classList.remove('liked');
                            }

                            // Apply the saved state
                            const saveButton = bookCard.querySelector('.save-button');
                            if (savedBooks.includes(bookIdStr)) {
                                console.log(`Book ${bookIdStr} is saved, adding 'saved' class`);
                                saveButton.classList.add('saved');
                            } else {
                                console.log(`Book ${bookIdStr} is not saved, removing 'saved' class`);
                                saveButton.classList.remove('saved');
                            }

                            // Add event listeners to the buttons
                            likeButton.addEventListener('click', () => {
                                toggleLike(likeButton, book._id);
                            });

                            saveButton.addEventListener('click', () => {
                                toggleSave(saveButton, book._id);
                            });

                            const commentButton = bookCard.querySelector('.comment-button');
                            commentButton.addEventListener('click', () => {
                                openFloatingBox(book);
                            });

                            // Make only the image and title clickable for the book details page
                            const bookImageContainer = bookCard.querySelector('.book-image-container');
                            bookImageContainer.addEventListener('click', () => {
                                window.location.href = `bookPublic.html?storyId=${bookIdStr}`;
                            });
                        });
                    })
                    .catch(error => console.error('Error fetching recommended books:', error));
            } else {
                console.error('User not logged in.');
            }
        })
        .catch(error => console.error('Error fetching user status:', error));
}


function openFloatingBox(book) {
    const floatingBoxOverlay = document.createElement('div');
    floatingBoxOverlay.className = 'floating-box-overlay';

    const floatingBox = document.createElement('div');
    floatingBox.className = 'floating-box';
    floatingBox.innerHTML = `
        <img src="http://localhost:3001/api/image/${book.content[0].imageUrl}" alt="${book.title}">
        <div class="comment-section">
            <h3>Comments</h3>
            <div class="comments">
                <!-- Comments will be dynamically injected here -->
            </div>
            <div class="comment-box">
                <textarea placeholder="Add a comment..."></textarea>
                <button class="send-button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px">
                        <path d="M2.01,21L23,12L2.01,3v7l15,2l-15,2V21z"/>
                    </svg>
                </button>
            </div>
        </div>
        <button class="close-button">&times;</button>
    `;
    floatingBoxOverlay.appendChild(floatingBox);
    document.body.appendChild(floatingBoxOverlay);
    document.body.classList.add('modal-open');

    // Fetch and display comments
    fetch(`http://localhost:3001/api/comments/${book._id}`)
        .then(response => response.json())
        .then(data => {
            const commentsContainer = floatingBox.querySelector('.comments');
            data.comments.forEach(comment => {
                const commentBubble = document.createElement('div');
                commentBubble.className = 'comment-bubble';
                commentBubble.innerHTML = `<strong>${comment.username}:</strong> <p>${comment.text}</p>`;
                commentsContainer.appendChild(commentBubble);
            });
        })
        .catch(error => console.error('Error fetching comments:', error));

    // Close button event
    const closeButton = floatingBox.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        document.body.classList.remove('modal-open');
        document.body.removeChild(floatingBoxOverlay);
    });

    // Post comment event
    const postCommentButton = floatingBox.querySelector('.send-button');
    postCommentButton.addEventListener('click', () => {
        fetch('http://localhost:3001/auth/status', {
            credentials: 'include'
        })
            .then(response => response.json())
            .then(userData => {
                if (userData.isLoggedIn) {
                    const commentText = floatingBox.querySelector('.comment-box textarea').value;
                    if (commentText.trim()) {
                        fetch('http://localhost:3001/api/comment', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                storyId: book._id,
                                text: commentText,
                                userId: userData.user.userId  // Include the userId
                            }),
                            credentials: 'include'
                        })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    const commentsContainer = floatingBox.querySelector('.comments');
                                    const newComment = document.createElement('div');
                                    newComment.className = 'comment-bubble';
                                    newComment.innerHTML = `<strong>${data.username}:</strong> <p>${commentText}</p>`;
                                    commentsContainer.appendChild(newComment);
                                    floatingBox.querySelector('.comment-box textarea').value = '';
                                    commentsContainer.scrollTop = commentsContainer.scrollHeight;
                                } else {
                                    console.error('Failed to post comment:', data.message);
                                    showPopupMessage('Failed to post comment.');
                                }
                            })
                            .catch(error => console.error('Error posting comment:', error));
                    }
                } else {
                    console.error('User not logged in.');
                    showPopupMessage('Please log in to post a comment.');
                }
            })
            .catch(error => console.error('Error fetching user status:', error));
    });
}

function toggleLike(button, storyId) {
    fetch('http://localhost:3001/auth/status', {
        credentials: 'include'
    })
        .then(response => response.json())
        .then(data => {
            if (data.isLoggedIn) {
                const userId = data.user.userId;

                fetch('http://localhost:3001/api/toggle-like', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ storyId, userId })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // Toggle the liked class
                            button.classList.toggle('liked', data.liked);

                            // Update the visual feedback
                            if (data.liked) {
                                button.querySelector('svg').style.fill = 'red'; // Change heart to red
                            } else {
                                button.querySelector('svg').style.fill = 'white'; // Change heart back to white
                            }

                            showPopupMessage(data.liked ? 'Story liked' : 'Like removed');
                        } else {
                            console.error('Failed to toggle like:', data.message);
                        }
                    })
                    .catch(error => console.error('Error toggling like:', error));
            } else {
                console.error('User not logged in.');
                showPopupMessage('Please log in to like a story.');
            }
        })
        .catch(error => console.error('Error fetching user status:', error));
}

function toggleSave(button, storyId) {
    fetch('http://localhost:3001/auth/status', {
        credentials: 'include'
    })
        .then(response => response.json())
        .then(data => {
            if (data.isLoggedIn) {
                const userId = data.user.userId;

                fetch('http://localhost:3001/api/toggle-save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ storyId, userId })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // Toggle the saved class
                            button.classList.toggle('saved', data.saved);

                            // Update the visual feedback
                            if (data.saved) {
                                button.querySelector('svg').style.fill = 'white'; // Change save button to white
                            } else {
                                button.querySelector('svg').style.fill = 'grey'; // Change save button back to grey
                            }

                            showPopupMessage(data.saved ? 'Story saved to your repository' : 'Story removed from your repository');
                        } else {
                            console.error('Failed to toggle save:', data.message);
                        }
                    })
                    .catch(error => console.error('Error toggling save:', error));
            } else {
                console.error('User not logged in.');
                showPopupMessage('Please log in to save a story.');
            }
        })
        .catch(error => console.error('Error fetching user status:', error));
}



let slideIndex = 0;
let slideInterval;
function showSlides() {
    const slides = document.querySelectorAll('.slide');

    if (!slides || slides.length === 0) {
        console.error("No slides found. Make sure the slides are correctly loaded.");
        return;  // Exit the function if no slides are found
    }

    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    slideIndex++;
    if (slideIndex > slides.length) { slideIndex = 1 }
    slides[slideIndex - 1].style.display = "block";
}

function initSlideshow() {
    slideIndex = 0;  // Initialize slide index
    showSlides();  // Show the first slide immediately
    setInterval(showSlides, 5000);  // Change slide every 5 seconds
}
// Function to manually change slides
function plusSlides(n) {
    clearInterval(slideInterval); // Stop the automatic slideshow
    slideIndex += n;

    const slides = document.querySelectorAll('.slide');
    if (slideIndex >= slides.length) {
        slideIndex = 0; // Wrap around to the first slide
    }
    if (slideIndex < 0) {
        slideIndex = slides.length - 1; // Wrap around to the last slide
    }

    showSlides(); // Show the current slide
    slideInterval = setInterval(showSlides, 5000); // Restart the automatic slideshow
}
