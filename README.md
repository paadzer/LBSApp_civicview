# Civic View

Civic View is a GeoDjango-powered civic issue reporting platform that exposes a REST API, runs DBSCAN-based hotspot clustering with Celery, and optionally visualises data through a lightweight React + Leaflet frontend. It matches the interim smart-city report goals: citizen reporting UI, automated DBSCAN hotspot detection, spatial storage in PostGIS, and map-based insight sharing.

## Architecture Overview

- **Presentation layer**: React + Leaflet (`frontend/`)
- **Application layer**: Django REST Framework (`civicview/`)
- **Data layer**: PostgreSQL + PostGIS
- **Processing layer**: Celery + Redis + DBSCAN (scikit-learn)

## 🌐 Live Application & Hosting

### Application URLs

- **Frontend (PWA):** [https://lbs-app-civicview.vercel.app/](https://lbs-app-civicview.vercel.app/)
- **Backend API:** [https://lbsappcivicview-production.up.railway.app/api/](https://lbsappcivicview-production.up.railway.app/api/)
- **API Root:** [https://lbsappcivicview-production.up.railway.app/](https://lbsappcivicview-production.up.railway.app/)

### Hosting Infrastructure

The application is deployed across multiple cloud services:

#### Frontend (Vercel)
- **Platform:** Vercel
- **Type:** Progressive Web Application (PWA)
- **Features:**
  - Automatic deployments from GitHub
  - Global CDN for fast loading
  - Service worker for offline capabilities
  - Responsive design for mobile and desktop

#### Backend (Railway)
- **Platform:** Railway
- **Deployment:** Docker containers
- **Services:**
  - **Web Service:** Django REST API (Gunicorn)
  - **Worker Service:** Celery Worker for async task processing
  - **Beat Service:** Celery Beat scheduler for periodic tasks
  - **Database:** PostgreSQL with PostGIS extension
  - **Message Broker:** Redis for Celery task queue

### Automatic Hotspot Generation

The application features **fully automated hotspot generation** that runs continuously:

#### How It Works

1. **Celery Beat Scheduler** runs continuously on Railway
   - Schedules the `generate_hotspots` task every **5 minutes**
   - Configuration: `CELERY_BEAT_SCHEDULE` in `civicview_project/settings.py`
   - Task: `civicview.tasks.generate_hotspots`

2. **Celery Worker** processes scheduled tasks
   - Receives tasks from the Redis message broker
   - Executes DBSCAN clustering algorithm on all reports
   - Generates hotspot polygons and stores them in the database

3. **Automatic Updates**
   - Hotspots are regenerated every 5 minutes
   - Old hotspots are deleted and new ones created based on current reports
   - No manual intervention required
   - System runs 24/7 in the cloud

#### Benefits

- **Real-time Insights:** Hotspots always reflect the latest report data
- **Zero Maintenance:** Fully automated, no manual triggers needed
- **Scalable:** Handles any number of reports efficiently
- **Reliable:** Runs continuously with automatic error recovery

#### Monitoring

You can monitor the automatic generation by:
- Checking **Beat service logs** in Railway for scheduling messages
- Checking **Worker service logs** for task execution
- Viewing hotspots on the frontend map (orange polygons)
- Querying the `/api/hotspots/` endpoint

### Deployment Architecture

```
┌─────────────────┐
│   Vercel CDN    │  ← Frontend (React PWA)
│  (Frontend)     │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────────────────────┐
│         Railway Platform                │
│  ┌──────────────┐  ┌──────────────┐   │
│  │ Django API   │  │ Celery Worker │   │
│  │ (Gunicorn)   │  │              │   │
│  └──────┬───────┘  └──────┬───────┘   │
│         │                  │            │
│  ┌──────▼──────────────────▼──────┐   │
│  │      Redis (Message Broker)     │   │
│  └──────┬──────────────────┬──────┘   │
│         │                  │            │
│  ┌──────▼──────┐  ┌────────▼──────┐   │
│  │ PostgreSQL  │  │ Celery Beat   │   │
│  │  (PostGIS)  │  │  (Scheduler)  │   │
│  └─────────────┘  └───────────────┘   │
└─────────────────────────────────────────┘
```

## Prerequisites

- **Conda** (or Mamba/Micromamba) - Required for managing Python environment and GeoDjango dependencies
- **PostgreSQL** with **PostGIS** extension installed
- **Redis** server
- **Node.js** and **npm** (for the React frontend)
- **Docker** (optional, for containerized deployment)

### Installing Prerequisites

#### PostgreSQL with PostGIS

**Windows:**
1. Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Install PostGIS extension using Stack Builder or via pgAdmin

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib postgis postgresql-postgis
```

**macOS (Homebrew):**
```bash
brew install postgresql postgis
```

#### Redis

**Windows:**
- Download from [redis.io](https://redis.io/download) or use WSL
- Or use Docker: `docker run -d -p 6379:6379 redis:7`

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

## Setup

### Step 1: Clone the Repository

```bash
git clone <repo_url> civicview
cd civicview
```

### Step 2: Create Conda Environment

```bash
conda env create -f environment.yml
conda activate civicview
```

This will install all required dependencies including:
- Django and Django REST Framework
- GeoDjango dependencies (GDAL, GEOS, PROJ)
- PostgreSQL client (psycopg2)
- Celery and Redis client
- Scikit-learn for DBSCAN clustering
- Shapely for geometric operations

### Step 3: Create PostgreSQL Database

Create a new PostgreSQL database with PostGIS extension:

**Using psql command line:**
```bash
psql -U postgres
```

Then in the psql prompt:
```sql
CREATE DATABASE civicview;
\c civicview
CREATE EXTENSION postgis;
\q
```

**Using pgAdmin:**
1. Open pgAdmin and connect to your PostgreSQL server
2. Right-click on "Databases" → Create → Database
3. Name it `civicview`
4. Open the database, go to Extensions
5. Enable the `postgis` extension

### Step 4: Configure Environment Variables

Create a `.env` file in the project root directory:

```bash
# Windows
copy .env.example .env

# Linux/macOS
cp .env.example .env
```

If `.env.example` doesn't exist, create a `.env` file with the following content:

```env
# Django Core Settings
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

# Database Configuration (PostgreSQL with PostGIS)
DATABASE_NAME=civicview
DATABASE_USER=your_postgres_username
DATABASE_PASSWORD=your_postgres_password
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Celery / Redis Configuration
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# CORS Configuration (React Frontend)
CORS_ALLOWED_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
```

**Important:** Replace the placeholder values:
- `SECRET_KEY`: Generate a secure key (you can use: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)
- `DATABASE_USER`: Your PostgreSQL username (default is often `postgres`)
- `DATABASE_PASSWORD`: Your PostgreSQL password

### Step 5: Configure GDAL/GEOS Paths (Windows Only)

**IMPORTANT for Windows users:** You must update the GDAL and GEOS library paths in `civicview_project/settings.py` to match your Conda environment location.

1. Find your Conda environment path:
   ```bash
   conda env list
   ```

2. Open `civicview_project/settings.py` and locate these lines (around lines 168-169):
   ```python
   GDAL_LIBRARY_PATH = r"C:\Users\patri\miniconda3\envs\civicview\Library\bin\gdal.dll"
   GEOS_LIBRARY_PATH = r"C:\Users\patri\miniconda3\envs\civicview\Library\bin\geos_c.dll"
   ```

3. Update the paths to match your Conda installation:
   - Replace `C:\Users\patri\miniconda3` with your Conda installation path
   - Replace `envs\civicview` with your environment name if different
   - Example paths:
     - Miniconda: `C:\Users\YourUsername\miniconda3\envs\civicview\Library\bin\gdal.dll`
     - Anaconda: `C:\Users\YourUsername\anaconda3\envs\civicview\Library\bin\gdal.dll`

4. Verify the files exist at those paths:
   - `gdal.dll` should be at: `[conda_path]\envs\civicview\Library\bin\gdal.dll`
   - `geos_c.dll` should be at: `[conda_path]\envs\civicview\Library\bin\geos_c.dll`

**Note:** Linux and macOS users typically don't need to configure these paths as they're usually found automatically.

### Step 6: Apply Database Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### Step 7: Create Django Superuser

Create an admin user to access the Django admin panel:

```bash
python manage.py createsuperuser
```

Follow the prompts to set a username, email, and password.

### Step 8: Verify Setup

Run Django's system check:

```bash
python manage.py check
```

You should see: `System check identified no issues (0 silenced).`

If you see errors related to GDAL or GEOS on Windows, double-check the paths in Step 5.

### Step 9: Start Redis Server

Make sure Redis is running. In a separate terminal:

**Windows:**
```bash
redis-server
# Or if installed via Docker:
docker run -d -p 6379:6379 redis:7
```

**Linux/macOS:**
```bash
redis-server
# Or if installed as a service:
sudo systemctl start redis  # Linux
brew services start redis   # macOS
```

### Step 10: Start Celery Worker

In a new terminal (with the Conda environment activated):

```bash
conda activate civicview
celery -A civicview_project worker -l info
```

Keep this terminal open. You should see messages like:
```
celery@hostname ready.
```

### Step 11: Start Django Development Server

In another terminal (with the Conda environment activated):

```bash
conda activate civicview
python manage.py runserver
```

The server will start at `http://127.0.0.1:8000/`

You can now:
- Access the API at: `http://127.0.0.1:8000/api/`
- Access the Django admin at: `http://127.0.0.1:8000/admin/`

## Frontend Setup

The React frontend provides an interactive map interface for viewing and submitting civic reports.

### Step 1: Install Frontend Dependencies

Navigate to the frontend directory and install npm packages:

```bash
cd frontend
npm install
```

### Step 2: Start Frontend Development Server

```bash
npm run dev
```

The frontend will start at `http://localhost:3000` (or the next available port).

**Important:** Make sure the Django backend is running on `http://127.0.0.1:8000/` before using the frontend.

### Frontend Features

- **Interactive Map**: Leaflet-based map showing report locations and hotspot clusters
- **Click-to-Set Coordinates**: Click anywhere on the map to automatically populate latitude/longitude in the report form (blue marker indicates selected location)
- **Report Submission Form**: Submit civic issues with title, description, category, and location
- **Visual Indicators**: 
  - Red markers show individual reports
  - Orange polygons show detected hotspot clusters
  - Blue marker shows the currently selected location for new reports

### Frontend Development

The frontend uses:
- **React 18** for UI components
- **Vite** for fast development and building
- **Leaflet** and **React-Leaflet** for interactive maps
- **Axios** for API communication

To build for production:
```bash
npm run build
```

## API Endpoints

Base URL: `http://127.0.0.1:8000/api/`

### Create a Report
`POST /reports/`

Request body:
```json
{
  "title": "Streetlight out",
  "description": "No lighting on corner",
  "category": "Lighting",
  "latitude": 51.5,
  "longitude": -0.12
}
```

Response:
```json
{
  "id": 1,
  "title": "Streetlight out",
  "description": "No lighting on corner",
  "category": "Lighting",
  "geom": {
    "type": "Point",
    "coordinates": [-0.12, 51.5]
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

### List Reports
`GET /reports/`

Returns a list of all reports, ordered by most recent first.

### List Hotspots
`GET /hotspots/`

Returns a list of all detected hotspot clusters as polygons.

## What the App Does

Civic View is a location-based services (LBS) application that enables citizens to report civic issues and automatically identifies problem hotspots using machine learning clustering.

### Core Features

1. **Civic Issue Reporting**
   - Users can create accounts and log in
   - Submit reports with title, description, category, and location
   - Location can be set by clicking on an interactive map
   - Reports are stored with geographic coordinates (PostGIS PointField)

2. **Automatic Hotspot Detection**
   - Uses DBSCAN clustering algorithm to identify areas with multiple reports
   - Automatically runs every 5 minutes via Celery Beat scheduler
   - Generates polygon boundaries (convex hulls) for each cluster
   - Visualized as orange polygons on the map

3. **Interactive Map Interface**
   - Leaflet-based map showing all reports (red markers)
   - Hotspot clusters displayed as orange polygons
   - Points of Interest (POIs) from OpenStreetMap
   - Click-to-select location for new reports

4. **Points of Interest Integration**
   - Fetches nearby POIs from Overpass API (OpenStreetMap)
   - Displays restaurants, cafes, shops, tourist attractions, etc.
   - Helps users understand the context around reported issues

5. **Progressive Web Application (PWA)**
   - Works on mobile and desktop browsers
   - Can be installed as an app on mobile devices
   - Offline capabilities via service worker
   - Responsive design for all screen sizes

### User Workflow

1. **Registration/Login:** Users create accounts or log in
2. **View Map:** See existing reports and hotspots on the map
3. **Submit Report:** Click on map to select location, fill form, submit
4. **Automatic Processing:** System automatically generates hotspots every 5 minutes
5. **View Results:** Hotspots appear as orange polygons showing problem areas

## Hotspot Generation

Hotspots are generated using DBSCAN clustering algorithm to identify areas with multiple reports.

### Automatic Generation (Production)

**In the deployed application, hotspots are automatically generated every 5 minutes** via Celery Beat scheduler. No manual intervention is required.

The automatic system:
- Runs continuously on Railway
- Schedules tasks every 5 minutes
- Processes all reports in the database
- Updates hotspot polygons automatically
- Handles errors gracefully with retry logic

### Manual Generation (Local Development)

For local development, you can manually trigger hotspot generation:

#### Management Command

```bash
python manage.py generate_hotspots
```

This command:
- Queries all existing reports from the database
- Applies DBSCAN clustering (eps=0.01, min_samples=2)
- Creates convex hull polygons for each cluster
- Stores hotspots in the database

**Note:** This replaces all existing hotspots. Run this after adding new reports to update hotspot detection.

#### Via Celery (Async)

If you want to use Celery for async processing locally:

1. Make sure Celery worker is running (see Step 10 in Setup)
2. From Django shell or a view:
   ```python
   from civicview.tasks import generate_hotspots
   generate_hotspots.delay()
   ```

### DBSCAN Parameters

The clustering uses these default parameters (defined in `civicview/tasks.py`):
- **eps=0.01**: Maximum distance between points to be in the same cluster (approximately 1km)
- **min_samples=2**: Minimum number of reports required to form a cluster

To adjust these parameters, edit the `generate_hotspots` function in `civicview/tasks.py`.

### Viewing Hotspots

- **Django Admin**: Navigate to `http://127.0.0.1:8000/admin/civicview/hotspot/`
- **Frontend Map**: Hotspots appear as orange polygons on the interactive map
- **API**: Query `GET /api/hotspots/` for JSON data

## Docker Setup (Optional)

For containerized deployment, use Docker Compose to run all services:

### Prerequisites
- Docker and Docker Compose installed
- `.env` file configured (see Step 4 in Setup)

### Start All Services

```bash
docker compose up -d --build
```

This will start:
- **PostgreSQL with PostGIS** on port 5432
- **Redis** on port 6379
- **Django web server** on port 8000
- **Celery worker** for background tasks

### Initialize Database

```bash
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f web
docker compose logs -f worker
docker compose logs -f db
```

### Stop Services

```bash
docker compose down
```

**Note:** For local development with Conda, the Docker setup is optional. Use Docker if you prefer containerized development or for production deployment.

## Cloud Deployment

### Backend Deployment (Railway)

The backend is deployed on Railway using Docker containers:

1. **Connect GitHub Repository**
   - Link your GitHub repository to Railway
   - Railway automatically detects the Dockerfile

2. **Add Services**
   - **Web Service:** Main Django API
   - **Worker Service:** Celery worker for task processing
   - **Beat Service:** Celery Beat scheduler
   - **PostgreSQL:** Database with PostGIS extension
   - **Redis:** Message broker for Celery

3. **Configure Environment Variables**
   - Set all required environment variables in Railway dashboard
   - Database credentials, Redis URLs, CORS settings, etc.

4. **Deploy**
   - Railway automatically deploys on git push
   - Services start automatically with health checks

### Frontend Deployment (Vercel)

The frontend is deployed on Vercel as a PWA:

1. **Connect GitHub Repository**
   - Link the `frontend/` directory to Vercel
   - Configure build settings:
     - Build Command: `npm run build`
     - Output Directory: `dist`

2. **Environment Variables**
   - Set `VITE_API_URL` to your Railway backend URL

3. **Deploy**
   - Vercel automatically deploys on git push
   - Global CDN ensures fast loading worldwide

### GitHub Repository

The complete source code is available on GitHub:
- Repository: [Link to your GitHub repository]
- All code, configuration files, and documentation included
- Ready for deployment to Railway and Vercel

## Verification & Testing

### Verify Backend is Running

1. **Check Django server**: Visit `http://127.0.0.1:8000/admin/` - you should see the Django admin login page
2. **Check API**: Visit `http://127.0.0.1:8000/api/reports/` - you should see an empty list `[]` or existing reports
3. **Check Hotspots API**: Visit `http://127.0.0.1:8000/api/hotspots/` - you should see an empty list `[]` or existing hotspots

### Test Report Creation

Using curl:
```bash
curl -X POST http://127.0.0.1:8000/api/reports/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Report",
    "description": "This is a test",
    "category": "Testing",
    "latitude": 51.509865,
    "longitude": -0.118092
  }'
```

Using Django Admin:
1. Go to `http://127.0.0.1:8000/admin/`
2. Log in with your superuser credentials
3. Navigate to "Reports" → "Add Report"
4. Fill in the form and save

### Verify Hotspot Generation

1. Create at least 2-3 reports in close proximity (within ~1km)
2. Run: `python manage.py generate_hotspots`
3. Check hotspots:
   - Django Admin: `http://127.0.0.1:8000/admin/civicview/hotspot/`
   - API: `http://127.0.0.1:8000/api/hotspots/`
   - Frontend map: Should show orange polygons

### Verify Frontend

1. Ensure backend is running on `http://127.0.0.1:8000/`
2. Start frontend: `cd frontend && npm run dev`
3. Open browser to the frontend URL (typically `http://localhost:3000`)
4. You should see:
   - A map centered on coordinates (default: London)
   - A report submission form
   - Existing reports as markers (if any)
   - Existing hotspots as polygons (if any)
5. Test map click: Click on the map - a blue marker should appear and coordinates should populate in the form

## Troubleshooting

### Common Issues

#### 1. GDAL/GEOS Library Not Found (Windows)

**Error:** `django.core.exceptions.ImproperlyConfigured: Could not find the GDAL library`

**Solution:**
- Update the `GDAL_LIBRARY_PATH` and `GEOS_LIBRARY_PATH` in `civicview_project/settings.py` (see Step 5 in Setup)
- Verify the files exist at those paths
- Make sure the Conda environment is activated

#### 2. Database Connection Error

**Error:** `django.db.utils.OperationalError: could not connect to server`

**Solutions:**
- Verify PostgreSQL is running: `psql -U postgres -c "SELECT version();"`
- Check database credentials in `.env` file
- Ensure PostGIS extension is installed: `psql -U postgres -d civicview -c "CREATE EXTENSION IF NOT EXISTS postgis;"`
- Verify database exists: `psql -U postgres -l` should list `civicview`

#### 3. Redis Connection Error

**Error:** `Error 111 connecting to localhost:6379`

**Solutions:**
- Start Redis server (see Step 9 in Setup)
- Check Redis is running: `redis-cli ping` should return `PONG`
- Verify Redis URL in `.env` file matches your Redis setup

#### 4. Celery Worker Not Processing Tasks

**Solutions:**
- Ensure Celery worker is running in a separate terminal
- Check Celery worker logs for errors
- Verify Redis is running and accessible
- Restart Celery worker after code changes

#### 5. Frontend Can't Connect to Backend

**Error:** CORS errors or network errors in browser console

**Solutions:**
- Ensure Django backend is running on `http://127.0.0.1:8000/`
- Check CORS settings in `.env` file include your frontend URL
- Verify `CORS_ALLOWED_ORIGINS` in settings.py includes the frontend origin
- Check browser console for specific error messages

#### 6. No Hotspots Appearing

**Solutions:**
- Ensure you have at least 2 reports close together (within ~1km)
- Run hotspot generation: `python manage.py generate_hotspots`
- Check hotspots exist: Visit `http://127.0.0.1:8000/api/hotspots/`
- Verify hotspot polygons have valid geometry in Django admin

#### 7. Conda Environment Issues

**Error:** Packages not found or import errors

**Solutions:**
- Ensure environment is activated: `conda activate civicview`
- Recreate environment: `conda env remove -n civicview && conda env create -f environment.yml`
- Update packages: `conda update --all`

### Getting Help

1. Check Django logs: Look at terminal output when running `python manage.py runserver`
2. Check Celery logs: Look at terminal output from Celery worker
3. Check browser console: F12 → Console tab for frontend errors
4. Verify all prerequisites are installed and running
5. Ensure `.env` file is configured correctly
6. Verify database migrations are applied: `python manage.py showmigrations`

## Project Structure

```
CivicView/
├── civicview/                  # Main Django app
│   ├── management/
│   │   └── commands/
│   │       └── generate_hotspots.py  # CLI command for hotspot generation
│   ├── migrations/             # Database migrations
│   ├── models.py              # Report and Hotspot models
│   ├── serializers.py         # DRF serializers
│   ├── tasks.py               # Celery tasks (DBSCAN clustering)
│   ├── views.py               # API viewsets
│   └── urls.py                # URL routing
├── civicview_project/         # Django project settings
│   ├── settings.py            # Main configuration (edit GDAL/GEOS paths here on Windows)
│   ├── urls.py                # Root URL configuration
│   └── celery.py              # Celery configuration
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapView.jsx    # Leaflet map component
│   │   │   └── ReportForm.jsx # Report submission form
│   │   ├── App.jsx            # Main React component
│   │   └── api.js             # API client
│   └── package.json
├── .env                       # Environment variables (create from .env.example)
├── environment.yml            # Conda environment specification
├── docker-compose.yml         # Docker Compose configuration
└── README.md                  # This file
```

## Quick Start Checklist

- [ ] Conda environment created and activated
- [ ] PostgreSQL with PostGIS installed and database created
- [ ] Redis server running
- [ ] `.env` file created and configured
- [ ] GDAL/GEOS paths updated in `settings.py` (Windows only)
- [ ] Database migrations applied
- [ ] Django superuser created
- [ ] Django server running (`python manage.py runserver`)
- [ ] Celery worker running (`celery -A civicview_project worker -l info`)
- [ ] Frontend dependencies installed (`cd frontend && npm install`)
- [ ] Frontend server running (`npm run dev`)
- [ ] Tested report creation
- [ ] Tested hotspot generation

## Assignment Submission

### Live Application Links

- **Frontend URL:** [https://lbs-app-civicview.vercel.app/](https://lbs-app-civicview.vercel.app/)
- **Backend API URL:** [https://lbsappcivicview-production.up.railway.app/api/](https://lbsappcivicview-production.up.railway.app/api/)

### Submission Files

1. **GitHub Repository:** Complete source code available at [GitHub Repository URL]
   - All Python/Django backend code
   - React frontend code
   - Docker configuration
   - Environment configuration examples
   - Documentation

2. **Deployment Files:**
   - `Dockerfile` - Backend containerization
   - `docker-compose.yml` - Local development setup
   - `requirements.txt` - Python dependencies
   - `frontend/package.json` - Frontend dependencies

### Key Features Demonstrated

✅ **Location-Based Services (LBS)**
- Geographic data storage with PostGIS
- Spatial queries and operations
- Interactive map interface

✅ **Django REST Framework API**
- RESTful endpoints for reports and hotspots
- Token-based authentication
- User registration and login

✅ **Progressive Web Application (PWA)**
- Service worker for offline capabilities
- Installable on mobile devices
- Responsive design

✅ **Automated Hotspot Detection**
- DBSCAN clustering algorithm
- Automatic generation every 5 minutes via Celery Beat
- Real-time updates without manual intervention

✅ **Cloud Deployment**
- Backend on Railway (Docker containers)
- Frontend on Vercel (CDN)
- Managed PostgreSQL with PostGIS
- Redis message broker

✅ **External API Integration**
- Overpass API for Points of Interest
- OpenStreetMap data integration

## Next Steps

### For Users

1. Visit the live application: [https://lbs-app-civicview.vercel.app/](https://lbs-app-civicview.vercel.app/)
2. Create an account or log in
3. Explore existing reports and hotspots on the map
4. Submit new reports by clicking on the map
5. Watch hotspots automatically update every 5 minutes

### For Developers

1. Clone the repository from GitHub
2. Follow the setup instructions in this README
3. Run locally for development
4. Customize DBSCAN parameters in `civicview/tasks.py` if needed
5. Adjust map center/zoom in `frontend/src/components/MapView.jsx` for your region
6. Deploy to your own Railway/Vercel accounts

