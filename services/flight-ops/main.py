from fastapi import FastAPI, HTTPException
from typing import List
import os
from pydantic import BaseModel
from datetime import datetime

app = FastAPI(title="Flight Ops Service", version="1.0.0")

class Flight(BaseModel):
    id: str
    airline: str
    origin: str
    destination: str
    status: str

flights_db = [
    Flight(id="BA293", airline="British Airways", origin="LHR", destination="JFK", status="In Flight"),
    Flight(id="UA102", airline="United Airlines", origin="SFO", destination="NRT", status="Boarding")
]

@app.get("/health")
def health_check():
    return {"status": "up"}

@app.get("/flights", response_model=List[Flight])
def get_flights():
    return flights_db

@app.post("/flights")
def add_flight(flight: Flight):
    flights_db.append(flight)
    return {"message": "Flight added successfully"}

@app.get("/metrics")
def metrics():
    # Simple Prometheus metrics placeholder
    return {"aerosphere_flights_active": len(flights_db)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
