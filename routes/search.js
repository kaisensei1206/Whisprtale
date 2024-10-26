const express = require('express');
const router = express.Router();
const Story = require('../models/story');  // Import the Story model

router.get('/search', async (req, res) => {
  const { keyword } = req.query;

  if (!keyword) {
    return res.status(400).json({ error: 'Keyword is required' });
  }

  try {
    // Find stories that match the keyword in their title and include the coverImage
    const stories = await Story.find({ title: new RegExp(keyword, 'i') });

    if (stories.length > 0) {
      return res.json({ found: true, stories });
    } else {
      // If no stories found, return some random recommendations
      const recommendations = await Story.aggregate([{ $sample: { size: 3 } }]);
      return res.json({ found: false, message: 'Book not found', recommendations });
    }
  } catch (error) {
    console.error('Error searching for stories:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
