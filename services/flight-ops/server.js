const express = require('express');
const app = express();
const port = process.env.PORT || 8001;
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

// Create table if not exists and alter to add new columns
pool.query(`
  CREATE TABLE IF NOT EXISTS flights (
    id VARCHAR(10) PRIMARY KEY,
    airline VARCHAR(50),
    origin VARCHAR(3),
    destination VARCHAR(3),
    status VARCHAR(20)
  );
  ALTER TABLE flights ADD COLUMN IF NOT EXISTS aircraft_type VARCHAR(50);
  ALTER TABLE flights ADD COLUMN IF NOT EXISTS departure_time VARCHAR(50);
  ALTER TABLE flights ADD COLUMN IF NOT EXISTS estimated_arrival VARCHAR(50);
`).catch(err => console.error('Error initializing table:', err));

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
  const { id, airline, origin, destination, status, aircraft_type, departure_time, estimated_arrival } = req.body;
  try {
    await pool.query(
      'INSERT INTO flights (id, airline, origin, destination, status, aircraft_type, departure_time, estimated_arrival) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [id, airline, origin, destination, status || 'Scheduled', aircraft_type || 'Unknown', departure_time || 'TBD', estimated_arrival || 'TBD']
    );
    res.json({ message: "Flight added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/flights/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE flights SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: "Flight status updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/flights/search', async (req, res) => {
  const { query } = req.query;
  try {
    const searchParam = `%${query}%`;
    const result = await pool.query(
      'SELECT * FROM flights WHERE id ILIKE $1 OR airline ILIKE $1 OR origin ILIKE $1 OR destination ILIKE $1',
      [searchParam]
    );
    res.json(result.rows);
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
