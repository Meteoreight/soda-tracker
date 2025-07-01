# SodaStream Consumption Tracker

A comprehensive application for tracking SodaStream sparkling water consumption, CO2 usage, and cost analysis.

*[日本語版README](README_JP.md)*

## Features

- **Daily Consumption Logging**: Record daily sparkling water consumption with automatic volume calculations
- **CO2 Cylinder Management**: Track multiple CO2 cylinders with cost management and usage periods
- **Cost Analysis**: Compare your costs with retail sparkling water prices
- **Analytics & Visualization**: View consumption trends with interactive charts
- **Data Import/Export**: CSV import/export functionality for data management
- **Responsive Design**: Clean, white background design optimized for all devices

## Architecture

The application follows a 3-tier architecture:

- **Frontend**: React 18 application with 5 main views (Dashboard, History, Analytics, Cylinders, Settings)
  - UI Libraries: Recharts for charts, React DatePicker for date selection
  - Routing: React Router DOM v6
  - HTTP Client: Axios
- **Backend**: FastAPI with comprehensive REST API endpoints
  - Database ORM: SQLAlchemy 2.0
  - Validation: Pydantic v2
  - Data Processing: Pandas
- **Database**: PostgreSQL 15 for reliable data persistence

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### Installation

1. Clone or navigate to the project directory:
```bash
cd Soda-Tracker
```

2. Start the application using Docker Compose:
```bash
docker-compose up --build
```

3. Wait for all services to start (this may take a few minutes on first run)

4. Access the application:
   - **Frontend**: http://localhost:3003
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs

### First Setup

1. **Navigate to Cylinders section** and add your first CO2 cylinder
2. **Set it as active** to use for new consumption logs
3. **Go to Dashboard** and start logging your daily consumption
4. **Visit Settings** to configure retail price reference and initial costs

## Usage Guide

### Dashboard View
- **Quick logging** of daily consumption
- **Summary cards** showing today's consumption, monthly cost, and savings
- **Quick preview** of recent consumption trends

### History View
- **View all consumption logs** in a sortable table
- **Add, edit, or delete** individual consumption records
- **Bulk data management** with filtering options

### Analytics View
- **Interactive charts** showing consumption trends over 30d, 90d, 180d, or 365d periods
- **Cost comparison** between your SodaStream usage and retail prices
- **Statistical summaries** including daily averages and total consumption

### Cylinders View
- **Manage CO2 cylinders** with unique numbering system
- **Track costs** and usage periods for each cylinder
- **Switch active cylinder** when replacing CO2 canisters

### Settings View
- **Data import/export** via CSV files
- **Configure retail price** reference for cost comparisons
- **Set initial cost** of your SodaStream device
- **Download sample CSV** for import reference

## Data Model

### Consumption Logs
- Date, bottle size (1L/0.5L), bottle count
- Automatic calculation of volume (1L = 840mL, 0.5L = 455mL)
- Automatic CO2 push calculation (1L = 4 pushes, 0.5L = 2 pushes)

### CO2 Cylinders
- Unique numbering system (#1, #2, etc.)
- Cost tracking per cylinder
- Active/inactive status management

### Cost Calculations
- Based on CO2 consumption (pushes) rather than water volume
- Assumes ~500 pushes per cylinder for cost calculation
- Compares against retail price (default: ¥45 per 500mL)

## Development

### Project Structure
```
Soda-Tracker/
├── docker-compose.yml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   └── services/
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── models.py
│   │   └── main.py
│   └── requirements.txt
└── README.md
```

### API Endpoints

#### Consumption Logs
- `GET /api/logs` - Get all consumption logs
- `POST /api/logs` - Create new consumption log
- `PUT /api/logs/{id}` - Update consumption log
- `DELETE /api/logs/{id}` - Delete consumption log

#### Cylinders
- `GET /api/cylinders` - Get all cylinders
- `POST /api/cylinders` - Create new cylinder
- `PUT /api/cylinders/{id}` - Update cylinder
- `POST /api/cylinders/change-active` - Change active cylinder

#### Analytics
- `GET /api/analytics?period=30d` - Get analytics for period
- `GET /api/analytics/dashboard` - Get dashboard summary

#### Settings
- `GET/PUT /api/settings/retail-price/current` - Retail price setting
- `GET/PUT /api/settings/initial-cost/current` - Initial cost setting

#### Data Management
- `POST /api/data/import` - Import CSV data
- `GET /api/data/export` - Export CSV data
- `GET /api/data/sample-csv` - Download sample CSV

### Development Commands

```bash
# Start development environment
docker-compose up --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild specific service
docker-compose build frontend
docker-compose build backend

# Access database (if needed)
docker-compose exec db psql -U postgres -d soda_tracker
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3003, 8000, and 5432 are available
2. **Database connection**: Wait for PostgreSQL health check to pass
3. **Frontend not loading**: Check that backend is fully started first
4. **CSV import errors**: Use the sample CSV format as reference

### Data Backup

Export your data regularly using the Settings → Export to CSV function.

### Reset Database

To reset all data:
```bash
docker-compose down -v
docker-compose up --build
```