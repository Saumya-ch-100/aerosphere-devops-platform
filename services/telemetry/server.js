const express = require('express');
const app = express();

const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode
    });
  });
  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

const port = 8002;

app.get('/health', (req, res) => {
  res.json({ status: 'up' });
});



app.post('/admin/shutoff', (req, res) => {
  res.json({ message: "Shutting down telemetry service gracefully..." });
  console.log("Graceful shutoff initiated via Admin API");
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Telemetry Service listening on port ${port}`);
});
