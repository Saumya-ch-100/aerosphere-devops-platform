const express = require('express');
const app = express();
const port = 8005;

app.get('/health', (req, res) => {
  res.json({ status: 'up' });
});

app.get('/metrics', (req, res) => {
  res.json({ "baggage_ops_active": 1 });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`baggage-ops listening on port ${port}`);
});
