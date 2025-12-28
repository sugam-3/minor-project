# backend/api/management/commands/loadvehicles.py
import csv
import os
from django.core.management.base import BaseCommand
from api.models import Vehicle
from django.conf import settings
from decimal import Decimal

class Command(BaseCommand):
    help = "Load vehicles from CSV file"

    def handle(self, *args, **kwargs):
        csv_path = os.path.join(settings.BASE_DIR, "data", "vehicles.csv")

        if not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR(f"CSV file not found at {csv_path}"))
            return

        with open(csv_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)

            Vehicle.objects.all().delete()  # Clear old data

            for row in reader:
                try:
                    Vehicle.objects.create(
                        name=row["name"],
                        brand=row["brand"],
                        model=row["model"],
                        year=int(row["year"]),
                        vehicle_type=row["vehicle_type"],
                        fuel_type=row["fuel_type"],
                        price=Decimal(row["price"]),
                        description=row.get("description", ""),
                    )
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error creating vehicle: {row} -> {e}"))

        self.stdout.write(self.style.SUCCESS("Vehicle data loaded successfully"))
