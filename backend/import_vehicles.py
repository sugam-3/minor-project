import csv
from decimal import Decimal
import os
import django

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "vehicle_finance.settings")
django.setup()

from api.models import Vehicle

CSV_FILE = "data/vehicles.csv"

with open(CSV_FILE, newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        vehicle, created = Vehicle.objects.get_or_create(
            name=row['name'],
            brand=row['brand'],
            model=row['model'],
            year=int(row['year']),
            vehicle_type=row['vehicle_type'],
            fuel_type=row['fuel_type'],
            price=Decimal(row['price']),
            description=row.get('description', ''),
            is_available=True
        )
        if created:
            print(f"Added: {vehicle}")
        else:
            print(f"Skipped existing: {vehicle}")

print("Vehicle import completed!")
