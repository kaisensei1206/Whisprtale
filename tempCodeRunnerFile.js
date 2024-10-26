app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'front-end', 'registration.html'));
});

// Add more routes for other pages as needed
app.get('/userbrowser', (req, res) => {
  res.sendFile(path.join(__dirname, 'front-end', 'userbrowser.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
