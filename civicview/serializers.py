# Import JSON for parsing GeoJSON geometry data
import json

# Import GeoDjango Point class for creating spatial geometries
from django.contrib.gis.geos import Point
# Import Django REST Framework serializers
from rest_framework import serializers

from .models import Hotspot, Report


# ReportSerializer: Converts Report model instances to/from JSON for API
# Handles conversion between lat/lng (user-friendly) and PostGIS Point geometry
class ReportSerializer(serializers.ModelSerializer):
    # Accept latitude/longitude as separate fields when creating reports (write-only)
    # This is more user-friendly than requiring GeoJSON format
    latitude = serializers.FloatField(write_only=True)
    longitude = serializers.FloatField(write_only=True)
    # Return geometry as GeoJSON when reading (read-only, computed field)
    geom = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Report
        # All fields exposed in the API
        fields = [
            "id",
            "title",
            "description",
            "category",
            "latitude",
            "longitude",
            "geom",
            "created_at",
        ]
        # These fields are auto-generated and cannot be modified via API
        read_only_fields = ["id", "geom", "created_at"]

    # Custom create method: Converts lat/lng to PostGIS Point geometry
    def create(self, validated_data):
        # Extract latitude and longitude from the request data
        lat = validated_data.pop("latitude")
        lon = validated_data.pop("longitude")
        # Create a Point geometry (longitude first, then latitude, WGS84 SRID)
        geom = Point(lon, lat, srid=4326)
        # Create and save the Report instance with the geometry
        return Report.objects.create(geom=geom, **validated_data)

    # Convert PostGIS geometry to GeoJSON format for API responses
    def get_geom(self, obj):
        # obj.geom.geojson returns a GeoJSON string, parse it to a Python dict
        return json.loads(obj.geom.geojson)


# HotspotSerializer: Converts Hotspot model instances to/from JSON for API
# Provides read-only access to hotspot cluster data
class HotspotSerializer(serializers.ModelSerializer):
    # Return geometry as GeoJSON when reading (read-only, computed field)
    geom = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Hotspot
        # Fields exposed in the API
        fields = ["id", "cluster_id", "geom", "created_at"]
        # These fields are auto-generated and cannot be modified via API
        read_only_fields = ["id", "geom", "created_at"]

    # Convert PostGIS geometry to GeoJSON format for API responses
    def get_geom(self, obj):
        # obj.geom.geojson returns a GeoJSON string, parse it to a Python dict
        return json.loads(obj.geom.geojson)

