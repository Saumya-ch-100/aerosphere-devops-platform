from fastapi import FastAPI
app = FastAPI(title="Maintenance Service")

@app.get("/health")
def health_check():
    return {"status": "up"}

@app.get("/metrics")
def metrics():
    return {"maintenance_active": 1}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
