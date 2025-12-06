# Import Django admin for model registration
from django.contrib import admin
from .models import Report, Hotspot


# Register Report model in Django admin interface
# Provides web-based UI for viewing and managing civic reports
@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    # Columns displayed in the admin list view
    list_display = ("id", "title", "category", "created_at")
    # Filters available in the sidebar for quick filtering
    list_filter = ("category", "created_at")
    # Fields searchable via the admin search box
    search_fields = ("title", "description")


# Register Hotspot model in Django admin interface
# Provides web-based UI for viewing hotspot clusters
@admin.register(Hotspot)
class HotspotAdmin(admin.ModelAdmin):
    # Columns displayed in the admin list view
    list_display = ("id", "cluster_id", "created_at")
    # Filters available in the sidebar for quick filtering
    list_filter = ("cluster_id", "created_at")
