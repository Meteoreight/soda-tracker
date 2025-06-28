from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, schemas
from datetime import datetime, date, timedelta
from typing import Optional

router = APIRouter()

@router.get("/", response_model=schemas.AnalyticsResponse)
def get_analytics(
    period: str = Query("30d", regex="^(30d|90d|180d|365d)$"),
    db: Session = Depends(get_db)
):
    # Calculate date range based on period
    period_days = int(period.replace('d', ''))
    end_date = date.today()
    start_date = end_date - timedelta(days=period_days)
    
    # Get consumption logs within the period
    logs = db.query(models.ConsumptionLog).filter(
        models.ConsumptionLog.date >= start_date,
        models.ConsumptionLog.date <= end_date
    ).all()
    
    # Calculate totals
    total_consumption_ml = sum(log.volume_ml for log in logs)
    average_daily_consumption_ml = total_consumption_ml / period_days if period_days > 0 else 0
    
    # Calculate total cost
    total_cost = 0.0
    for log in logs:
        cylinder_cost = log.cylinder.cost if log.cylinder else 0
        # Cost per push = cylinder_cost / estimated_total_pushes_per_cylinder (assuming 500 pushes per cylinder)
        cost_per_push = cylinder_cost / 500 if cylinder_cost > 0 else 0
        total_cost += log.co2_pushes * cost_per_push
    
    cost_per_liter = (total_cost / (total_consumption_ml / 1000)) if total_consumption_ml > 0 else 0
    
    # Prepare consumption data for charts
    consumption_data = []
    for log in logs:
        consumption_data.append({
            "date": log.date.isoformat(),
            "volume_ml": log.volume_ml,
            "bottle_size": log.bottle_size,
            "bottle_count": log.bottle_count
        })
    
    return schemas.AnalyticsResponse(
        total_consumption_ml=total_consumption_ml,
        average_daily_consumption_ml=average_daily_consumption_ml,
        total_cost=total_cost,
        cost_per_liter=cost_per_liter,
        period_days=period_days,
        consumption_data=consumption_data
    )

@router.get("/dashboard", response_model=schemas.DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    today = date.today()
    
    # Today's consumption
    today_logs = db.query(models.ConsumptionLog).filter(
        models.ConsumptionLog.date == today
    ).all()
    today_consumption_ml = sum(log.volume_ml for log in today_logs)
    
    # This month's cost
    month_start = today.replace(day=1)
    month_logs = db.query(models.ConsumptionLog).filter(
        models.ConsumptionLog.date >= month_start,
        models.ConsumptionLog.date <= today
    ).all()
    
    this_month_cost = 0.0
    this_month_consumption_ml = 0.0
    for log in month_logs:
        this_month_consumption_ml += log.volume_ml
        cylinder_cost = log.cylinder.cost if log.cylinder else 0
        cost_per_push = cylinder_cost / 500 if cylinder_cost > 0 else 0
        this_month_cost += log.co2_pushes * cost_per_push
    
    # Calculate savings vs retail (JPY 45 per 500ml)
    retail_cost_per_ml = 45 / 500  # JPY per mL
    retail_cost_this_month = this_month_consumption_ml * retail_cost_per_ml
    savings_vs_retail = retail_cost_this_month - this_month_cost
    
    # Active cylinder
    active_cylinder = db.query(models.Cylinder).filter(
        models.Cylinder.is_active == True
    ).first()
    
    # Recent consumption data (last 30 days)
    thirty_days_ago = today - timedelta(days=30)
    recent_logs = db.query(models.ConsumptionLog).filter(
        models.ConsumptionLog.date >= thirty_days_ago,
        models.ConsumptionLog.date <= today
    ).all()
    
    recent_consumption_data = []
    for log in recent_logs:
        recent_consumption_data.append({
            "date": log.date.isoformat(),
            "volume_ml": log.volume_ml
        })
    
    return schemas.DashboardSummary(
        today_consumption_ml=today_consumption_ml,
        this_month_cost=this_month_cost,
        savings_vs_retail=savings_vs_retail,
        active_cylinder=active_cylinder,
        recent_consumption_data=recent_consumption_data
    )