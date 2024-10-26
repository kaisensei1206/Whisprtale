const express = require('express');
const router = express.Router();

// Define your routes related to story creation here

router.get('/', (req, res) => {
  res.send('Create Story Page');
});

// Export the router
module.exports = router;
