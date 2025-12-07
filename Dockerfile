# Multi-stage Dockerfile for Django + GeoDjango backend
# Stage 1: Build stage (if needed for compiling dependencies)
FROM python:3.11-slim as builder

# Install system dependencies needed for GeoDjango
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgdal-dev \
    gdal-bin \
    libgeos-dev \
    libproj-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for GeoDjango
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal

# Copy requirements file (if exists) or use pip install
WORKDIR /app

# Stage 2: Runtime stage
FROM python:3.11-slim

# Install runtime dependencies for GeoDjango
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for GeoDjango
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal
ENV GDAL_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu/libgdal.so
ENV GEOS_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu/libgeos_c.so

# Create working directory first
WORKDIR /app

# Create non-root user for security
RUN useradd -m -u 1000 appuser

# Copy requirements and install Python dependencies
# Create a requirements.txt if it doesn't exist
COPY requirements.txt* ./
RUN if [ -f requirements.txt ]; then \
        pip install --no-cache-dir -r requirements.txt; \
    else \
        pip install --no-cache-dir \
            django \
            djangorestframework \
            django-cors-headers \
            django-environ \
            psycopg2-binary \
            celery \
            redis \
            scikit-learn \
            shapely \
            gunicorn; \
    fi

# Copy application code
COPY . .

# Create staticfiles directory and set permissions
RUN mkdir -p /app/staticfiles && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Use a startup script that runs migrations, collectstatic, then gunicorn
CMD sh -c "python manage.py migrate && python manage.py collectstatic --noinput || true && PORT=\${PORT:-8000} && gunicorn civicview_project.wsgi:application --bind 0.0.0.0:\$PORT --workers 3 --timeout 120"
