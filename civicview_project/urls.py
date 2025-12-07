"""
URL configuration for civicview_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

# Simple root view
def root_view(request):
    return JsonResponse({
        "message": "Civic View API",
        "endpoints": {
            "api_root": "/api/",
            "reports": "/api/reports/",
            "hotspots": "/api/hotspots/",
            "pois": "/api/pois/",
            "admin": "/admin/"
        }
    })

# Root URL configuration for the Django project
urlpatterns = [
    # Root URL - API information
    path('', root_view, name='root'),
    # Django admin interface at /admin/
    path('admin/', admin.site.urls),
    # Include all API endpoints from civicview app at /api/
    # This includes /api/reports/ and /api/hotspots/ endpoints
    path("api/", include("civicview.urls")),
]
