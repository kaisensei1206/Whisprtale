function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('http://localhost:3001/auth/login'); // Redirect to login page if not authenticated
  }
}

module.exports = ensureAuthenticated;
