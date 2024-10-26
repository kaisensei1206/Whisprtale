const express = require('express');
const router = express.Router();
const Story = require('../models/story');  // Adjust the path to your model

// Route to fetch 10 random published stories
router.get('/published', async (req, res) => {
  try {
    const publishedStories = await Story.aggregate([
      { $match: { isPublished: true } },  // Match only published stories
      { $sample: { size: 10 } }  // Randomly select 10 stories
    ]);
    res.json({ success: true, stories: publishedStories });
  } catch (error) {
    console.error('Error fetching published stories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch published stories.' });
  }
});

module.exports = router;