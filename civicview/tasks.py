# Import Celery decorator for async task execution
from celery import shared_task
# Import GeoDjango Polygon for storing hotspot boundaries
from django.contrib.gis.geos import Polygon
# Import Shapely for geometric operations (convex hull calculation)
from shapely.geometry import MultiPoint, Point as ShapelyPoint
# Import DBSCAN clustering algorithm from scikit-learn
from sklearn.cluster import DBSCAN

from .models import Hotspot, Report


# Main task: Generate hotspot clusters from existing reports using DBSCAN
# This can be run asynchronously via Celery or synchronously via management command
@shared_task
def generate_hotspots():
    # Get all reports from the database
    reports = Report.objects.all()
    # Early return if no reports exist
    if not reports.exists():
        return {"hotspots_created": 0, "total_reports": 0, "clusters_found": 0}

    # Extract coordinates from report geometries (longitude, latitude)
    coords = [(r.geom.x, r.geom.y) for r in reports]
    # Apply DBSCAN clustering algorithm
    # eps=0.01: Maximum distance between points to be in same cluster (~1km in degrees)
    # min_samples=2: Minimum number of reports needed to form a cluster
    clustering = DBSCAN(eps=0.01, min_samples=2).fit(coords)
    # Get cluster labels (-1 means noise/outlier, >=0 means cluster ID)
    labels = clustering.labels_

    # Delete all existing hotspots before generating new ones
    # This ensures hotspots reflect current report distribution
    Hotspot.objects.all().delete()

    # Group points by their cluster label
    clusters = {}
    for (x, y), label in zip(coords, labels):
        # Skip noise points (label -1) - these are isolated reports
        if label == -1:
            continue
        # Add point to its cluster group
        clusters.setdefault(label, []).append((x, y))

    # Create Hotspot records for each cluster
    created = 0
    for cluster_id, points in clusters.items():
        # Create polygon geometry from cluster points and save to database
        Hotspot.objects.create(cluster_id=cluster_id, geom=_as_polygon(points))
        created += 1

    # Return summary statistics
    return {
        "hotspots_created": created,
        "total_reports": len(coords),
        "clusters_found": len(clusters),
    }


# Helper function: Convert a list of points to a Polygon geometry
# Uses convex hull for clusters with 3+ points, bounding box for 2 points
def _as_polygon(points):
    # If less than 3 points, use bounding box (convex hull needs 3+ points)
    if len(points) < 3:
        return _bbox_polygon(points)

    # Create Shapely MultiPoint from coordinate list
    multipoint = MultiPoint([ShapelyPoint(p[0], p[1]) for p in points])
    # Calculate convex hull (smallest polygon containing all points)
    hull = multipoint.convex_hull
    # If hull is not a Polygon (e.g., it's a LineString), fall back to bounding box
    if hull.geom_type != "Polygon":
        return _bbox_polygon(points)

    # Convert Shapely Polygon to GeoDjango Polygon
    return Polygon(list(hull.exterior.coords))


# Helper function: Create a bounding box polygon from a list of points
# Used when there are only 2 points or convex hull fails
def _bbox_polygon(points):
    # Extract all x and y coordinates
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    # Find bounding box boundaries
    minx, maxx = min(xs), max(xs)
    miny, maxy = min(ys), max(ys)
    # Create rectangle coordinates (closed polygon: start and end at same point)
    coords = [
        (minx, miny),  # Bottom-left
        (minx, maxy),  # Top-left
        (maxx, maxy),  # Top-right
        (maxx, miny),  # Bottom-right
        (minx, miny),  # Close the polygon
    ]
    # Return GeoDjango Polygon
    return Polygon(coords)

