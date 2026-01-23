/**
 * MCPServer.gs - Custom MCP Server for Shamrock Bail Bonds
 * 
 * Exposes GAS backend functions as MCP tools for Manus and other AI agent integration.
 * This server implements the Model Context Protocol (MCP) using the MCPApp library.
 * 
 * Library ID: 1TlX_L9COAriBlAYvrMLiRFQ5WVf1n0jChB6zHamq2TNwuSbVlI5sBUzh
 * 
 * Author: Shamrock Bail Bonds (Enhanced by Antigravity)
 * Date: December 27, 2025
 */

/**
 * MCP Server entry point - handles all MCP requests from Manus.
 * 
 * @param {Object} e - The event object from the doPost trigger.
 * @return {TextOutput} The structured JSON-RPC response.
 */
function routeMcpRequest(e) {
  // 1. Basic Request Validation
  if (!e || !e.postData || !e.postData.contents) {
    console.error("MCP Error: Missing postData in request");
    return ContentService.createTextOutput(JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32600, message: "Invalid Request: Missing body" },
      id: null
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 2. Validate API Key Existence early (Fail fast)
  const apiKey = PropertiesService.getScriptProperties().getProperty('MCP_API_KEY');
  if (!apiKey) {
    console.error("MCP Configuration Error: MCP_API_KEY not set in Script Properties");
    return ContentService.createTextOutput(JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Server Configuration Error: API Key not configured" },
      id: null
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 3. Construct the Server Object for the Library
  const object = {
    eventObject: e,
    serverResponse: getMCPServerResponse_(),
    functions: getMCPFunctions_()
  };
  
  // 4. Delegate to MCPApp Library
  // The library handles JSON parsing, JSON-RPC validation, and routing.
  return new MCPApp.mcpApp({ 
    accessKey: apiKey 
  }).server(object);
}

/**
 * Define MCP server capabilities, metadata, and available tools.
 * This function returns the schema definition for the server.
 * 
 * @return {Object} The capabilities object describing the server and its tools.
 */
function getMCPServerResponse_() {
  return {
    initialize: {
      jsonrpc: "2.0",
      result: {
        protocolVersion: "2025-03-26", // Use current/compatible protocol version
        capabilities: {
          experimental: {},
          prompts: { listChanged: false },
          resources: { subscribe: false, listChanged: false },
          tools: { listChanged: false }
        },
        serverInfo: {
          name: "Shamrock Bail Bonds Automation Server",
          version: "1.0.0"
        }
      }
    },
    
    // Tools Definition
    "tools/list": {
      jsonrpc: "2.0",
      result: {
        tools: [
          {
            name: "create_and_send_packet",
            description: "Creates a bail bond document packet and sends it for signing via SignNow. Requires defendant information and optional indemnitor details.",
            inputSchema: {
              type: "object",
              properties: {
                defendant_first_name: { type: "string", description: "Defendant's first name" },
                defendant_last_name: { type: "string", description: "Defendant's last name" },
                defendant_dob: { type: "string", description: "Defendant's date of birth (YYYY-MM-DD)" },
                defendant_booking_number: { type: "string", description: "Booking number from arrest record" },
                defendant_email: { type: "string", description: "Defendant's email address" },
                indemnitor_emails: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Array of indemnitor email addresses" 
                },
                charges: {
                  type: "array",
                  items: { type: "object" },
                  description: "Array of charge objects with description, bond amount, etc."
                },
                signing_method: {
                  type: "string",
                  enum: ["email", "kiosk"],
                  description: "Signing method: 'email' for remote or 'kiosk' for in-office"
                }
              },
              required: ["defendant_first_name", "defendant_last_name", "defendant_booking_number"],
              additionalProperties: false
            }
          },
          {
            name: "check_document_status",
            description: "Checks the signing status of a document in SignNow by document ID.",
            inputSchema: {
              type: "object",
              properties: {
                document_id: { type: "string", description: "SignNow document ID" }
              },
              required: ["document_id"],
              additionalProperties: false
            }
          },
          {
            name: "process_court_emails",
            description: "Processes new court date and forfeiture emails from Gmail, creates calendar events, and posts to Slack.",
            inputSchema: {
              type: "object",
              properties: {
                lookback_days: { 
                  type: "number", 
                  description: "Number of days to look back for emails (default: 30)" 
                }
              },
              additionalProperties: false
            }
          },
          {
            name: "run_lead_scoring",
            description: "Runs lead scoring and qualification routing for all county arrest records. Routes qualified leads to the 'Qualified' tab.",
            inputSchema: {
              type: "object",
              properties: {
                county: { 
                  type: "string", 
                  enum: ["LEE", "COLLIER", "CHARLOTTE", "HENDRY", "SARASOTA", "DESOTO", "MANATEE"], 
                  description: "Specific county to score (optional, defaults to all counties). Case insensitive." 
                }
              },
              additionalProperties: false
            }
          },
          {
            name: "get_case_details",
            description: "Retrieves detailed information about a specific case from Google Sheets by booking number.",
            inputSchema: {
              type: "object",
              properties: {
                booking_number: { type: "string", description: "Booking number to search for" },
                county: { 
                  type: "string", 
                  description: "County name (optional, searches all if not specified)" 
                }
              },
              required: ["booking_number"],
              additionalProperties: false
            }
          },
          {
            name: "notify_slack",
            description: "Sends a notification message to a specified Slack channel.",
            inputSchema: {
              type: "object",
              properties: {
                channel: { 
                  type: "string", 
                  enum: ["court-dates", "forfeitures", "new-cases", "general"],
                  description: "Slack channel to post to" 
                },
                message: { type: "string", description: "Message content" },
                defendant_name: { type: "string", description: "Defendant name (optional)" },
                case_number: { type: "string", description: "Case number (optional)" }
              },
              required: ["channel", "message"],
              additionalProperties: false
            }
          },
          {
            name: "run_county_scraper",
            description: "Runs the arrest record scraper logic (if implemented in GAS) or triggers external action.",
            inputSchema: {
              type: "object",
              properties: {
                county: { 
                  type: "string", 
                  enum: ["lee", "collier", "charlotte", "hendry", "sarasota", "desoto", "manatee"],
                  description: "County to scrape" 
                }
              },
              required: ["county"],
              additionalProperties: false
            }
          },
          {
            name: "get_dashboard_stats",
            description: "Retrieves current dashboard statistics including total cases, SignNow launches, premium generated, etc.",
            inputSchema: {
              type: "object",
              properties: {
                date_range: { 
                  type: "string", 
                  enum: ["today", "week", "month", "all"],
                  description: "Time range for statistics" 
                }
              },
              additionalProperties: false
            }
          }
        ]
      }
    }
  };
}
