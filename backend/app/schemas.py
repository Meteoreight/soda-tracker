from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List

class CylinderBase(BaseModel):
    number: int
    cost: float = 0.0

class CylinderCreate(CylinderBase):
    pass

class CylinderUpdate(BaseModel):
    cost: Optional[float] = None
    is_active: Optional[bool] = None

class Cylinder(CylinderBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class ConsumptionLogBase(BaseModel):
    date: date
    bottle_size: str  # "1L" or "0.5L"
    bottle_count: int
    cylinder_id: int

class ConsumptionLogCreate(ConsumptionLogBase):
    pass

class ConsumptionLogUpdate(BaseModel):
    date: Optional[date] = None
    bottle_size: Optional[str] = None
    bottle_count: Optional[int] = None
    cylinder_id: Optional[int] = None

class ConsumptionLog(ConsumptionLogBase):
    id: int
    volume_ml: float
    co2_pushes: int
    created_at: datetime
    cylinder: Cylinder
    
    class Config:
        from_attributes = True

class SettingsBase(BaseModel):
    key: str
    value: str

class SettingsCreate(SettingsBase):
    pass

class SettingsUpdate(BaseModel):
    value: str

class Settings(SettingsBase):
    id: int
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AnalyticsResponse(BaseModel):
    total_consumption_ml: float
    average_daily_consumption_ml: float
    total_cost: float
    cost_per_liter: float
    period_days: int
    consumption_data: List[dict]

class DashboardSummary(BaseModel):
    today_consumption_ml: float
    this_month_cost: float
    savings_vs_retail: float
    active_cylinder: Optional[Cylinder]
    recent_consumption_data: List[dict]