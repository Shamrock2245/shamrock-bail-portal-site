import csv
import requests
import json
import sys

def trace_redirects(url):
    print(f"Tracing: {url}")
    session = requests.Session()
    session.max_redirects = 10
    
    try:
        response = session.get(url, allow_redirects=True, timeout=10)
        chain = []
        if response.history:
            for resp in response.history:
                chain.append({
                    "url": resp.url,
                    "status_code": resp.status_code,
                    "target": resp.headers.get('Location', '')
                })
        
        final_url = response.url
        final_status = response.status_code
        
        return {
            "original_url": url,
            "chain": chain,
            "final_url": final_url,
            "final_status": final_status,
            "error": None
        }
    except requests.exceptions.RequestException as e:
        return {
            "original_url": url,
            "chain": [],
            "final_url": None,
            "final_status": None,
            "error": str(e)
        }

def main():
    urls = [
        "http://shamrockbailbonds.biz/",
        "https://shamrockbailbonds.biz/",
        "https://www.shamrockbailbonds.biz/blank-3",
        "https://www.shamrockbailbonds.biz/blank",
        "http://www.shamrockbailbonds.biz/",
        "https://www.shamrockbailbonds.biz/home-1"
    ]
    
    results = []
    for url in urls:
        results.append(trace_redirects(url))
        
    with open('redirect_analysis.json', 'w') as f:
        json.dump(results, f, indent=2)
        
    print("Saved results to redirect_analysis.json")

if __name__ == "__main__":
    main()
