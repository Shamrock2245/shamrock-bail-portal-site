---
name: SignNow API Helper
description: AI-powered development guide for SignNow API, providing access to official documentation and code generation.
---

# SignNow API Helper MCP

The SignNow API Helper MCP is an AI-powered development guide. It gives your AI agent instant access to the official SignNow documentation, allowing it to write accurate code and answer technical questions for you.

## Prerequisites

-   **Python 3.11+**
-   **uv** (recommended: `pip install uv`)
-   An **MCP-compatible client** (Cursor, VS Code with Cline, or Claude Desktop).

## Installation & Configuration

To use this skill, ensure the MCP server is configured in your client settings.

### MCP Server Config Payload

```json
{
  "mcpServers": {
    "signnow-api-helper": {
      "command": "uvx",
      "args": [
        "sn-api-helper-mcp"
      ]
    }
  }
}
```

### Quick Run
You can also run it directly for testing:
`uvx sn-api-helper-mcp`

## Capabilities

This skill enables the agent to:
-   Find specific API endpoints and parameters.
-   Debug errors by referencing official error codes and solutions.
-   Generate code samples in various languages (Python, Node.js, etc.).
-   Explain complex flows like authentication and embedded signing.

## Example Prompts

When using this skill, you can ask questions like:

-   "Show me the parameters for the SignNow 'Create Invite' endpoint."
-   "What is the correct API endpoint to download a signed document?"
-   "Explain the authentication flow for SignNow."
-   "Write a Python script to upload a document and send it for signing."
-   "Give me a curl command to check the status of a document."
-   "How do I handle the invalid_token error in my Node.js app?"
