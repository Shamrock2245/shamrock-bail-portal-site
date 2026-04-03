import os
import glob
import pandas as pd
import numpy as np

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

all_data = []

# Possible column names
first_name_cols = ['Defendant First Name', 'First Name', 'First', 'Defendant First']
last_name_cols = ['Defendant\'s Last Name', 'Last Name', 'Defendant Last Name', 'Last']
bond_date_cols = ['Bond Date', 'Date', 'Execution Date']
power_cols = ['Power #', 'Power Number', 'Power', 'Prefix & Power Number', 'Prefix & Power']
liability_cols = ['Bond Liability', 'Amount', 'Bond Amount', 'Liability', 'Penal Amount']
premium_cols = ['Gross Premium', 'Premium']

for file in matches:
    try:
        # Read file. Try to find header row dynamically.
        if file.endswith('.csv'):
            df = pd.read_csv(file, on_bad_lines='skip')
        else:
            df = pd.read_excel(file)
            
        header_row_idx = None
        # look for a row with 'Last Name' or 'Defendant' or 'Power'
        for i in range(min(10, len(df))):
            row_values = df.iloc[i].astype(str).str.lower().tolist()
            if any('name' in val or 'power' in val or 'bond' in val for val in row_values):
                header_row_idx = i
                break
                
        if header_row_idx is not None:
            # Re-read with correct header or just rename columns
            if file.endswith('.csv'):
                df = pd.read_csv(file, header=header_row_idx + 1, on_bad_lines='skip')
            else:
                df = pd.read_excel(file, header=header_row_idx + 1)
        
        # Normalize column names
        cols = {c: str(c).strip() for c in df.columns}
        df.rename(columns=cols, inplace=True)
        
        # Find matching columns
        def find_col(possible_names):
            for col in df.columns:
                if str(col).lower().strip() in [p.lower() for p in possible_names]:
                    return col
            return None

        fn_col = find_col(first_name_cols)
        ln_col = find_col(last_name_cols)
        bd_col = find_col(bond_date_cols)
        pw_col = find_col(power_cols)
        li_col = find_col(liability_cols)
        pr_col = find_col(premium_cols)

        if not fn_col and not ln_col:
            continue # no useful data

        # Extract useful data
        extracted = pd.DataFrame()
        extracted['First Name'] = df[fn_col] if fn_col else np.nan
        extracted['Last Name'] = df[ln_col] if ln_col else np.nan
        extracted['Bond Date'] = df[bd_col] if bd_col else np.nan
        extracted['Power Number'] = df[pw_col] if pw_col else np.nan
        extracted['Liability Amount'] = df[li_col] if li_col else np.nan
        extracted['Premium Amount'] = df[pr_col] if pr_col else np.nan
        extracted['Source File'] = os.path.basename(file)
        
        # Add to all data
        all_data.append(extracted)

    except Exception as e:
        print(f"Error reading {file}: {e}")

if all_data:
    final_df = pd.concat(all_data, ignore_index=True)
    # Clean up empty rows
    final_df.dropna(subset=['First Name', 'Last Name'], how='all', inplace=True)
    
    # Try to sort chronologically if we have dates
    try:
        final_df['Bond Date'] = pd.to_datetime(final_df['Bond Date'], errors='coerce')
        final_df = final_df.sort_values(by='Bond Date')
        # format date nicely back to string without time
        final_df['Bond Date'] = final_df['Bond Date'].dt.strftime('%Y-%m-%d')
    except:
        pass

    # Save to CSV
    output_path = '/Users/brendan/Desktop/shamrock-bail-portal-site/aggregated_bond_reports.csv'
    final_df.to_csv(output_path, index=False)
    print(f"Successfully aggregated {len(final_df)} rows of data from {len(all_data)} files into {output_path}")
    print(final_df.head())
else:
    print("No data extracted.")
