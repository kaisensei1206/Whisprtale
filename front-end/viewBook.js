let currentSlideIndex = 0;

async function loadStoryBook(storyId) {
  const response = await fetch(`http://localhost:3001/api/story/${storyId}`, {
    method: 'GET',
    credentials: 'include'
  });

  if (response.ok) {
    const data = await response.json();
    const story = data.story;

    if (!story || !Array.isArray(story.content)) {
      console.error('Invalid story data:', story);
      alert('Failed to load the story. Please try again later.');
      return;
    }

    const titleElement = document.getElementById('story-title');
    titleElement.innerText = story.title;

    const storyContainer = document.getElementById('story-container');
    if (!storyContainer) {
      console.error('Story container not found.');
      return;
    }

    storyContainer.innerHTML = ''; // Clear previous content

    story.content.forEach((item, index) => {
      const slide = document.createElement('div');
      slide.classList.add('slide');

      const img = document.createElement('img');
      img.src = `http://localhost:3001/api/image/${item.imageUrl}`;
      img.alt = `Slide ${index + 1}`;

      const caption = document.createElement('div');
      caption.classList.add('caption-container');
      caption.textContent = item.sentence;

      slide.appendChild(img);
      slide.appendChild(caption);
      storyContainer.appendChild(slide);
    });

    // Display the first slide initially
    if (storyContainer.children.length > 0) {
      storyContainer.children[0].style.display = 'block';
    }
  } else if (response.status === 401) {
    alert('Unauthorized: Please log in to access this resource.');
    window.location.href = '/login';
  } else {
    console.error('Failed to load story:', response.statusText);
  }
}

function changeSlide(direction) {
  const slides = document.getElementsByClassName('slide');

  if (slides.length === 0) {
    console.error('No slides found.');
    return;
  }

  slides[currentSlideIndex].style.display = 'none';
  currentSlideIndex = Math.min(Math.max(currentSlideIndex + direction, 0), slides.length - 1);
  slides[currentSlideIndex].style.display = 'block';
}

function toggleFullScreenMode() {
  const slideshowContainer = document.querySelector('.slideshow-container');

  if (!document.fullscreenElement) {
    if (slideshowContainer.requestFullscreen) {
      slideshowContainer.requestFullscreen();
    } else if (slideshowContainer.mozRequestFullScreen) {
      slideshowContainer.mozRequestFullScreen();
    } else if (slideshowContainer.webkitRequestFullscreen) {
      slideshowContainer.webkitRequestFullscreen();
    } else if (slideshowContainer.msRequestFullscreen) {
      slideshowContainer.msRequestFullscreen();
    }
    slideshowContainer.classList.add('fullscreen-mode');
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    slideshowContainer.classList.remove('fullscreen-mode');
  }
}


window.onload = function () {
  const storyId = new URLSearchParams(window.location.search).get('storyId');
  if (storyId) {
    loadStoryBook(storyId); // Load the story content
  } else {
    console.error('Story ID not found in the URL.');
  }
};



