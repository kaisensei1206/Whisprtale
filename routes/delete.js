const express = require('express');
const router = express.Router();
const Story = require('../models/story');
const Image = require('../models/image');
const ensureAuthenticated = require('../routes/ensureAuthenticated');

// Delete books and associated images
router.post('/delete-books', ensureAuthenticated, async (req, res) => {
  try {
    const { storyIds } = req.body;

    if (!storyIds || !Array.isArray(storyIds) || storyIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid story IDs provided.' });
    }

    // Delete associated images
    const stories = await Story.find({ _id: { $in: storyIds } });
    if (stories.length === 0) {
      return res.status(404).json({ success: false, message: 'No stories found for the provided IDs.' });
    }

    for (const story of stories) {
      for (const content of story.content) {
        await Image.findByIdAndDelete(content.imageUrl);
      }
    }

    // Delete the stories
    await Story.deleteMany({ _id: { $in: storyIds } });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting books:', error);
    res.status(500).json({ success: false, message: 'Failed to delete books.' });
  }
});

// You can add more delete routes here as needed

module.exports = router;
