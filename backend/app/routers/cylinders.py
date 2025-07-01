from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, schemas
from typing import List

router = APIRouter()

@router.get("/", response_model=List[schemas.Cylinder])
def get_cylinders(db: Session = Depends(get_db)):
    cylinders = db.query(models.Cylinder).order_by(models.Cylinder.number).all()
    return cylinders

@router.post("/", response_model=schemas.Cylinder)
def create_cylinder(cylinder: schemas.CylinderCreate, db: Session = Depends(get_db)):
    # Check if cylinder number already exists
    existing = db.query(models.Cylinder).filter(models.Cylinder.number == cylinder.number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Cylinder number already exists")
    
    db_cylinder = models.Cylinder(**cylinder.dict())
    db.add(db_cylinder)
    db.commit()
    db.refresh(db_cylinder)
    return db_cylinder

@router.get("/{cylinder_id}", response_model=schemas.Cylinder)
def get_cylinder(cylinder_id: int, db: Session = Depends(get_db)):
    cylinder = db.query(models.Cylinder).filter(models.Cylinder.id == cylinder_id).first()
    if not cylinder:
        raise HTTPException(status_code=404, detail="Cylinder not found")
    return cylinder

@router.put("/{cylinder_id}", response_model=schemas.Cylinder)
def update_cylinder(cylinder_id: int, cylinder_update: schemas.CylinderUpdate, db: Session = Depends(get_db)):
    db_cylinder = db.query(models.Cylinder).filter(models.Cylinder.id == cylinder_id).first()
    if not db_cylinder:
        raise HTTPException(status_code=404, detail="Cylinder not found")
    
    update_data = cylinder_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_cylinder, field, value)
    
    db.commit()
    db.refresh(db_cylinder)
    return db_cylinder

@router.delete("/{cylinder_id}")
def delete_cylinder(cylinder_id: int, db: Session = Depends(get_db)):
    cylinder = db.query(models.Cylinder).filter(models.Cylinder.id == cylinder_id).first()
    if not cylinder:
        raise HTTPException(status_code=404, detail="Cylinder not found")
    
    # Check if cylinder has associated logs
    log_count = db.query(models.ConsumptionLog).filter(models.ConsumptionLog.cylinder_id == cylinder_id).count()
    if log_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete cylinder with associated consumption logs")
    
    db.delete(cylinder)
    db.commit()
    return {"message": "Cylinder deleted successfully"}

@router.post("/change-active")
def change_active_cylinder(new_cylinder_id: int, db: Session = Depends(get_db)):
    # Deactivate all cylinders
    db.query(models.Cylinder).update({models.Cylinder.is_active: False})
    
    # Activate the new cylinder
    new_cylinder = db.query(models.Cylinder).filter(models.Cylinder.id == new_cylinder_id).first()
    if not new_cylinder:
        raise HTTPException(status_code=404, detail="Cylinder not found")
    
    new_cylinder.is_active = True
    db.commit()
    
    return {"message": f"Cylinder #{new_cylinder.number} is now active"}

@router.get("/{cylinder_id}/date-range")
def get_cylinder_date_range(cylinder_id: int, db: Session = Depends(get_db)):
    """Get the date range of logs associated with this cylinder"""
    date_range = db.query(
        func.min(models.ConsumptionLog.date).label('start_date'),
        func.max(models.ConsumptionLog.date).label('end_date')
    ).filter(models.ConsumptionLog.cylinder_id == cylinder_id).first()
    
    return {
        "start_date": date_range.start_date,
        "end_date": date_range.end_date
    }

@router.get("/{cylinder_id}/total-pushes")
def get_cylinder_total_pushes(cylinder_id: int, db: Session = Depends(get_db)):
    """Get the total number of CO2 pushes for this cylinder"""
    total_pushes = db.query(
        func.sum(models.ConsumptionLog.co2_pushes).label('total_pushes')
    ).filter(models.ConsumptionLog.cylinder_id == cylinder_id).scalar()
    
    return {
        "total_pushes": total_pushes or 0
    }