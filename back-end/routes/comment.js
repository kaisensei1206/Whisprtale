const express = require('express');
const router = express.Router();
const Story = require('../models/story');
const User = require('../models/user');

router.post('/comment', async (req, res) => {
  try {
    const { storyId, text, userId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found.' });
    }

    const comment = {
      username: user.account,
      text: text,
      date: new Date()
    };

    story.comments.push(comment);
    await story.save();

    res.json({ success: true, username: user.account });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

router.get('/comments/:storyId', async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found.' });
    }

    res.json({ success: true, comments: story.comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
