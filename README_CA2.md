# Civic View - CA2 Assignment Documentation

This document provides comprehensive setup and deployment instructions for the Civic View Location-Based Service (LBS) application, including all new features added for the CA2 assignment.

## Table of Contents

1. [Overview](#overview)
2. [New Features (CA2)](#new-features-ca2)
3. [Local Development Setup (Windows with Conda)](#local-development-setup-windows-with-conda)
4. [Docker Deployment](#docker-deployment)
5. [PWA Features](#pwa-features)
6. [Geolocation Support](#geolocation-support)
7. [Overpass API / POIs Integration](#overpass-api--pois-integration)
8. [Cloud Deployment](#cloud-deployment)
9. [Troubleshooting](#troubleshooting)

## Overview

Civic View is a full Location-Based Service (LBS) application built with:

- **Backend**: Django + GeoDjango + Django REST Framework
- **Database**: PostgreSQL with PostGIS extension
- **Frontend**: React + Leaflet (Progressive Web App)
- **Task Queue**: Celery + Redis
- **Clustering**: DBSCAN algorithm for hotspot detection
- **External APIs**: Overpass API (OpenStreetMap) for Points of Interest

## New Features (CA2)

### 1. Progressive Web App (PWA)
- Installable web application with manifest.json
- Service worker for offline functionality
- Caching of static assets, API responses, and map tiles
- Mobile-friendly responsive design

### 2. Geolocation Support
- "Use my location" button in report form
- Browser Geolocation API integration
- Automatic coordinate pre-filling
- Graceful error handling

### 3. Overpass API Integration
- Backend endpoint `/api/pois/` for Points of Interest
- Frontend toggle to show/hide nearby POIs
- Real-time POI fetching from OpenStreetMap
- Visual markers on map with popup information

### 4. Docker & Cloud Deployment
- Production-ready Dockerfile with GeoDjango dependencies
- Docker Compose configuration for all services
- Environment variable-based configuration
- Health checks and proper service dependencies

## Local Development Setup (Windows with Conda)

### Prerequisites

- **Conda** (Miniconda or Anaconda)
- **PostgreSQL** with PostGIS extension
- **Redis** server
- **Node.js** and **npm**

### Step 1: Create Conda Environment

```bash
conda env create -f environment.yml
conda activate civicview
```

### Step 2: Configure Database

Create a PostgreSQL database with PostGIS:

```sql
CREATE DATABASE civicview;
\c civicview
CREATE EXTENSION postgis;
```

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```env
# Django Core Settings
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

# Database Configuration
DATABASE_NAME=civicview
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Celery / Redis Configuration
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
```

### Step 4: GDAL/GEOS Configuration

**IMPORTANT for Windows**: The `civicview_project/settings.py` file automatically detects your Conda environment using `CONDA_PREFIX`. If this doesn't work, you may need to update the fallback paths:

1. Find your Conda environment path:
   ```bash
   conda env list
   ```

2. If needed, update the fallback paths in `civicview_project/settings.py` (lines ~210-215):
   ```python
   GDAL_LIBRARY_PATH = r"C:\Users\YourUsername\miniconda3\envs\civicview\Library\bin\gdal.dll"
   GEOS_LIBRARY_PATH = r"C:\Users\YourUsername\miniconda3\envs\civicview\Library\bin\geos_c.dll"
   ```

The settings file now uses `CONDA_PREFIX` automatically, so manual updates should only be needed if Conda environment detection fails.

### Step 5: Apply Database Migrations

```bash
python manage.py migrate
python manage.py createsuperuser
```

### Step 6: Start Services

**Terminal 1 - Redis:**
```bash
redis-server
```

**Terminal 2 - Celery Worker:**
```bash
conda activate civicview
celery -A civicview_project worker -l info
```

**Terminal 3 - Django Server:**
```bash
conda activate civicview
python manage.py runserver
```

### Step 7: Start Frontend

**Terminal 4 - React Frontend:**
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Step 8: Generate Hotspots

After creating some reports, generate hotspots:

```bash
python manage.py generate_hotspots
```

## Docker Deployment

### Prerequisites

- Docker and Docker Compose installed
- `.env` file configured (see above)

### Quick Start

```bash
# Build and start all services
docker compose up --build

# Run migrations (first time only)
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser

# Generate hotspots
docker compose exec web python manage.py generate_hotspots
```

### Services

The Docker Compose setup includes:

- **db**: PostgreSQL with PostGIS (port 5432)
- **redis**: Redis server (port 6379)
- **web**: Django backend with Gunicorn (port 8000)
- **worker**: Celery worker for background tasks

### Environment Variables for Docker

The `.env` file should include:

```env
# Database (Docker internal hostname)
DATABASE_HOST=db
DATABASE_NAME=civicview
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Celery (Docker internal hostname)
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# Django
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com,localhost,127.0.0.1
```

### Docker Commands

```bash
# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild after code changes
docker compose up --build

# Access Django shell
docker compose exec web python manage.py shell

# Run management commands
docker compose exec web python manage.py generate_hotspots
```

## PWA Features

### Manifest

The PWA manifest (`frontend/public/manifest.json`) includes:

- App name: "Civic View"
- Short name: "CivicView"
- Icons: 192x192 and 512x512 (placeholders - replace with actual icons)
- Theme color: #2563eb (blue)
- Display mode: standalone

### Service Worker

The service worker (`frontend/public/sw.js`) provides:

- **Static asset caching**: JS, CSS, HTML files
- **API response caching**: Reports and hotspots for offline viewing
- **Map tile caching**: Leaflet/OpenStreetMap tiles
- **Offline fallback**: Returns cached data when network is unavailable

### Installing the PWA

1. Open the app in a supported browser (Chrome, Edge, Safari)
2. Look for the install prompt or use browser menu
3. Click "Install" to add to home screen
4. The app will work offline with cached data

### Building for Production

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`. Serve these files with a web server or integrate with Django static files.

### PWA Icons

**Important**: Replace the placeholder icons in `frontend/public/`:

- `icon-192x192.png` - 192x192 pixel icon
- `icon-512x512.png` - 512x512 pixel icon

You can generate icons using tools like:
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

## Geolocation Support

### Using "Use my location" Button

1. Click the "📍 Use my location" button in the report form
2. Browser will request location permission
3. If granted, coordinates are automatically filled
4. A temporary marker appears on the map (if location is within view)

### Error Handling

The geolocation feature handles:

- **Permission denied**: Shows message, form still usable
- **Location unavailable**: Shows error, manual entry still possible
- **Timeout**: Shows timeout message
- **Browser not supported**: Gracefully degrades

### Privacy

- Location is only requested when user clicks the button
- No location data is stored without user consent
- Location is only used to pre-fill form fields

## Overpass API / POIs Integration

### Backend Endpoint

**GET `/api/pois/`**

Query parameters:
- `lat` (required): Latitude
- `lon` (required): Longitude
- `radius` (optional): Search radius in metres (default: 500, max: 5000)
- `type` (optional): Filter by POI type, e.g., `amenity=pub`, `tourism=hotel`

**Example Request:**
```
GET /api/pois/?lat=53.3498&lon=-6.2603&radius=1000
```

**Example Response:**
```json
{
  "pois": [
    {
      "name": "The Brazen Head",
      "type": "amenity: pub",
      "latitude": 53.3458,
      "longitude": -6.2736
    }
  ],
  "count": 1
}
```

### Frontend Usage

1. Click "📍 Show Nearby POIs" button (top-right of map)
2. POIs are fetched for the current map center
3. Purple markers appear on the map
4. Click markers to see POI name and type
5. Click button again to hide POIs

### POI Types

The integration searches for:
- **Amenities**: Pubs, restaurants, cafes, etc.
- **Tourism**: Hotels, attractions, museums
- **Shops**: Various retail establishments
- **Leisure**: Parks, sports facilities
- **Healthcare**: Hospitals, clinics, pharmacies

### Rate Limiting

The Overpass API has rate limits. The implementation:
- Limits results to 100 POIs per request
- Uses a 30-second timeout
- Handles errors gracefully

## Cloud Deployment

### Deployment Options

1. **AWS / Azure / GCP**: Use container services (ECS, Container Instances, Cloud Run)
2. **Heroku**: Use Docker containers or buildpacks
3. **DigitalOcean**: App Platform or Droplets with Docker
4. **Railway / Render**: Direct Docker support

### Environment Variables for Production

```env
# Security
SECRET_KEY=<generate-secure-key>
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# Database (managed service or container)
DATABASE_HOST=your-db-host
DATABASE_NAME=civicview
DATABASE_USER=your-db-user
DATABASE_PASSWORD=your-db-password
DATABASE_PORT=5432

# Redis (managed service or container)
CELERY_BROKER_URL=redis://your-redis-host:6379/0
CELERY_RESULT_BACKEND=redis://your-redis-host:6379/0

# CORS
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### Dockerfile for Production

The provided `Dockerfile` is production-ready:

- Uses Python 3.11-slim base image
- Installs GeoDjango system dependencies
- Runs as non-root user
- Uses Gunicorn with 3 workers
- Collects static files

### Static Files

For production, configure a static file server (Nginx, CloudFront, etc.) or use Django's static file serving:

```python
# In settings.py (production)
STATIC_ROOT = BASE_DIR / "staticfiles"
STATIC_URL = "/static/"
```

### Database Migrations

Run migrations during deployment:

```bash
docker compose exec web python manage.py migrate
```

### Celery Worker

Ensure the Celery worker service is running:

```bash
docker compose up worker
```

Or deploy as a separate service in your cloud platform.

### Frontend Deployment

**Option 1: Serve from Django**

1. Build frontend: `cd frontend && npm run build`
2. Copy `dist/` contents to Django static files
3. Configure Django to serve static files

**Option 2: Separate Static Host**

1. Build frontend: `cd frontend && npm run build`
2. Deploy `dist/` to CDN or static hosting (Netlify, Vercel, etc.)
3. Update API base URL in `frontend/src/api.js`

**Option 3: Docker Service**

Add a frontend service to `docker-compose.yml` using Nginx:

```yaml
frontend:
  image: nginx:alpine
  volumes:
    - ./frontend/dist:/usr/share/nginx/html
  ports:
    - "80:80"
```

## Troubleshooting

### GDAL/GEOS Errors (Windows)

**Error**: `Could not find the GDAL library`

**Solution**:
1. Verify Conda environment is activated: `conda activate civicview`
2. Check `CONDA_PREFIX` is set: `echo %CONDA_PREFIX%`
3. Verify DLL files exist in `%CONDA_PREFIX%\Library\bin\`
4. Update fallback paths in `settings.py` if needed

### Docker Build Fails

**Error**: GeoDjango dependencies not found

**Solution**:
1. Ensure Dockerfile uses correct base image
2. Check system package names match your Linux distribution
3. Verify `GDAL_LIBRARY_PATH` and `GEOS_LIBRARY_PATH` in settings

### Service Worker Not Registering

**Solution**:
1. Check browser console for errors
2. Ensure `sw.js` is accessible at `/sw.js`
3. Verify HTTPS in production (required for service workers)
4. Clear browser cache and reload

### POIs Not Loading

**Solution**:
1. Check browser console for API errors
2. Verify backend is running: `curl http://localhost:8000/api/pois/?lat=53.3&lon=-6.2`
3. Check Overpass API status: https://overpass-api.de/api/status
4. Verify CORS settings allow frontend origin

### Geolocation Not Working

**Solution**:
1. Check browser permissions (Settings → Privacy → Location)
2. Ensure HTTPS in production (required for geolocation)
3. Test in different browsers
4. Check browser console for error messages

### Database Connection Issues (Docker)

**Solution**:
1. Verify database service is healthy: `docker compose ps`
2. Check database logs: `docker compose logs db`
3. Ensure `.env` file has correct `DATABASE_HOST=db`
4. Wait for database to be ready before starting web service

## API Endpoints Summary

- `GET /api/reports/` - List all reports
- `POST /api/reports/` - Create a new report
- `GET /api/reports/{id}/` - Get report details
- `GET /api/hotspots/` - List all hotspots
- `GET /api/hotspots/{id}/` - Get hotspot details
- `GET /api/pois/?lat={lat}&lon={lon}&radius={radius}` - Get nearby POIs

## Project Structure

```
assignment_2AWM/
├── civicview/              # Django app
│   ├── models.py          # Report, Hotspot models
│   ├── views.py           # API views (including POIs)
│   ├── serializers.py     # DRF serializers
│   ├── tasks.py           # Celery tasks (DBSCAN)
│   └── urls.py            # URL routing
├── civicview_project/     # Django project settings
│   ├── settings.py        # Configuration (GDAL/GEOS paths)
│   └── celery.py          # Celery configuration
├── frontend/              # React PWA
│   ├── public/
│   │   ├── manifest.json  # PWA manifest
│   │   └── sw.js          # Service worker
│   └── src/
│       ├── components/
│       │   ├── MapView.jsx    # Map with POI support
│       │   └── ReportForm.jsx # Form with geolocation
│       └── api.js         # API client (including POIs)
├── Dockerfile             # Production Docker image
├── docker-compose.yml     # Multi-service setup
├── requirements.txt       # Python dependencies
└── README_CA2.md         # This file
```

## Quick Reference

### Local Development
```bash
# Backend
conda activate civicview
python manage.py runserver

# Celery
celery -A civicview_project worker -l info

# Frontend
cd frontend && npm run dev
```

### Docker
```bash
docker compose up --build
```

### Generate Hotspots
```bash
python manage.py generate_hotspots
# or
docker compose exec web python manage.py generate_hotspots
```

### Test POI Endpoint
```bash
curl "http://localhost:8000/api/pois/?lat=53.3498&lon=-6.2603&radius=1000"
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Django/Celery logs
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

---

**Note**: This is a CA2 assignment copy. The original FYP prototype remains untouched in its own folder.


