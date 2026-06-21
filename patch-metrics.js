const fs = require('fs');
const path = require('path');

const services = ['flight-ops', 'telemetry', 'maintenance', 'weather-intel', 'baggage-ops', 'passenger-ops'];

const patchContent = `
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
`;

services.forEach(svc => {
  const filePath = path.join(__dirname, 'services', svc, 'server.js');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove existing /metrics if any
  content = content.replace(/app\.get\('\/metrics'[\s\S]*?\}\);/g, '');
  
  // Inject prom-client after app.use(express.json()); or app = express();
  if (content.includes('app.use(express.json());')) {
    content = content.replace('app.use(express.json());', 'app.use(express.json());\n' + patchContent);
  } else {
    content = content.replace('const app = express();', 'const app = express();\n' + patchContent);
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`Patched ${svc}`);
});
