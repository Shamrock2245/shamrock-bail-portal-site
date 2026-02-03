---
name: SignNow MCP Server
description: Action-performing server for SignNow, enabling the agent to execute workflows like sending invites, checking document status, and listing templates.
---

# SignNow MCP Server

The SignNow MCP Server allows your AI assistant to securely interact with SignNow’s eSignature APIs. Unlike the API Helper (which provides information), this server **executes actions** directly.

## Prerequisites

-   **Python 3.11+**
-   **uv** (recommended: `pip install uv`)
-   An **MCP-compatible client** (Cursor, VS Code with Cline, or Claude Desktop).

## Installation & Configuration

> [!IMPORTANT]
> This server requires authentication credentials to be set in your MCP client's configuration. Do **not** hardcode these secrets in this file.

### MCP Server Config Payload

Add this to your client's MCP configuration file (e.g., `claude_desktop_config.json` or VS Code settings):

```json
{
  "mcpServers": {
    "signnow": {
      "command": "uvx",
      "args": [
        "--from",
        "signnow-mcp-server",
        "sn-mcp",
        "serve"
      ],
      "env": {
        "SIGNNOW_API_USERNAME": "your_account_email",
        "SIGNNOW_PASSWORD": "your_account_password",
        "SIGNNOW_API_BASIC_TOKEN": "your_basic_authorization_token"
      }
    }
  }
}
```

### Pre-deployed Server (Alternative)
If using a pre-deployed server:
-   **URL**: `https://mcp-server.signnow.com/mcp`

## Capabilities

This skill enables the agent to:
-   List templates and documents.
-   Send documents for signature (embedded or via email).
-   Check the status of documents.
-   Create signing links.

## Example Prompts

You can use prompts like:

-   "List all the templates in my SignNow account."
-   "Check the status of the 'NDA for Project Alpha' document."
-   "Send the 'Sales Contract' template to john.doe@example.com for signing."
-   "Generate a signing link for the 'Waiver Form' template."
