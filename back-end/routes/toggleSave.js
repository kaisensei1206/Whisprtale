const express = require('express');
const router = express.Router();
const User = require('../models/user'); // Adjust the path as needed
const Story = require('../models/story'); // Adjust the path as needed

// Toggle save status for multiple stories
router.post('/toggle-save', async (req, res) => {
  try {
    const { storyIds, userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    for (const storyId of storyIds) {
      const story = await Story.findById(storyId);
      if (!story) {
        return res.status(404).json({ success: false, message: 'Story not found' });
      }

      const hasSaved = user.savedBooks.includes(storyId);
      if (hasSaved) {
        user.savedBooks.pull(storyId); // Remove the story from saved books
      } else {
        user.savedBooks.push(storyId); // Add the story to saved books
      }
    }

    await user.save();
    res.json({ success: true, message: 'Stories save status updated successfully' });
  } catch (error) {
    console.error('Error toggling save status:', error);
    res.status(500).json({ success: false, message: 'Failed to update save status.' });
  }
});

module.exports = router;
