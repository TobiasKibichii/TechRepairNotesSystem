from typing import List
from pydantic import BaseModel
import numpy as np

class UsageRequest(BaseModel):
    part_name: str
    weekly_usage: list[int]
    
class ForecastInput(BaseModel):
    parts: List[UsageRequest]

def forecast_logic(data: ForecastInput):
    results = []
    for part in data.parts:
        # Simple moving average of last 4 weeks
        recent = part.weekly_usage[-4:]
        forecast = np.mean(recent)
        results.append({
            "part_name": part.part_name,
            "forecast_next_week": round(float(forecast), 2)
        })
    return {"forecasts": results}