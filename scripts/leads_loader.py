import requests
import json
import os

# Configuration
API_URL = "https://www.shamrockbailbonds.biz/_functions/outreachLeads"
API_KEY = os.environ.get("GAS_API_KEY") 

def get_outreach_leads():
    """
    Fetches leads from the Wix backend via http-functions.
    Expects GAS_API_KEY env var to be set.
    """
    if not API_KEY:
        print("Error: GAS_API_KEY environment variable not set.")
        return []

    try:
        response = requests.get(f"{API_URL}?apiKey={API_KEY}")
        response.raise_for_status()
        data = response.json()
        
        if data.get("success"):
            return data.get("leads", [])
        else:
            print(f"API Error: {data.get('message')}")
            return []
            
    except Exception as e:
        print(f"Failed to fetch leads: {e}")
        return []

if __name__ == "__main__":
    # Test run
    leads = get_outreach_leads()
    print(json.dumps(leads, indent=2))
