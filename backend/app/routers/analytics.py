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
    
    # Calculate average based on actual data days, not selected period days
    unique_dates = set(log.date for log in logs)
    actual_data_days = len(unique_dates)
    average_daily_consumption_ml = total_consumption_ml / actual_data_days if actual_data_days > 0 else 0
    
    # Get initial cost from settings
    initial_cost_setting = db.query(models.Settings).filter(models.Settings.key == "initial_cost").first()
    initial_cost = float(initial_cost_setting.value) if initial_cost_setting else 0.0
    
    # Calculate total cost (initial cost + CO2 cost)
    co2_cost = 0.0
    for log in logs:
        cylinder_cost = log.cylinder.cost if log.cylinder else 0
        # Cost per push = cylinder_cost / estimated_total_pushes_per_cylinder (assuming 500 pushes per cylinder)
        cost_per_push = cylinder_cost / 500 if cylinder_cost > 0 else 0
        co2_cost += log.co2_pushes * cost_per_push
    
    total_cost = initial_cost + co2_cost
    
    cost_per_liter = (total_cost / (total_consumption_ml / 1000)) if total_consumption_ml > 0 else 0
    
    # Prepare consumption data for charts (grouped by date)
    daily_data = {}
    cumulative_volume = 0
    cumulative_co2_cost = 0
    
    # Sort logs by date to calculate cumulative data correctly
    sorted_logs = sorted(logs, key=lambda x: x.date)
    
    for log in sorted_logs:
        date_str = log.date.isoformat()
        
        # Calculate CO2 cost for this log
        cylinder_cost = log.cylinder.cost if log.cylinder else 0
        cost_per_push = cylinder_cost / 500 if cylinder_cost > 0 else 0
        log_co2_cost = log.co2_pushes * cost_per_push
        
        # Update cumulative values
        cumulative_volume += log.volume_ml
        cumulative_co2_cost += log_co2_cost
        
        # Calculate total cost (initial cost + cumulative CO2 cost)
        total_cost = initial_cost + cumulative_co2_cost
        
        # Group by date
        if date_str not in daily_data:
            daily_data[date_str] = {
                "date": date_str,
                "volume_ml": 0,
                "co2_cost": 0,
                "retail_cost": 0,
                "cumulative_volume_ml": cumulative_volume,
                "total_cost": total_cost
            }
        
        daily_data[date_str]["volume_ml"] += log.volume_ml
        daily_data[date_str]["co2_cost"] += log_co2_cost
        daily_data[date_str]["retail_cost"] += (log.volume_ml * 45) / 500  # JPY 45 per 500mL
        daily_data[date_str]["cumulative_volume_ml"] = cumulative_volume
        daily_data[date_str]["total_cost"] = total_cost
    
    consumption_data = list(daily_data.values())
    
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
    
    # Get initial cost from settings
    initial_cost_setting = db.query(models.Settings).filter(models.Settings.key == "initial_cost").first()
    initial_cost = float(initial_cost_setting.value) if initial_cost_setting else 0.0
    
    this_month_co2_cost = 0.0
    this_month_consumption_ml = 0.0
    for log in month_logs:
        this_month_consumption_ml += log.volume_ml
        cylinder_cost = log.cylinder.cost if log.cylinder else 0
        cost_per_push = cylinder_cost / 500 if cylinder_cost > 0 else 0
        this_month_co2_cost += log.co2_pushes * cost_per_push
    
    # For monthly cost, we include the full initial cost
    # This represents the total cost investment for the month's consumption
    this_month_cost = initial_cost + this_month_co2_cost
    
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
    
    # Group by date and sum volumes to handle multiple records per day
    daily_consumption = {}
    for log in recent_logs:
        date_str = log.date.isoformat()
        if date_str not in daily_consumption:
            daily_consumption[date_str] = 0
        daily_consumption[date_str] += log.volume_ml
    
    # Convert to list format for frontend
    recent_consumption_data = []
    for date_str, volume_ml in daily_consumption.items():
        recent_consumption_data.append({
            "date": date_str,
            "volume_ml": volume_ml
        })
    
    # Sort by date
    recent_consumption_data.sort(key=lambda x: x["date"])
    
    return schemas.DashboardSummary(
        today_consumption_ml=today_consumption_ml,
        this_month_cost=this_month_cost,
        savings_vs_retail=savings_vs_retail,
        active_cylinder=active_cylinder,
        recent_consumption_data=recent_consumption_data
    )