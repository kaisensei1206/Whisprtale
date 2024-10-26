document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const keyword = urlParams.get('keyword');

  if (!keyword) {
    document.getElementById('results').innerText = 'No search keyword provided.';
    return;
  }

  fetch(`http://localhost:3001/search/search?keyword=${encodeURIComponent(keyword)}`)
    .then(response => response.json())
    .then(data => {
      const resultsDiv = document.getElementById('results');
      resultsDiv.innerHTML = ''; // Clear previous results

      if (data.found) {
        data.stories.forEach(story => {
          const storyDiv = document.createElement('div');
          storyDiv.classList.add('book');

          const coverImageUrl = story.content[0].imageUrl ? `http://localhost:3001/api/image/${story.content[0].imageUrl}` : 'http://localhost:3001/images/default_cover.jpg';

          storyDiv.innerHTML = `
            <a href="bookPublic.html?storyId=${story._id}" class="book-link">
              <img class="book-cover" src="${coverImageUrl}" alt="${story.title} Cover">
              <div>
                <div class="book-title">${story.title}</div>
                <div class="book-author">Author: ${story.author}</div>
                <div class="book-genre">Genres: ${story.genres.join(', ')}</div>
                <div class="book-description">Summary: ${story.summary}</div>
              </div>
            </a>
          `;

          resultsDiv.appendChild(storyDiv);
        });
      } else {
        const messageDiv = document.createElement('div');
        messageDiv.textContent = data.message;
        resultsDiv.appendChild(messageDiv);

        const recommendationsDiv = document.createElement('div');
        recommendationsDiv.classList.add('recommendations');

        data.recommendations.forEach(story => {
          const storyDiv = document.createElement('div');
          storyDiv.classList.add('book');

          const coverImageUrl = story.content[0].imageUrl ? `http://localhost:3001/api/image/${story.content[0].imageUrl}` : 'http://localhost:3001/images/default_cover.jpg';

          storyDiv.innerHTML = `
            <a href="bookPublic.html?storyId=${story._id}" class="book-link">
              <img class="book-cover" src="${coverImageUrl}" alt="${story.title} Cover">
              <div>
                <div class="book-title">${story.title}</div>
                <div class="book-author">Author: ${story.author}</div>
                <div class="book-genre">Genres: ${story.genres.join(', ')}</div>
                <div class="book-description">Summary: ${story.summary}</div>
              </div>
            </a>
          `;

          recommendationsDiv.appendChild(storyDiv);
        });

        resultsDiv.appendChild(recommendationsDiv);
      }
    })
    .catch(error => {
      console.error('Error fetching search results:', error);
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

  window.onload = function () {
    loadNavigation(); // Load the navigation on page load
  };
});
