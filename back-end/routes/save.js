const express = require('express');
const router = express.Router();
const User = require('../models/user');  // Adjust path as necessary
const Story = require('../models/story');

// Toggle save status of a story for a user
router.post('/toggle-save', async (req, res) => {
  try {
    const { storyId, userId } = req.body;

    console.log('Received storyId in backend:', storyId);  // Debug: Log the story ID
    console.log('Received userId in backend:', userId);  // Debug: Log the user ID

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    const hasSaved = user.savedBooks.includes(storyId);

    if (hasSaved) {
      user.savedBooks.pull(storyId);
      story.saved.pull(userId);
    } else {
      user.savedBooks.push(storyId);
      story.saved.push(userId);
    }

    await user.save();
    await story.save();

    res.json({ success: true, saved: !hasSaved });
  } catch (error) {
    console.error('Error toggling save:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle save.' });
  }
});


// Route to fetch saved stories
router.get('/saved-stories', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('savedBooks');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, stories: user.savedBooks });
  } catch (error) {
    console.error('Error fetching saved stories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch saved stories.' });
  }
});


module.exports = router;
