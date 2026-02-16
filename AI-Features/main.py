from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.triage_service import triage_logic, Req as TriageReq
from services.forecast_service import forecast_logic, ForecastInput

app = FastAPI()

# CORS (allow frontend access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # or "*" for any origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Triage endpoint
@app.post("/triage")
def triage(req: TriageReq):
    return triage_logic(req.title, req.description)

# Forecast endpoint
@app.post("/forecast")
def forecast(data: ForecastInput):
    return forecast_logic(data)