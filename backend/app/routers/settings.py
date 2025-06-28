from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from typing import List

router = APIRouter()

@router.get("/", response_model=List[schemas.Settings])
def get_all_settings(db: Session = Depends(get_db)):
    settings = db.query(models.Settings).all()
    return settings

@router.get("/{key}", response_model=schemas.Settings)
def get_setting(key: str, db: Session = Depends(get_db)):
    setting = db.query(models.Settings).filter(models.Settings.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting

@router.post("/", response_model=schemas.Settings)
def create_setting(setting: schemas.SettingsCreate, db: Session = Depends(get_db)):
    # Check if setting already exists
    existing = db.query(models.Settings).filter(models.Settings.key == setting.key).first()
    if existing:
        raise HTTPException(status_code=400, detail="Setting already exists")
    
    db_setting = models.Settings(**setting.dict())
    db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting

@router.put("/{key}", response_model=schemas.Settings)
def update_setting(key: str, setting_update: schemas.SettingsUpdate, db: Session = Depends(get_db)):
    db_setting = db.query(models.Settings).filter(models.Settings.key == key).first()
    if not db_setting:
        # Create new setting if it doesn't exist
        db_setting = models.Settings(key=key, value=setting_update.value)
        db.add(db_setting)
    else:
        db_setting.value = setting_update.value
        from datetime import datetime
        db_setting.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_setting)
    return db_setting

@router.delete("/{key}")
def delete_setting(key: str, db: Session = Depends(get_db)):
    setting = db.query(models.Settings).filter(models.Settings.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    db.delete(setting)
    db.commit()
    return {"message": "Setting deleted successfully"}

# Convenience endpoints for specific settings
@router.get("/retail-price/current")
def get_retail_price(db: Session = Depends(get_db)):
    setting = db.query(models.Settings).filter(models.Settings.key == "retail_price_per_500ml").first()
    return {"value": float(setting.value) if setting else 45.0}

@router.put("/retail-price/current")
def update_retail_price(price: float, db: Session = Depends(get_db)):
    setting = db.query(models.Settings).filter(models.Settings.key == "retail_price_per_500ml").first()
    if not setting:
        setting = models.Settings(key="retail_price_per_500ml", value=str(price))
        db.add(setting)
    else:
        setting.value = str(price)
        from datetime import datetime
        setting.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(setting)
    return {"value": price}

@router.get("/initial-cost/current")
def get_initial_cost(db: Session = Depends(get_db)):
    setting = db.query(models.Settings).filter(models.Settings.key == "initial_cost").first()
    return {"value": float(setting.value) if setting else 0.0}

@router.put("/initial-cost/current")
def update_initial_cost(cost: float, db: Session = Depends(get_db)):
    setting = db.query(models.Settings).filter(models.Settings.key == "initial_cost").first()
    if not setting:
        setting = models.Settings(key="initial_cost", value=str(cost))
        db.add(setting)
    else:
        setting.value = str(cost)
        from datetime import datetime
        setting.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(setting)
    return {"value": cost}