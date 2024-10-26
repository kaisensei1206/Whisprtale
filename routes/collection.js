const express = require('express');
const router = express.Router();
const Story = require('../models/story');
const Image = require('../models/image');
const ensureAuthenticated = require('../routes/ensureAuthenticated');

// Get the collection of books for the logged-in user
router.get('/my-collection', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;
    const stories = await Story.find({ userId: userId });
    res.json({ success: true, stories });
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch collection.' });
  }
});
// Get specific book details by ID for the book.html page
router.get('/book/:id', ensureAuthenticated, async (req, res) => {
  try {
    const storyId = req.params.id;
    const story = await Story.findById(storyId);

    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    res.json({ success: true, story });
  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).json({ success: false, message: 'Error fetching story.' });
  }
});

router.post('/update-publish/:id', async (req, res) => {
  try {
    let storyId = req.params.id.trim();  // Trim any whitespace or newline characters
    const { isPublished } = req.body;

    // Find the story by ID
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    // Update the publish state
    story.isPublished = isPublished;
    await story.save();

    // Respond with success
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating publish state:', error);
    res.status(500).json({ success: false, message: 'Failed to update publish state.' });
  }
});

module.exports = router;
