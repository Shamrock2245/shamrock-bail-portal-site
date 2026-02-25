import json, urllib.request, ssl

try:
    with open('/Users/brendan/.clasprc.json', 'r') as f:
        data = json.load(f)
    access_token = data['tokens']['default']['access_token']
    
    script_id = "13r1v3I7jF34T8X7p3cR6a8F1w9o8M3q0W5" # Default placeholder, let's read it
    with open('/Users/brendan/Desktop/shamrock-bail-portal-site/backend-gas/.clasp.json', 'r') as f:
        clasp_data = json.load(f)
        script_id = clasp_data['scriptId']
       
    url = f"https://script.googleapis.com/v1/scripts/{script_id}:run"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    body = json.dumps({"function": "getTelegramToken"}).encode('utf-8')
    
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    with urllib.request.urlopen(req, context=ctx) as response:
        result = json.loads(response.read().decode('utf-8'))
        print("API Response:")
        print(json.dumps(result, indent=2))
        if 'response' in result and 'result' in result['response']:
            print("\n*** TOKEN FOUND ***")
            print(result['response']['result'])
            print("*******************")
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
