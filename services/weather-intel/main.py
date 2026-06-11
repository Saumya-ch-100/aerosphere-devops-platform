from fastapi import FastAPI
app = FastAPI(title="Weather Intel Service")

@app.get("/health")
def health_check():
    return {"status": "up"}

@app.get("/metrics")
def metrics():
    return {"weather_intel_active": 1}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
