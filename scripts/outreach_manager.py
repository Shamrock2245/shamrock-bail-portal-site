import json
import os
import sys
import datetime
from send_whatsapp import send_template_message, send_text_message

# Configuration
TEMPLATES_FILE = "whatsapp_templates.json"
LOG_FILE = "contact_log.json"
LEADS_FILE = "leads.json" # Expected input format

def load_json(filepath):
    if not os.path.exists(filepath):
        return {}
    with open(filepath, 'r') as f:
        return json.load(f)

def save_json(filepath, data):
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

def log_contact(lead_id, status, details=None):
    log = load_json(LOG_FILE)
    if "interactions" not in log:
        log["interactions"] = []
    
    entry = {
        "timestamp": datetime.datetime.now().isoformat(),
        "lead_id": lead_id,
        "status": status,
        "details": details or {}
    }
    log["interactions"].append(entry)
    save_json(LOG_FILE, log)

def main():
    print("--- Shamrock Outreach Manager ---")
    
    # 1. Load Templates
    templates_data = load_json(TEMPLATES_FILE)
    templates = templates_data.get("templates", {})
    
    # 2. Load Leads (Mocking for now if file doesn't exist)
    leads = load_json(LEADS_FILE)
    if not leads:
        print(f"No leads found in {LEADS_FILE}. Creating a dummy lead for testing.")
        leads = [
            {
                "id": "test_001",
                "name": "Jane Doe",
                "phone": "15550001111", # Replace with real number for testing
                "defendant": "John Doe",
                "jail": "Pinellas County",
                "charges": "DUI"
            }
        ]
    
    # 3. Iterate
    for lead in leads:
        print(f"\n--------------------------------------------------")
        print(f"LEAD: {lead['name']} ({lead['phone']})")
        print(f"CASE: {lead['defendant']} @ {lead['jail']}")
        print(f"CHARGES: {lead['charges']}")
        
        # Select Template (Defaulting to 'cold_asset_verification')
        template_key = "cold_asset_verification"
        template = templates.get(template_key)
        
        if not template:
            print("Error: Default template not found.")
            continue

        # Prepare Template Params (Logic to map Lead Data -> Template Params)
        # Template: "Hi {{1}}, ... booking for {{2}} in {{3}}..."
        # Params: [Name, Defendant, Jail]
        params = [
            {"type": "text", "text": lead['name']},
            {"type": "text", "text": lead['defendant']},
            {"type": "text", "text": lead['jail']}
        ]
        
        preview_text = template.get("text_preview", "No preview available.")
        # Simple interpolation for preview (not perfect, just for display)
        preview_filled = preview_text.replace("{{1}}", lead['name']).replace("{{2}}", lead['defendant']).replace("{{3}}", lead['jail'])
        
        print(f"\n[PROPOSED MESSAGE ({template_key})]")
        print(f"\"{preview_filled}\"")
        
        while True:
            choice = input(f"\nAction for {lead['name']}? [S]end / [K]ip / [Q]uit: ").strip().lower()
            
            if choice == 's':
                print(f"Sending to {lead['phone']}...")
                # Call the sending logic
                res = send_template_message(
                    to_number=lead['phone'], 
                    template_name=template_key, 
                    components=[{
                        "type": "body",
                        "parameters": params
                    }]
                )
                
                if res:
                    print("✅ Sent successfully!")
                    log_contact(lead['id'], "sent", {"template": template_key})
                else:
                    print("❌ Failed to send.")
                    log_contact(lead['id'], "failed", {"error": "API Error"})
                break
            
            elif choice == 'k':
                print("Skipping...")
                log_contact(lead['id'], "skipped")
                break
            
            elif choice == 'q':
                print("Exiting.")
                return

            else:
                print("Invalid choice.")

if __name__ == "__main__":
    main()
