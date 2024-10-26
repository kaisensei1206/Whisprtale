
function validateForm() {
  const bookName = document.getElementById('book-name').value.trim();
  const audioFile = document.getElementById('audio-file').files[0];
  const storyText = document.getElementById('story-text').value.trim();
  const confirmButton = document.getElementById('confirm-btn');
  const fileNameDisplay = document.getElementById('file-name-display');

  confirmButton.disabled = !(bookName && (audioFile || storyText));

  if (audioFile) {
    fileNameDisplay.textContent = `Uploaded file: ${audioFile.name}`;
    fileNameDisplay.style.color = '#a063f9'; // Set the text color to purple
  } else {
    fileNameDisplay.textContent = '';
  }
}
document.getElementById('audio-file').addEventListener('change', function () {
  const fileName = this.files[0]?.name || ''; // Get the file name or an empty string if no file is selected
  document.getElementById('file-name-display').textContent = fileName; // Display the file name
  validateForm(); // Re-validate the form
});

function validateForm() {
  const bookName = document.getElementById('book-name').value.trim();
  const storyText = document.getElementById('story-text').value.trim();
  const audioFile = document.getElementById('audio-file').files.length > 0;

  // Enable the confirm button if book name is provided and either story text or audio file is present
  const isValid = bookName && (storyText || audioFile);
  document.getElementById('confirm-btn').disabled = !isValid;
}
async function confirmStory() {
  const audioFile = document.getElementById('audio-file').files[0];
  const storyText = document.getElementById('story-text').value.trim();
  const title = document.getElementById('book-name').value.trim();

  const pleaseWaitMessage = document.getElementById('please-wait-message');
  const generatingMessage = document.getElementById('generating-story-message');
  const errorMessage = document.getElementById('error-message');
  const loadingContainer = document.getElementById('loading-container');
  const progressPercentage = document.getElementById('progress-percentage');

  // Show the "Please wait..." message
  pleaseWaitMessage.style.display = 'none';
  generatingMessage.style.display = 'block';
  errorMessage.style.display = 'none';
  loadingContainer.style.display = 'flex';

  let progress = 0;
  const updateProgress = () => {
    if (progress < 100) {
      progress += 10; // Increase progress by 10%
      progressPercentage.textContent = `${progress}%`;
    }
  };

  // Simulate progress update every second
  const intervalId = setInterval(updateProgress, 500);

  try {
    // Create the form data to be sent
    const formData = new FormData();
    formData.append('title', title);
    if (audioFile) {
      formData.append('audio', audioFile);
    } else if (storyText) {
      formData.append('storyText', storyText);
    }

    const response = await fetch('http://localhost:3001/api/process-story', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    clearInterval(intervalId); // Stop the progress update

    if (response.ok) {
      const result = await response.json();

      // Complete the progress to 100% before redirecting
      progress = 100;
      progressPercentage.textContent = `${progress}%`;

      // Redirect directly to edit.html with the storyId
      window.location.href = `edit.html?storyId=${result.storyId}`;
    } else {
      throw new Error('Failed to process the story.');
    }
  } catch (error) {
    console.error('Error:', error);

    // Hide the "Please wait..." message and show the "Error generating story" message
    pleaseWaitMessage.style.display = 'none';
    generatingMessage.style.display = 'none';
    errorMessage.style.display = 'block';
    loadingContainer.style.display = 'none';
  }
}


