const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Story = require('../models/story');
const User = require('../models/user');

// Route to like or unlike a story
router.post('/toggle-like', async (req, res) => {
  try {
    const { storyId, userId } = req.body;

    console.log('Received storyId:', storyId);
    console.log('Received userId:', userId);

    const story = await Story.findById(storyId);
    const user = await User.findById(userId);

    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Convert userId to ObjectId if it's not already one
    const userObjectId = new mongoose.Types.ObjectId(userId); // Use 'new' keyword here

    // Ensure the `likes` array is initialized
    if (!story.likes) {
      story.likes = [];
    }

    const userHasLiked = story.likes.includes(userObjectId);

    if (userHasLiked) {
      // User has already liked this story, so unlike it
      story.likes.pull(userObjectId);
      story.likeCount = Math.max(0, story.likeCount - 1);  // Ensure likeCount doesn't go negative
      user.likedBooks.pull(storyId); // Remove the story from the user's likedBooks
    } else {
      // User has not liked this story yet, so like it
      story.likes.push(userObjectId);
      story.likeCount = (story.likeCount || 0) + 1;  // Increment likeCount
      user.likedBooks.push(storyId); // Add the story to the user's likedBooks
    }

    await story.save();
    await user.save();

    res.json({ success: true, likeCount: story.likeCount, liked: !userHasLiked });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle like.' });
  }
});

module.exports = router;
