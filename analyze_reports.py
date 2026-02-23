import os
import json
import pandas as pd
from collections import defaultdict

target_dir = os.path.expanduser("~/")

patterns = ["*OSI*Bond*Report*", "*Palmetto*Report*", "*Universal*Bond*Report*", "*US*Fire*Bond*Report*", "*SCA*Bond*Report*", "*Shamrock*Bond*report*"]
patterns = [p.lower() for p in patterns]

matches = []
skip_dirs = { "Library/Caches", "Library/Containers", ".Trash", ".gemini", "node_modules", ".git" }

for root, dirs, files in os.walk(target_dir):
    dirs[:] = [d for d in dirs if not any(skip in os.path.join(root, d) for skip in skip_dirs)]
    for filename in files:
        name_lower = filename.lower()
        if not (name_lower.endswith(".xlsx") or name_lower.endswith(".xls") or name_lower.endswith(".csv")):
            continue
        for p in patterns:
            terms = [term for term in p.split("*") if term]
            if all(term in name_lower for term in terms):
                matches.append(os.path.join(root, filename))
                break

print(f"Total matching files found: {len(matches)}")

# Group files by the "type" of report based on filename
groups = defaultdict(list)
for match in matches:
    name_lower = os.path.basename(match).lower()
    if "osi" in name_lower: groups["OSI"].append(match)
    elif "palmetto" in name_lower: groups["Palmetto"].append(match)
    elif "universal" in name_lower: groups["Universal"].append(match)
    elif "us fire" in name_lower: groups["US Fire"].append(match)
    elif "sca" in name_lower: groups["SCA"].append(match)
    elif "shamrock" in name_lower: groups["Shamrock"].append(match)
    else: groups["Other"].append(match)

schemas = {}
for group_name, files in groups.items():
    if not files:
        continue
    # Pick the latest/largest file as a representative sample, or just the first few
    sample_files = files[:3]
    group_schemas = []
    for f in sample_files:
        try:
            if f.endswith(".csv"):
                df = pd.read_csv(f, nrows=10)
            else:
                # read excel. sometimes headers are not on row 0. We'll read first 20 rows to find it or just use default.
                df = pd.read_excel(f, nrows=10)
            group_schemas.append(list(df.columns))
        except Exception as e:
            group_schemas.append([f"Error: {e}"])
    
    schemas[group_name] = group_schemas

print("\n--- Schemas Found ---")
for group_name, s_list in schemas.items():
    print(f"\nGroup: {group_name} ({len(groups[group_name])} files total)")
    for i, s in enumerate(s_list):
        print(f" Sample {i+1} headers: {s[:15]}...") # print first 15 columns
