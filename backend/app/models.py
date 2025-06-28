from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Cylinder(Base):
    __tablename__ = "cylinders"
    
    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, unique=True, index=True)
    cost = Column(Float, default=0.0)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    consumption_logs = relationship("ConsumptionLog", back_populates="cylinder")

class ConsumptionLog(Base):
    __tablename__ = "consumption_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    bottle_size = Column(String)  # "1L" or "0.5L"
    bottle_count = Column(Integer)
    volume_ml = Column(Float)  # calculated volume in mL
    co2_pushes = Column(Integer)  # number of CO2 button pushes
    cylinder_id = Column(Integer, ForeignKey("cylinders.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    cylinder = relationship("Cylinder", back_populates="consumption_logs")

class Settings(Base):
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(String)
    updated_at = Column(DateTime, default=datetime.utcnow)