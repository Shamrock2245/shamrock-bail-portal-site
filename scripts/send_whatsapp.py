import os
import requests
import json
import sys

# Load environment variables (or hardcode for testing if needed, but ENV is better)
# In production, these should be set in your shell or .env file
WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")
PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
VERSION = "v20.0"

def send_template_message(to_number, template_name, language_code="en_US", components=None):
    """
    Sends a WhatsApp Template Message.
    
    Args:
        to_number (str): The recipient's phone number (E.164 format, e.g., '15551234567').
        template_name (str): The name of the approved template.
        language_code (str): The language code (default 'en_US').
        components (list): List of component dictionaries for parameters (optional).
    """
    if not WHATSAPP_TOKEN or not PHONE_NUMBER_ID:
        print("Error: WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set.")
        return None

    url = f"https://graph.facebook.com/{VERSION}/{PHONE_NUMBER_ID}/messages"
    
    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {
                "code": language_code
            }
        }
    }

    if components:
        payload["template"]["components"] = components

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status() # Raise error for bad status codes
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error sending message: {e}")
        if e.response is not None:
             print(f"Response: {e.response.text}")
        return None

def send_text_message(to_number, body_text):
    """
    Sends a free-form text message. 
    NOTE: This only works if the user has messaged YOU first within the last 24 hours (Customer Service Window).
    """
    if not WHATSAPP_TOKEN or not PHONE_NUMBER_ID:
        print("Error: WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set.")
        return None

    url = f"https://graph.facebook.com/{VERSION}/{PHONE_NUMBER_ID}/messages"
    
    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "text",
        "text": {
            "body": body_text
        }
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error sending message: {e}")
        if e.response is not None:
             print(f"Response: {e.response.text}")
        return None

if __name__ == "__main__":
    # Simple CLI for testing
    if len(sys.argv) < 3:
        print("Usage: python send_whatsapp.py <to_number> <message_or_template_name> [is_template=False]")
        sys.exit(1)

    to = sys.argv[1]
    content = sys.argv[2]
    is_template = len(sys.argv) > 3 and sys.argv[3].lower() == "true"

    if is_template:
        # Example usage for template (you would pass parameters differently in real usage)
        print(f"Sending template '{content}' to {to}...")
        res = send_template_message(to, content)
    else:
        print(f"Sending text '{content}' to {to}...")
        res = send_text_message(to, content)
    
    if res:
        print("Success:", json.dumps(res, indent=2))
