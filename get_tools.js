const { spawn } = require('child_process');

const proc = spawn('npx', ['-y', '@wix/mcp-remote', 'https://mcp.wix.com/mcp']);

proc.stdout.on('data', (data) => {
    const messages = data.toString().trim().split('\n');
    for (const msg of messages) {
        if (!msg) continue;
        try {
            const json = JSON.parse(msg);
            if (json.id === 2) {
                console.log(JSON.stringify(json.result.tools.map(t => t.name), null, 2));
                process.exit(0);
            }
        } catch(e) {}
    }
});

proc.stderr.on('data', (data) => {
});

const initReq = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {name: "test", version: "1.0"}
    }
};

proc.stdin.write(JSON.stringify(initReq) + '\n');

setTimeout(() => {
    const listReq = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {}
    };
    proc.stdin.write(JSON.stringify({jsonrpc: "2.0", method: "notifications/initialized"}) + '\n');
    proc.stdin.write(JSON.stringify(listReq) + '\n');
}, 3000);
