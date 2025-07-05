from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app.models import Base
from app.routers import logs, cylinders, analytics, settings, data
from sqlalchemy import text

# Create database tables
Base.metadata.create_all(bind=engine)

# Run migrations for existing databases
def run_migrations():
    """Run necessary migrations for existing databases"""
    try:
        with engine.connect() as conn:
            # Check if max_pushes column exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='cylinders' AND column_name='max_pushes'
            """))
            if not result.fetchone():
                # Add max_pushes column if it doesn't exist
                conn.execute(text("ALTER TABLE cylinders ADD COLUMN max_pushes INTEGER DEFAULT 150"))
                conn.commit()
                print("Migration: Added max_pushes column to cylinders table")
    except Exception as e:
        print(f"Migration warning: {e}")

run_migrations()

app = FastAPI(title="SodaStream Tracker API", version="1.0.0")

# CORS middleware - Allow access from any origin on port 3003
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://.*:300[03]",  # Allow any host on port 3000 or 3003
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(logs.router, prefix="/api/logs", tags=["logs"])
app.include_router(cylinders.router, prefix="/api/cylinders", tags=["cylinders"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(data.router, prefix="/api/data", tags=["data"])

@app.get("/")
async def root():
    return {"message": "SodaStream Tracker API"}