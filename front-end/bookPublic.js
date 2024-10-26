document.addEventListener('DOMContentLoaded', async () => {
  const bookTitle = document.getElementById("book-title");
  const bookCover = document.getElementById("book-cover");
  const bookAuthor = document.getElementById("book-author");
  const bookSummary = document.getElementById("book-summary");  // Reference to the summary element
  const bookGenre = document.getElementById("book-genre");      // Reference to the genre element
  const viewBtn = document.getElementById("view-btn");
  const urlParams = new URLSearchParams(window.location.search);
  const storyId = urlParams.get('storyId');

  let story;

  // Fetch book details and populate the page
  async function fetchBookDetails() {
    try {
      const response = await fetch(`http://localhost:3001/collection/book/${storyId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.redirected) {
        window.location.href = response.url;
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        if (data.success) {
          story = data.story;
          bookTitle.textContent = story.title;
          bookCover.src = `http://localhost:3001/api/image/${story.content[0].imageUrl}`;
          bookAuthor.textContent = `Author: ${story.author}`;
          bookSummary.textContent = story.summary || "No summary available.";  // Display summary
          bookGenre.textContent = `Genre: ${story.genres.join(', ')}`;          // Display genres

          viewBtn.addEventListener('click', () => {
            window.location.href = `/viewBook.html?storyId=${story._id}`;
          });

          // Attach event listeners AFTER fetching the story and rendering the buttons
          attachButtonListeners(story._id);
        }
      } else {
        console.error("Unexpected response content type:", contentType);
      }
    } catch (error) {
      console.error('Error fetching book details:', error);
    }
  }

  // Function to attach event listeners to like, save, and comment buttons
  function attachButtonListeners(storyId) {
    const likeButton = document.querySelector('.like-button');
    const saveButton = document.querySelector('.save-button');
    const commentButton = document.querySelector('.comment-button');

    if (likeButton && saveButton && commentButton) {
      likeButton.addEventListener('click', () => toggleLike(likeButton, storyId));
      saveButton.addEventListener('click', () => toggleSave(saveButton, storyId));
      commentButton.addEventListener('click', () => openCommentBox(storyId));
    } else {
      console.error("Buttons not found in the DOM!");
    }
  }

  // Functions for toggling like, save, and opening the comment box
  function toggleLike(button, storyId) {
    fetch('/api/toggle-like', {
      method: 'POST',
      body: JSON.stringify({ storyId }),
      headers: { 'Content-Type': 'application/json' }
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          button.classList.toggle('liked', data.liked);
          // Animation
          button.querySelector('svg').style.fill = data.liked ? 'red' : 'white';
        }
      });
  }

  function toggleSave(button, storyId) {
    fetch('/toggle/toggle-save', {
      method: 'POST',
      body: JSON.stringify({ storyId }),
      headers: { 'Content-Type': 'application/json' }
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          button.classList.toggle('saved', data.saved);
          // Animation
          button.querySelector('svg').style.fill = data.saved ? 'white' : 'grey';
        }
      });
  }

  function openCommentBox(_storyId) {
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

  // Fetch book details when the DOM is loaded
  await fetchBookDetails();
});