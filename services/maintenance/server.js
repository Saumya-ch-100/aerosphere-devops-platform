const express = require('express');
const app = express();
const port = 8003;

app.get('/health', (req, res) => {
  res.json({ status: 'up' });
});

app.get('/metrics', (req, res) => {
  res.json({ "maintenance_active": 1 });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Maintenance Service listening on port ${port}`);
});
