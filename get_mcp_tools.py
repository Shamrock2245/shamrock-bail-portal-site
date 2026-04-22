import sys
import json
import subprocess

proc = subprocess.Popen(["npx", "-y", "@wix/mcp-remote", "https://mcp.wix.com/mcp"], stdin=subprocess.PIPE, stdout=subprocess.PIPE)

init_req = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {"name": "test", "version": "1.0"}
    }
}
proc.stdin.write(json.dumps(init_req).encode() + b'\n')
proc.stdin.flush()

out1 = proc.stdout.readline()
print("Init response:", out1.decode())

init_notif = {
    "jsonrpc": "2.0",
    "method": "notifications/initialized"
}
proc.stdin.write(json.dumps(init_notif).encode() + b'\n')
proc.stdin.flush()

list_req = {
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
}
proc.stdin.write(json.dumps(list_req).encode() + b'\n')
proc.stdin.flush()

out2 = proc.stdout.readline()
print("Tools list:", out2.decode())

proc.terminate()
