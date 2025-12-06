# Import Django management command base class
from django.core.management.base import BaseCommand

# Import the hotspot generation task function
from civicview.tasks import generate_hotspots


# Management command: Allows running hotspot generation from command line
# Usage: python manage.py generate_hotspots
class Command(BaseCommand):
    # Help text displayed when running: python manage.py help generate_hotspots
    help = "Generate hotspots from existing reports"

    # Main command handler: Executed when command is run
    def handle(self, *args, **options):
        # Call the hotspot generation function (runs synchronously, not via Celery)
        result = generate_hotspots()
        # Display success message with statistics (hotspots created, reports processed, etc.)
        self.stdout.write(self.style.SUCCESS(f"Hotspots generated: {result}"))


