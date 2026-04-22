---
name: MCP Manager
description: Dynamically manage MCP server limits by toggling disabled states in mcp_config.json. Use when hitting the 100-tool limit, or when needing a specific MCP server that is currently disabled.
---

# MCP Manager (Dynamic Server Swapping)

## The Problem
The agent ecosystem relies on many Model Context Protocol (MCP) servers, each exposing multiple tools. AI LLMs have a hard limit of **100 tools per context window**. When the combined tool count from all active MCP servers exceeds 100, the context rejects the overflow tools, meaning some servers silently fail to load.

## The Solution
You must dynamically manage the user's `mcp_config.json` file to keep the total tool count under 100. If you need an MCP server that is currently inactive, or if you notice tools missing, follow this workflow to "flip the switch."

### Workflow: How to Toggle MCP Servers

1. **Locate the Config**
   Read the user's MCP configuration file located at: `/Users/brendan/.gemini/antigravity/mcp_config.json`

2. **Identify the Target & The Bloat**
   - **Target**: The server you need to use for the current task (e.g., `wix-mcp-remote`, `github-mcp-server`, `signnow`).
   - **Bloat**: Servers currently active but unnecessary for the current task. `chrome-devtools-mcp` is a primary target for disabling because it adds over 25 tools alone.

3. **Edit the JSON File**
   Use your file editing tools (`multi_replace_file_content` or `replace_file_content`) to toggle the `"disabled": true` flag on or off.
   - To disable an unnecessary server: Add `"disabled": true` to its block.
   - To enable the target server: Remove `"disabled": true` from its block or set it to `"disabled": false`.

4. **Prompt for Context Refresh**
   MCP tools are only injected at the start of a turn. Once you save the file, you **MUST** ask the user to respond (e.g., "I've swapped the MCP servers. Please reply with 'go ahead' to refresh my context.") before you attempt to use the newly enabled tools.

### Example Replacement
When disabling a server, your edit should look like this:
```json
    "chrome-devtools-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest"
      ],
      "disabled": true
    }
```

### When to Trigger This Skill
- You receive an error about missing tools for a known MCP server.
- You need to perform a specific action (like deploying to Wix, signing with SignNow, or automating a browser) but lack the tool in your schema.
- The user explicitly asks to connect or use a specific service that relies on an MCP server.
