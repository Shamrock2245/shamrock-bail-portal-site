
import os
import requests
import json
from datetime import datetime

# Configuration
WIX_SITE_URL = "https://www.shamrockbailbonds.biz" # Adjust if needed
API_ENDPOINT = f"{WIX_SITE_URL}/_functions/outreachLeads"
BACKUP_FILE = "scripts/leads_data.json"

def fetch_leads_from_api(api_key):
    """
    Fetches leads from the Wix backend API.
    """
    try:
        url = f"{API_ENDPOINT}?apiKey={api_key}"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                return data.get("leads", [])
            else:
                print(f"API Error: {data.get('message')}")
                return None
        else:
            print(f"HTTP Error: {response.status_code}")
            return None

    except Exception as e:
        print(f"Connection Error: {e}")
        return None

def load_leads_from_file(filepath):
    """
    Loads leads from a local JSON file as fallback.
    """
    try:
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                return json.load(f)
        return []
    except Exception as e:
        print(f"File Load Error: {e}")
        return []

def get_outreach_leads():
    """
    Main function to get leads. Tries API first, then local file.
    """
    # 1. Try API
    api_key = os.environ.get("GAS_API_KEY") 
    # Note: In production you might want to fetch this from a secure place 
    # or pass it as an arg, but for now we assume it's in env or user provides it.
    
    leads = None
    if api_key:
        print("Fetching leads from API...")
        leads = fetch_leads_from_api(api_key)
    else:
        print("No GAS_API_KEY found in environment.")

    # 2. Fallback to local file
    if leads is None:
        print(f"Falling back to local file: {BACKUP_FILE}")
        leads = load_leads_from_file(BACKUP_FILE)
    
    return leads or []

if __name__ == "__main__":
    # Test run
    leads = get_outreach_leads()
    print(f"Loaded {len(leads)} leads.")
    if leads:
        print("Sample:", leads[0])
