const express = require('express');
const app = express();
const port = 8001;

app.use(express.json());

const flights_db = [
  { id: "BA293", airline: "British Airways", origin: "LHR", destination: "JFK", status: "In Flight" },
  { id: "UA102", airline: "United Airlines", origin: "SFO", destination: "NRT", status: "Boarding" }
];

app.get('/health', (req, res) => {
  res.json({ status: 'up' });
});

app.get('/flights', (req, res) => {
  res.json(flights_db);
});

app.post('/flights', (req, res) => {
  flights_db.push(req.body);
  res.json({ message: "Flight added successfully" });
});

app.get('/metrics', (req, res) => {
  res.json({ aerosphere_flights_active: flights_db.length });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Flight Ops Service listening on port ${port}`);
});
