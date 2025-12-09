# Import standard library modules
import os
from pathlib import Path
# Import django-environ for environment variable management
import environ

# Base directory: Points to the project root (parent of settings.py directory)
# Used for constructing absolute paths to project files
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
# Allows configuration via .env file instead of hardcoding sensitive values
env = environ.Env(DEBUG=(bool, False))
ENV_FILE = BASE_DIR / ".env"
# Only load .env file if it exists (optional for production)
if ENV_FILE.exists():
    environ.Env.read_env(ENV_FILE)

# ------------------------------------------------------------
# Core Django Settings
# ------------------------------------------------------------

# Secret key for cryptographic signing (must be unique and secret in production)
# Used for session security, CSRF protection, etc.
SECRET_KEY = env("SECRET_KEY", default="unsafe-secret-key")
# Debug mode: Shows detailed error pages in development (set False in production)
DEBUG = env.bool("DEBUG", default=True)

# List of host/domain names this Django site can serve
# Prevents HTTP Host header attacks
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["127.0.0.1", "localhost"])

# Automatically add Railway domain in production
if not DEBUG:
    railway_domain = "lbsappcivicview-production.up.railway.app"
    if railway_domain not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(railway_domain)

# ------------------------------------------------------------
# Installed Apps
# ------------------------------------------------------------

# List of Django applications enabled for this project
INSTALLED_APPS = [
    # Django core apps
    "django.contrib.admin",  # Admin interface
    "django.contrib.auth",  # Authentication system
    "django.contrib.contenttypes",  # Content type framework
    "django.contrib.sessions",  # Session framework
    "django.contrib.messages",  # Messaging framework
    "django.contrib.staticfiles",  # Static file management

    # GeoDjango: Provides spatial database fields and geographic operations
    "django.contrib.gis",

    # Third-party apps
    "corsheaders",  # Handles Cross-Origin Resource Sharing (CORS) for React frontend
    "rest_framework",  # Django REST Framework for building REST APIs
    "rest_framework.authtoken",  # Token authentication for API

    # Your app: Main civic reporting application
    "civicview",
]

# ------------------------------------------------------------
# Middleware
# ------------------------------------------------------------

# Middleware classes: Process requests/responses in order (top to bottom)
# Each middleware can modify request/response or short-circuit processing
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # Must be first: Handles CORS headers for API
    "django.middleware.security.SecurityMiddleware",  # Security enhancements (HTTPS redirect, etc.)
    "django.contrib.sessions.middleware.SessionMiddleware",  # Manages sessions
    "django.middleware.common.CommonMiddleware",  # Common utilities (URL normalization, etc.)
    "django.middleware.csrf.CsrfViewMiddleware",  # CSRF protection for forms
    "django.contrib.auth.middleware.AuthenticationMiddleware",  # Associates users with requests
    "django.contrib.messages.middleware.MessageMiddleware",  # Handles temporary messages
    "django.middleware.clickjacking.XFrameOptionsMiddleware",  # Prevents clickjacking attacks
]

# Python path to the root URL configuration module
ROOT_URLCONF = "civicview_project.urls"

# ------------------------------------------------------------
# Templates
# ------------------------------------------------------------

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "civicview_project.wsgi.application"

# ------------------------------------------------------------
# Database (PostGIS)
# ------------------------------------------------------------

# Database configuration: Uses PostgreSQL with PostGIS extension
# PostGIS enables spatial data types (Point, Polygon) and geographic queries
DATABASES = {
    "default": {
        # PostGIS database backend (required for GeoDjango)
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        # Database name (must exist and have PostGIS extension enabled)
        "NAME": env("DATABASE_NAME"),
        # PostgreSQL username
        "USER": env("DATABASE_USER"),
        # PostgreSQL password
        "PASSWORD": env("DATABASE_PASSWORD"),
        # Database host (localhost for local development)
        "HOST": env("DATABASE_HOST", default="localhost"),
        # PostgreSQL port (default is 5432)
        "PORT": env("DATABASE_PORT", default="5432"),
    }
}

# ------------------------------------------------------------
# Password Validation
# ------------------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ------------------------------------------------------------
# Internationalisation
# ------------------------------------------------------------

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ------------------------------------------------------------
# Static Files
# ------------------------------------------------------------

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"  # Directory for collected static files (production)

# ------------------------------------------------------------
# REST Framework
# ------------------------------------------------------------

# Django REST Framework configuration
REST_FRAMEWORK = {
    # Response renderers: JSON for API clients, Browsable for browser testing
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",  # JSON output for API
        "rest_framework.renderers.BrowsableAPIRenderer",  # HTML interface for testing
    ],
    # Authentication: Token-based authentication
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    # Default permission: Require authentication (can be overridden per view)
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

# ------------------------------------------------------------
# CORS (React Frontend)
# ------------------------------------------------------------

# CORS configuration: Allows React frontend to make API requests
# Without this, browsers block cross-origin requests from React (port 3000) to Django (port 8000)
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=[
        "http://127.0.0.1:3000",  # React dev server (localhost)
        "http://localhost:3000",  # React dev server (alternative)
    ],
)

# Additional CORS settings for better mobile support
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# ------------------------------------------------------------
# Celery / Redis
# ------------------------------------------------------------

# Celery configuration: Enables asynchronous task processing
# Celery uses Redis as a message broker and result backend

# Redis URL for message broker: Where Celery sends tasks to be processed
CELERY_BROKER_URL = env(
    "CELERY_BROKER_URL",
    default=env("REDIS_URL", default="redis://localhost:6379/0"),
)

# Redis URL for result backend: Where Celery stores task results
CELERY_RESULT_BACKEND = env(
    "CELERY_RESULT_BACKEND",
    default=CELERY_BROKER_URL,  # Use same Redis instance for results
)

# Celery Beat configuration for periodic tasks
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    "generate-hotspots-every-5-minutes": {
        "task": "civicview.tasks.generate_hotspots",
        "schedule": 60.0,  # Run every 60 seconds (1 minute)
        # Alternative: Use crontab for more control
        # "schedule": crontab(minute="*/5"),  # Every 5 minutes
    },
}

# Timezone for Celery Beat (optional, but recommended)
CELERY_TIMEZONE = "UTC"

# ------------------------------------------------------------
# GeoDjango: GDAL + GEOS (Windows + Conda)
# ------------------------------------------------------------

# IMPORTANT — these paths must point exactly to your Conda environment
# GeoDjango requires GDAL and GEOS libraries for spatial operations
# On Windows, these paths must be explicitly set (Linux/macOS usually auto-detect)
# In Docker/Linux, these are typically found automatically via system libraries

# Try to use CONDA_PREFIX if available (for Conda environments)
# Otherwise fall back to hardcoded Windows path for local development
# In Docker/Linux, use environment variables or system library paths
CONDA_PREFIX = os.environ.get("CONDA_PREFIX")
DOCKER_ENV = os.environ.get("DOCKER_ENV", "false").lower() == "true"

# Better Docker detection: check multiple indicators (safer file reading)
IS_DOCKER = DOCKER_ENV or os.path.exists("/.dockerenv")

# Check cgroup file safely for Docker detection
if not IS_DOCKER and os.path.exists("/proc/self/cgroup"):
    try:
        with open("/proc/self/cgroup", "r") as f:
            IS_DOCKER = any("docker" in line for line in f)
    except (IOError, OSError):
        pass

if IS_DOCKER:
    # Docker/Linux environment: Use system libraries (set via environment or auto-detect)
    GDAL_LIBRARY_PATH = os.environ.get("GDAL_LIBRARY_PATH", "/usr/lib/x86_64-linux-gnu/libgdal.so")
    GEOS_LIBRARY_PATH = os.environ.get("GEOS_LIBRARY_PATH", "/usr/lib/x86_64-linux-gnu/libgeos_c.so")
elif CONDA_PREFIX:
    # Use CONDA_PREFIX to construct paths dynamically (Windows Conda)
    GDAL_LIBRARY_PATH = os.path.join(CONDA_PREFIX, "Library", "bin", "gdal.dll")
    GEOS_LIBRARY_PATH = os.path.join(CONDA_PREFIX, "Library", "bin", "geos_c.dll")
else:
    # Fallback to hardcoded Windows path (for local Windows dev)
    # Update this path to match your Conda installation if needed
    GDAL_LIBRARY_PATH = r"C:\Users\patri\miniconda3\envs\civicview\Library\bin\gdal.dll"
    GEOS_LIBRARY_PATH = r"C:\Users\patri\miniconda3\envs\civicview\Library\bin\geos_c.dll"

# Note: In Docker/Linux, these paths are typically auto-detected, but we set them
# explicitly for reliability. The paths above use standard Debian/Ubuntu locations.

# ------------------------------------------------------------
# Default primary key
# ------------------------------------------------------------

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
