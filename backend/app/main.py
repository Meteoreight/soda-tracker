from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app.models import Base
from app.routers import logs, cylinders, analytics, settings, data

# Create database tables
Base.metadata.create_all(bind=engine)

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