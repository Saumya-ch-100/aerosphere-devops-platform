const express = require('express');
const app = express();
const port = 8001;
const { Pool } = require('pg');

app.use(express.json());

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


const pool = new Pool({
  user: process.env.POSTGRES_USER || 'aerosphere_admin',
  password: process.env.POSTGRES_PASSWORD || 'secure_password_from_vault',
  host: process.env.DB_HOST || 'postgres-db.aerosphere-prod.svc.cluster.local',
  port: 5432,
  database: 'postgres'
});

// Create table if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS flights (
    id VARCHAR(10) PRIMARY KEY,
    airline VARCHAR(50),
    origin VARCHAR(3),
    destination VARCHAR(3),
    status VARCHAR(20)
  )
`).catch(err => console.error('Error creating table:', err));

app.get('/health', (req, res) => {
  res.json({ status: 'up' });
});

app.get('/flights', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM flights');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/flights', async (req, res) => {
  const { id, airline, origin, destination, status } = req.body;
  try {
    await pool.query(
      'INSERT INTO flights (id, airline, origin, destination, status) VALUES ($1, $2, $3, $4, $5)',
      [id, airline, origin, destination, status]
    );
    res.json({ message: "Flight added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/flights/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM flights WHERE id = $1', [id]);
    res.json({ message: "Flight deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/admin/purge', async (req, res) => {
  try {
    await pool.query('DELETE FROM flights');
    res.json({ message: "All flights purged successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Flight Ops Service listening on port ${port}`);
});
