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

const port = process.env.PORT || 8002;

let isSimulatingOutage = false;

app.get('/health', (req, res) => {
  if (isSimulatingOutage) {
    // Return 503 so Kubernetes liveness probe fails
    return res.status(503).json({ status: 'down', reason: 'simulated_outage' });
  }
  res.json({ status: 'up' });
});

app.post('/admin/shutoff', (req, res) => {
  isSimulatingOutage = true;
  console.log("Simulated outage initiated via Admin API. Health checks will now fail.");
  res.json({ message: "Outage simulated. Pod will eventually be killed by K8s Liveness Probe." });
});

app.post('/admin/turnon', (req, res) => {
  isSimulatingOutage = false;
  console.log("Service recovered via Admin API.");
  res.json({ message: "Service recovered successfully." });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Telemetry Service listening on port ${port}`);
});
