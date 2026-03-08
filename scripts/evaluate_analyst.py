import os
import csv
import imaplib
import email
import argparse
import time
from email.header import decode_header
import json
from openai import OpenAI
# Manual environment load to bypass dotenv issues
env_path = os.path.join(os.path.dirname(__file__), '.env_eval')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'): continue
            if '=' in line:
                key, val = line.split('=', 1)
                os.environ[key.strip()] = val.strip().strip('"').strip("'")

# Gmail IMAP settings
IMAP_SERVER = "imap.gmail.com"
EMAIL_ACCOUNT = os.environ.get("SHAMROCK_EMAIL")  # e.g., shamrockbailoffice@gmail.com
EMAIL_PASSWORD = os.environ.get("SHAMROCK_APP_PASSWORD")  # Gmail App Password

DATASET_PATH = "/tmp/historical_bonds.csv"

def connect_to_gmail():
    """Connects to Gmail via IMAP and returns the connection object."""
    if not EMAIL_ACCOUNT or not EMAIL_PASSWORD:
        print("❌ Error: SHAMROCK_EMAIL or SHAMROCK_APP_PASSWORD not found in .env")
        print("Please create an App Password in your Google Account security settings.")
        return None

    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER)
        mail.login(EMAIL_ACCOUNT, EMAIL_PASSWORD)
        print("✅ Successfully connected to Gmail.")
        return mail
    except Exception as e:
        print(f"❌ Failed to connect to Gmail: {e}")
        return None

def check_forfeiture(mail, first_name, last_name, power_number):
    """
    Searches the inbox for forfeiture/estreature notices related to the defendant.
    Returns True if a forfeiture is found, False otherwise.
    """
    if not mail:
        return False
        
    mail.select("inbox")
    
    # We look for keywords like "forfeiture", "estreature", "failure to appear", "FTA"
    # combined with the defendant's name or power number.
    # IMAP search strings can be tricky, so we'll start with a broad search for the name or power number
    # and then check the subjects/bodies for the keywords.
    
    # Clean up inputs
    first = first_name.strip()
    last = last_name.strip()
    power = power_number.strip()
    
    if not power and not (first and last):
        return False

    # Build search query. We will search for the first and last name in the body.
    search_query = f'(BODY "{first} {last}")'

    try:
        status, messages = mail.search(None, search_query)
        if status != "OK":
            return False
            
        message_numbers = messages[0].split()
        
        # If we found too many messages, it might just be routine correspondence.
        # We need to look for forfeiture keywords in these specific messages.
        forfeiture_keywords = ["forfeiture", "estreature", "failure to appear", "fta", "forfeit", "estreat", "judgement", "judgment"]
        
        for num in message_numbers:
            # Fetch the email subject and body
            status, msg_data = mail.fetch(num, "(RFC822)")
            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    
                    # Decode subject
                    subject, encoding = decode_header(msg["Subject"])[0]
                    if isinstance(subject, bytes):
                        # if it's a bytes object, decode to str
                        subject = subject.decode(encoding if encoding else "utf-8")
                        
                    subject = subject.lower()
                    
                    # Check subject for keywords
                    if any(keyword in subject for keyword in forfeiture_keywords):
                        return True
                        
                    # Alternatively, checking the body could be done here, 
                    # but subject is usually the strongest indicator for court notices.
                    
        return False
        
    except Exception as e:
        print(f"Error searching for {first} {last} ({power}): {e}")
        return False

def get_analyst_score(client, row):
    """Sends the test case to The Analyst via OpenAI API."""
    system_prompt = """
    You are a Senior Underwriter for a Bail Bonds agency in Florida.
    Your job is to analyze arrest records and applicant details to determine if a bond should be approved.

    **Business Rules (Pass / Review / Fail):**
    - FAIL (Score 0): Capital Offenses (Murder, Treason, Life Felonies, etc.). Do not write.
    - REVIEW (Score 50): History of FTA (Failure to Appear) or active fugitive/escape warrants. Requires a closer look by a human.
    - PASS (Score 100): Everything else. Unknown or sparse data (like missing employment or residency) is NORMAL and should NOT be penalized. Assume they are safe unless there is a strict negative indicator.

    **Task:**
    Analyze the provided JSON data.
    Output pure JSON with no markdown formatting:
    {
        "action": "Pass", // Can be "Pass", "Review", or "Fail"
        "rationale": "One short sentence explaining why.",
        "qualified": true // false only if action is Fail or Review
    }
    """

    # We map what little data we have from the CSV. The real system has more, but we pass what we have
    # Plus "Unknown" for the rest so the prompt has the expected structure.
    lead_data = {
        "charges": "Unknown (Historical data limits)", 
        "agency": "Unknown",
        "bond": row.get("Liability Amount", 0),
        "residency": "Unknown/Out of State", 
        "employment": "Unknown",
        "history": "Unknown (No FTA info provided)",
        "ties": "Unknown",
        "notes": f"Historical record for {row.get('First Name', '')} {row.get('Last Name', '')}"
    }

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(lead_data)}
            ],
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"❌ Error calling OpenAI: {e}")
        return None

def run_evaluations(sample_size=10):
    print("🚀 Starting Evaluation Pipeline for 'The Analyst'")
    
    # 0. Initialize OpenAI client
    openai_client = None
    if os.environ.get("OPENAI_API_KEY"):
        openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        print("✅ OpenAI client initialized.")
    else:
        print("⚠️ OPENAI_API_KEY not found in environment. AI scoring will be skipped.")
        print("Please add OPENAI_API_KEY=\"your-key\" to scripts/.env_eval to enable AI.")

    # 1. Connect to Gmail
    mail = connect_to_gmail()
    if not mail:
        print("Skipping Gmail forfeiture checks due to connection failure.")
        return

    # 2. Load Dataset
    if not os.path.exists(DATASET_PATH):
        print(f"❌ Dataset not found at {DATASET_PATH}. Please ensure it is downloaded.")
        return
        
    with open(DATASET_PATH, 'r') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        
    print(f"📊 Loaded {len(rows)} historical bond records.")
    
    # 3. Process a sample
    processed = 0
    forfeitures_found = 0
    
    # Confusion Matrix Metrics
    # True Positive: AI says High Risk, Ground Truth is Forfeiture
    # False Positive: AI says High Risk, Ground Truth is No Forfeiture
    # True Negative: AI says Low Risk, Ground Truth is No Forfeiture
    # False Negative: AI says Low Risk, Ground Truth is Forfeiture
    tp = 0
    fp = 0
    tn = 0
    fn = 0
    
    # We will sample randomly to get a better mix
    import random
    random.seed(42) # For reproducibility
    sample_rows = random.sample(rows, min(sample_size, len(rows)))
    
    for row in sample_rows:
        first = row.get('First Name', '')
        last = row.get('Last Name', '')
        power = row.get('Power Number', '')
        
        # We need a name to search
        if not first and not last:
            continue
            
        print(f"\nEvaluating: {first} {last} (Power: {power})")
        
        # -- Ground Truth Check --
        is_forfeiture = check_forfeiture(mail, first, last, power)
        
        if is_forfeiture:
            print("🚨 GROUND TRUTH: HIGH RISK (Forfeiture Found)")
            forfeitures_found += 1
        else:
            print("✅ GROUND TRUTH: LOW/MODERATE RISK (No Forfeiture Found)")
            
        # -- AI Evaluation Check --
        ai_risk_high = False
        if openai_client:
            print("🧠 Asking 'The Analyst' for a risk score...")
            ai_result = get_analyst_score(openai_client, row)
            if ai_result:
                action = ai_result.get('action', 'Pass')
                print(f"🤖 AI ACTION: {action}")
                print(f"🤖 RATIONALE: {ai_result.get('rationale')}")
                # Business Rule: If qualified is false, or action is Fail/Review, it's considered High Risk
                ai_risk_high = not ai_result.get('qualified', True) or action in ['Fail', 'Review']
        
        # Update Metrics
        if is_forfeiture and ai_risk_high:
            tp += 1
        elif not is_forfeiture and ai_risk_high:
            fp += 1
        elif not is_forfeiture and not ai_risk_high:
            tn += 1
        elif is_forfeiture and not ai_risk_high:
            fn += 1
            
        processed += 1
        
    print(f"\n🎉 Finished evaluating {processed} cases.")
    print(f"Found {forfeitures_found} historical forfeitures in this sample.")
    
    print("\n--- 📊 Evaluation Metrics ---")
    print(f"True Positives (Correctly identified risk): {tp}")
    print(f"False Positives (Flagged as risk, but no forfeiture): {fp}")
    print(f"True Negatives (Correctly identified safe): {tn}")
    print(f"False Negatives (Missed risk, resulted in forfeiture): {fn}")
    
    if (tp + fp) > 0:
        precision = tp / (tp + fp)
    else:
        precision = 0.0
        
    if (tp + fn) > 0:
        recall = tp / (tp + fn)
    else:
        recall = 0.0
        
    if processed > 0:
        accuracy = (tp + tn) / processed
    else:
        accuracy = 0.0
        
    print(f"\nAccuracy: {accuracy:.2f}")
    print(f"Precision: {precision:.2f}")
    print(f"Recall: {recall:.2f}")
    print("------------------------------\n")
    
    if mail:
        mail.logout()

if __name__ == "__main__":
    run_evaluations(sample_size=50)
