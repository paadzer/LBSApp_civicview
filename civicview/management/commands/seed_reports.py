# Import Django management command base class
from django.core.management.base import BaseCommand
# Import GeoDjango geometry types
from django.contrib.gis.geos import Point
# Import random for adding variation to coordinates
import random
# Import the Report model
from civicview.models import Report


# Management command: Creates 50 sample reports around Dublin
# Usage: python manage.py seed_reports
class Command(BaseCommand):
    # Help text displayed when running: python manage.py help seed_reports
    help = "Create 50 sample reports around Dublin in groups of 5"

    # Main command handler: Executed when command is run
    def handle(self, *args, **options):
        # 10 locations around Dublin (each will have 5 reports)
        locations = [
            # City Centre
            {"lat": 53.3498, "lon": -6.2603, "area": "O'Connell Street"},
            {"lat": 53.3438, "lon": -6.2672, "area": "Temple Bar"},
            {"lat": 53.3456, "lon": -6.2594, "area": "Grafton Street"},
            {"lat": 53.3396, "lon": -6.2669, "area": "Dublin Castle"},
            {"lat": 53.3522, "lon": -6.2608, "area": "Parnell Square"},
            
            # North Dublin
            {"lat": 53.3654, "lon": -6.2603, "area": "Drumcondra"},
            {"lat": 53.3712, "lon": -6.2498, "area": "Glasnevin"},
            {"lat": 53.3589, "lon": -6.2387, "area": "Fairview"},
            
            # South Dublin
            {"lat": 53.3312, "lon": -6.2487, "area": "Rathmines"},
            {"lat": 53.3245, "lon": -6.2598, "area": "Rathgar"},
        ]

        # Report templates - will be used for each location
        report_templates = [
            {
                "title": "Graffiti",
                "description": "Graffiti in the lane behind {area}",
                "category": "Graffiti"
            },
            {
                "title": "Pothole",
                "description": "Large pothole on the road near {area}",
                "category": "Potholes"
            },
            {
                "title": "Broken Streetlight",
                "description": "Streetlight not working on the corner of {area}",
                "category": "Lighting"
            },
            {
                "title": "Overflowing Bin",
                "description": "Public bin overflowing near {area}",
                "category": "Waste"
            },
            {
                "title": "Damaged Footpath",
                "description": "Cracked footpath causing trip hazard at {area}",
                "category": "Infrastructure"
            }
        ]

        # Create 5 reports at each location (50 total)
        reports_created = 0
        for location in locations:
            # Add small random offset to each report in the group (within ~200m)
            offsets = [
                (0.000, 0.000),  # Center
                (0.0015, 0.0015),  # ~150m NE
                (-0.0015, 0.0015),  # ~150m NW
                (0.0015, -0.0015),  # ~150m SE
                (-0.0015, -0.0015),  # ~150m SW
            ]
            
            for i, template in enumerate(report_templates):
                offset_lat, offset_lon = offsets[i]
                # Add tiny random variation
                lat = location["lat"] + offset_lat + random.uniform(-0.0005, 0.0005)
                lon = location["lon"] + offset_lon + random.uniform(-0.0005, 0.0005)
                
                Report.objects.create(
                    title=template["title"],
                    description=template["description"].format(area=location["area"]),
                    category=template["category"],
                    geom=Point(lon, lat)  # Note: Point(longitude, latitude)
                )
                reports_created += 1
                self.stdout.write(f"Created: {template['title']} at {location['area']}")

        self.stdout.write(
            self.style.SUCCESS(f"\nSuccessfully created {reports_created} reports!")
        )

