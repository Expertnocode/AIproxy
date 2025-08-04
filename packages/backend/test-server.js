const express = require('express');
const app = express();
const port = 3001;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', message: 'Test server running' });
});

app.get('/api/v1/test', (req, res) => {
  res.json({ success: true, message: 'API working' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Test server running on port ${port}`);
});