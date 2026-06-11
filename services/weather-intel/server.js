const express = require('express');
const app = express();
const port = 8004;

app.get('/health', (req, res) => {
  res.json({ status: 'up' });
});

app.get('/metrics', (req, res) => {
  res.json({ "weather_intel_active": 1 });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Weather Intel Service listening on port ${port}`);
});
