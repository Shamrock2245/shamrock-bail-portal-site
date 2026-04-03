import csv
import json

INPUT_CSV = '/Users/brendan/Desktop/shamrock-bail-portal-site/wix_bulk_redirect_import.csv'
OUTPUT_CSV = '/Users/brendan/Desktop/shamrock-bail-portal-site/wix_bulk_redirect_import_cleaned.csv'

rows_to_keep = []
with open(INPUT_CSV, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        old_url = row["Old URL"]
        # Skip Wix internal paths
        if old_url.startswith('/_api') or old_url.startswith('/_functions'):
            continue
        rows_to_keep.append(row)

with open(OUTPUT_CSV, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=["Old URL", "New URL"])
    writer.writeheader()
    for row in rows_to_keep:
        writer.writerow(row)
