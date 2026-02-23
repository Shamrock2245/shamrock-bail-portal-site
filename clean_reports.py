import pandas as pd

input_file = '/Users/brendan/Desktop/shamrock-bail-portal-site/aggregated_bond_reports.csv'
output_file = '/Users/brendan/Desktop/shamrock-bail-portal-site/cleaned_bond_reports.csv'

df = pd.read_csv(input_file)

# Drop any completely empty rows
df.dropna(subset=['First Name', 'Last Name', 'Bond Date'], how='all', inplace=True)

# Filter out bad rows by checking for strings like "total" or numbers in names
def is_valid_name(val):
    if pd.isna(val):
        return False
    val = str(val).lower()
    if 'total' in val or 'void' in val or 'transfer' in val or val.isdigit() or val == '0':
        return False
    return True

df = df[df['First Name'].apply(is_valid_name) | df['Last Name'].apply(is_valid_name)]

# Ensure Date is valid and >= Jan 1 2012
df['Bond Date'] = pd.to_datetime(df['Bond Date'], errors='coerce')
df = df.dropna(subset=['Bond Date'])
df = df[df['Bond Date'] >= '2012-01-01']

# Reformat date
df['Bond Date'] = df['Bond Date'].dt.strftime('%Y-%m-%d')

# Ensure names are cleaned up (title case, strip whitespace)
df['First Name'] = df['First Name'].astype(str).str.strip().str.title().replace('Nan', '')
df['Last Name'] = df['Last Name'].astype(str).str.strip().str.title().replace('Nan', '')

# Drop duplicates based on names and date just in case same report was parsed twice
# Or maybe best by Power Number if it's there
df.drop_duplicates(subset=['First Name', 'Last Name', 'Bond Date', 'Power Number'], inplace=True)

df.to_csv(output_file, index=False)

print(f"Cleaned data saved to {output_file}. Rows remaining: {len(df)}")
print(df.head(10))
