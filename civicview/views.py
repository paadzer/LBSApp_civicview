# Import standard library for HTTP requests and JSON parsing
import json
import urllib.parse
import urllib.request

# Import Django REST Framework viewsets and API views
from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Hotspot, Report
from .serializers import HotspotSerializer, ReportSerializer


# ReportViewSet: Provides full CRUD operations for civic reports
# Handles GET (list/detail), POST (create), PUT/PATCH (update), DELETE operations
class ReportViewSet(viewsets.ModelViewSet):
    # Query all reports, ordered by most recent first (descending by created_at)
    queryset = Report.objects.all().order_by("-created_at")
    # Serializer class that converts between JSON and Report model instances
    serializer_class = ReportSerializer


# HotspotViewSet: Provides read-only access to hotspot clusters
# Only supports GET operations (list and detail views) since hotspots are auto-generated
class HotspotViewSet(viewsets.ReadOnlyModelViewSet):
    # Query all hotspots, ordered by most recent first (descending by created_at)
    queryset = Hotspot.objects.all().order_by("-created_at")
    # Serializer class that converts between JSON and Hotspot model instances
    serializer_class = HotspotSerializer


# POI (Points of Interest) API endpoint using Overpass API
# Fetches nearby points of interest from OpenStreetMap
@api_view(["GET"])
def get_pois(request):
    """
    GET /api/pois/
    Query parameters:
    - lat: Latitude (required)
    - lon: Longitude (required)
    - radius: Search radius in metres (default: 500)
    - type: POI type filter, e.g., 'amenity=pub', 'tourism=hotel' (optional)
    
    Returns a list of POIs with name, type, and coordinates.
    """
    # Extract query parameters
    lat = request.query_params.get("lat")
    lon = request.query_params.get("lon")
    radius = request.query_params.get("radius", "500")  # Default 500 metres
    poi_type = request.query_params.get("type", "")  # Optional filter

    # Validate required parameters
    if not lat or not lon:
        return Response(
            {"error": "lat and lon parameters are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        lat = float(lat)
        lon = float(lon)
        radius = int(radius)
    except ValueError:
        return Response(
            {"error": "Invalid parameter format. lat/lon must be numbers, radius must be integer"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Limit radius to reasonable values (max 5km)
    if radius > 5000:
        radius = 5000
    if radius < 50:
        radius = 50

    # Build Overpass API query
    # Overpass QL query to find nodes (points) within radius
    # Filters for common POI tags: amenity, tourism, shop, etc.
    overpass_query = f"""
    [out:json][timeout:25];
    (
      node["amenity"](around:{radius},{lat},{lon});
      node["tourism"](around:{radius},{lat},{lon});
      node["shop"](around:{radius},{lat},{lon});
      node["leisure"](around:{radius},{lat},{lon});
      node["healthcare"](around:{radius},{lat},{lon});
    );
    out body;
    >;
    out skel qt;
    """

    # Apply type filter if provided (e.g., "amenity=pub")
    if poi_type and "=" in poi_type:
        key, value = poi_type.split("=", 1)
        overpass_query = f"""
        [out:json][timeout:25];
        (
          node["{key}"="{value}"](around:{radius},{lat},{lon});
        );
        out body;
        >;
        out skel qt;
        """

    try:
        # Make request to Overpass API
        overpass_url = "https://overpass-api.de/api/interpreter"
        data = overpass_query.encode("utf-8")
        req = urllib.request.Request(overpass_url, data=data, method="POST")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")

        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode("utf-8"))

        # Parse Overpass response and extract POI information
        pois = []
        if "elements" in result:
            for element in result["elements"]:
                if element.get("type") == "node" and "lat" in element and "lon" in element:
                    tags = element.get("tags", {})
                    # Extract name and type information
                    name = (
                        tags.get("name")
                        or tags.get("name:en")
                        or tags.get("alt_name")
                        or "Unnamed POI"
                    )
                    
                    # Determine POI type from tags
                    poi_type_str = "Unknown"
                    for key in ["amenity", "tourism", "shop", "leisure", "healthcare"]:
                        if key in tags:
                            poi_type_str = f"{key}: {tags[key]}"
                            break

                    # Only include POIs with meaningful names or types
                    if name != "Unnamed POI" or poi_type_str != "Unknown":
                        pois.append(
                            {
                                "name": name,
                                "type": poi_type_str,
                                "latitude": element["lat"],
                                "longitude": element["lon"],
                            }
                        )

        # Limit results to prevent overwhelming the frontend (max 100 POIs)
        pois = pois[:100]

        return Response({"pois": pois, "count": len(pois)})

    except urllib.error.URLError as e:
        return Response(
            {"error": f"Failed to connect to Overpass API: {str(e)}"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except json.JSONDecodeError:
        return Response(
            {"error": "Invalid response from Overpass API"},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    except Exception as e:
        return Response(
            {"error": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
