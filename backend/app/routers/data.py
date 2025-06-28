from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.routers.logs import calculate_volume_and_pushes
import pandas as pd
import io
from datetime import datetime

router = APIRouter()

@router.post("/import")
async def import_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Validate required columns
        required_columns = ['date', 'bottle_size', 'bottle_count', 'cylinder_number']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(
                status_code=400, 
                detail=f"CSV must contain columns: {', '.join(required_columns)}"
            )
        
        imported_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Find or create cylinder
                cylinder = db.query(models.Cylinder).filter(
                    models.Cylinder.number == int(row['cylinder_number'])
                ).first()
                
                if not cylinder:
                    # Create new cylinder if it doesn't exist
                    cylinder = models.Cylinder(
                        number=int(row['cylinder_number']),
                        cost=0.0
                    )
                    db.add(cylinder)
                    db.flush()  # Get the ID
                
                # Calculate volume and pushes
                volume_ml, co2_pushes = calculate_volume_and_pushes(
                    row['bottle_size'], 
                    int(row['bottle_count'])
                )
                
                # Create consumption log
                log = models.ConsumptionLog(
                    date=pd.to_datetime(row['date']).date(),
                    bottle_size=row['bottle_size'],
                    bottle_count=int(row['bottle_count']),
                    volume_ml=volume_ml,
                    co2_pushes=co2_pushes,
                    cylinder_id=cylinder.id
                )
                
                db.add(log)
                imported_count += 1
                
            except Exception as e:
                errors.append(f"Row {index + 1}: {str(e)}")
        
        db.commit()
        
        return {
            "message": f"Successfully imported {imported_count} records",
            "imported_count": imported_count,
            "errors": errors[:10]  # Limit to first 10 errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")

@router.get("/export")
def export_csv(db: Session = Depends(get_db)):
    # Get all consumption logs with cylinder information
    logs = db.query(models.ConsumptionLog).join(models.Cylinder).all()
    
    # Prepare data for CSV
    data = []
    for log in logs:
        data.append({
            'date': log.date.isoformat(),
            'bottle_size': log.bottle_size,
            'bottle_count': log.bottle_count,
            'volume_ml': log.volume_ml,
            'co2_pushes': log.co2_pushes,
            'cylinder_number': log.cylinder.number,
            'cylinder_cost': log.cylinder.cost,
            'created_at': log.created_at.isoformat()
        })
    
    # Create DataFrame and CSV
    df = pd.DataFrame(data)
    
    # Create CSV in memory
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    
    # Return as streaming response
    response = StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=soda_consumption_export.csv"}
    )
    
    return response

@router.get("/sample-csv")
def get_sample_csv():
    """Download a sample CSV file for import reference"""
    sample_data = [
        {
            'date': '2024-01-01',
            'bottle_size': '1L',
            'bottle_count': 2,
            'cylinder_number': 1
        },
        {
            'date': '2024-01-02',
            'bottle_size': '0.5L',
            'bottle_count': 1,
            'cylinder_number': 1
        }
    ]
    
    df = pd.DataFrame(sample_data)
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    
    response = StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sample_import.csv"}
    )
    
    return response