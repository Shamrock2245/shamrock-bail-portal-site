import os
import csv
import json
import requests
from urllib.parse import urlparse

GSC_EXPORTS_DIR = os.path.expanduser("~/Desktop/gsc-exports")
OUTPUT_CSV = os.path.expanduser("~/Desktop/shamrock-bail-portal-site/wix_bulk_redirect_import.csv")
RAW_OUTPUT_JSON = os.path.expanduser("~/Desktop/shamrock-bail-portal-site/full_redirect_analysis.json")

# Extra URLs to process (the 404s the user specified)
EXTRA_URLS = [
    {"url": "https://www.shamrockbailbonds.biz/bail-online", "issue": "Not found (404)"},
    {"url": "https://www.shamrockbailbonds.biz/blank-4", "issue": "Not found (404)"}
]

def load_urls_from_drilldowns():
    url_data = []
    
    # Also add the extra ones first
    for ex in EXTRA_URLS:
        url_data.append(ex)
        
    for item in os.listdir(GSC_EXPORTS_DIR):
        if "Coverage-Drilldown" in item:
            folder_path = os.path.join(GSC_EXPORTS_DIR, item)
            metadata_path = os.path.join(folder_path, "Metadata.csv")
            table_path = os.path.join(folder_path, "Table.csv")
            
            if os.path.exists(metadata_path) and os.path.exists(table_path):
                # Get the Issue
                issue_type = "Unknown"
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    reader = csv.reader(f)
                    for row in reader:
                        if len(row) >= 2 and row[0] == "Issue":
                            issue_type = row[1]
                            break
                            
                # Get the URLs
                with open(table_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        if "URL" in row:
                            url = row["URL"].strip()
                            if url:
                                url_data.append({"url": url, "issue": issue_type})
    
    # Deduplicate by URL
    unique_urls = {}
    for item in url_data:
        if item["url"] not in unique_urls:
            unique_urls[item["url"]] = item["issue"]
            
    return [{"url": u, "issue": i} for u, i in unique_urls.items()]

def trace_redirects(url):
    chain = []
    current_url = url
    max_hops = 10
    final_status = None
    error = None

    for _ in range(max_hops):
        try:
            response = requests.get(current_url, allow_redirects=False, timeout=10)
            status = response.status_code
            
            if 300 <= status < 400 and 'Location' in response.headers:
                next_url = response.headers['Location']
                # Handle relative redirects
                if next_url.startswith('/'):
                    parsed_current = urlparse(current_url)
                    next_url = f"{parsed_current.scheme}://{parsed_current.netloc}{next_url}"
                    
                chain.append({
                    "url": current_url,
                    "status_code": status,
                    "target": next_url
                })
                current_url = next_url
            else:
                final_status = status
                break
        except requests.exceptions.RequestException as e:
            error = str(e)
            break

    return {
        "original_url": url,
        "chain": chain,
        "final_url": current_url,
        "final_status": final_status,
        "error": error
    }

def process_urls():
    urls_to_check = load_urls_from_drilldowns()
    print(f"Found {len(urls_to_check)} unique URLs to analyze.")
    
    results = []
    wix_import_rows = []
    
    for item in urls_to_check:
        url = item["url"]
        issue = item["issue"]
        print(f"Tracing {url} ({issue})...")
        
        trace_result = trace_redirects(url)
        trace_result["gsc_issue"] = issue
        results.append(trace_result)
        
        # Determine if we should add it to the Wix bulk redirect CSV
        # Wix Bulk Import requires two columns: Old URL, New URL
        # Old URL must be a relative path (e.g. /old-page)
        # New URL can be relative or absolute.
        # We only want to add it if:
        # 1. The URL has a path (not just the homepage root).
        # 2. It redirects to a final valid target OR it's a 404 that needs to go to the homepage.
        parsed = urlparse(url)
        old_path = parsed.path
        if parsed.query:
            old_path += f"?{parsed.query}"
            
        # We don't setup redirects for the root domain itself in the Wix bulk tool, 
        # Wix handles http->https and non-www->www at the DNS/host level automatically for the main domain connection.
        if old_path and old_path != "/":
            # Determine New URL
            new_target = ""
            
            if trace_result["final_status"] == 200:
                # Traced to a valid 200 page
                new_target = trace_result["final_url"]
            elif "404" in issue or trace_result["final_status"] == 404:
                # 404 pages route to homepage as a fallback
                new_target = "/"
                
            if new_target:
                # Add to import list
                wix_import_rows.append({"Old URL": old_path, "New URL": new_target})

    # Save raw JSON
    with open(RAW_OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
        
    # Save Wix Import CSV
    if wix_import_rows:
        # Wix specific format: no headers, or specific headers? 
        # According to Wix docs: "Old URL", "New URL" are the headers
        with open(OUTPUT_CSV, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=["Old URL", "New URL"])
            writer.writeheader()
            for row in wix_import_rows:
                writer.writerow(row)
                
    print(f"\\nAnalysis complete! Processed {len(results)} URLs.")
    print(f"Created Wix import CSV with {len(wix_import_rows)} rows: {OUTPUT_CSV}")
    print(f"Saved raw analysis JSON: {RAW_OUTPUT_JSON}")

if __name__ == "__main__":
    process_urls()
