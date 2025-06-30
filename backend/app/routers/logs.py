from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from typing import List
from datetime import datetime

router = APIRouter()

def calculate_volume_and_pushes(bottle_size: str, bottle_count: int):
    """Calculate volume in mL and CO2 pushes based on bottle size and count"""
    if bottle_size == "1L":
        volume_per_bottle = 840  # mL
        pushes_per_bottle = 4
    elif bottle_size == "0.5L":
        volume_per_bottle = 455  # mL
        pushes_per_bottle = 2
    else:
        raise ValueError("Invalid bottle size")
    
    total_volume = volume_per_bottle * bottle_count
    total_pushes = pushes_per_bottle * bottle_count
    
    return total_volume, total_pushes

@router.get("/", response_model=List[schemas.ConsumptionLog])
def get_consumption_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logs = db.query(models.ConsumptionLog).offset(skip).limit(limit).all()
    return logs

@router.post("/", response_model=schemas.ConsumptionLog)
def create_consumption_log(log: schemas.ConsumptionLogCreate, db: Session = Depends(get_db)):
    # Calculate volume
    volume_ml, default_co2_pushes = calculate_volume_and_pushes(log.bottle_size, log.bottle_count)
    
    # Use manual CO2 pushes if provided, otherwise use calculated default
    co2_pushes = log.co2_pushes if log.co2_pushes is not None else default_co2_pushes
    
    # Verify cylinder exists
    cylinder = db.query(models.Cylinder).filter(models.Cylinder.id == log.cylinder_id).first()
    if not cylinder:
        raise HTTPException(status_code=404, detail="Cylinder not found")
    
    db_log = models.ConsumptionLog(
        date=log.date,
        bottle_size=log.bottle_size,
        bottle_count=log.bottle_count,
        volume_ml=volume_ml,
        co2_pushes=co2_pushes,
        cylinder_id=log.cylinder_id
    )
    
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/{log_id}", response_model=schemas.ConsumptionLog)
def get_consumption_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(models.ConsumptionLog).filter(models.ConsumptionLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log

@router.put("/{log_id}", response_model=schemas.ConsumptionLog)
def update_consumption_log(log_id: int, log_update: schemas.ConsumptionLogUpdate, db: Session = Depends(get_db)):
    db_log = db.query(models.ConsumptionLog).filter(models.ConsumptionLog.id == log_id).first()
    if not db_log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    update_data = log_update.dict(exclude_unset=True)
    
    # Recalculate volume if bottle data changed
    if "bottle_size" in update_data or "bottle_count" in update_data:
        bottle_size = update_data.get("bottle_size", db_log.bottle_size)
        bottle_count = update_data.get("bottle_count", db_log.bottle_count)
        volume_ml, default_co2_pushes = calculate_volume_and_pushes(bottle_size, bottle_count)
        update_data["volume_ml"] = volume_ml
        
        # Only update CO2 pushes if not manually specified in the update
        if "co2_pushes" not in update_data:
            update_data["co2_pushes"] = default_co2_pushes
    
    for field, value in update_data.items():
        setattr(db_log, field, value)
    
    db.commit()
    db.refresh(db_log)
    return db_log

@router.delete("/{log_id}")
def delete_consumption_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(models.ConsumptionLog).filter(models.ConsumptionLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    db.delete(log)
    db.commit()
    return {"message": "Log deleted successfully"}