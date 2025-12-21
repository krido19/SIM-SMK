const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const axios = require('axios');

const app = express();
app.use(cors());

// Function to find ALL Antigravity-related processes
const findAntigravityProcesses = async () => {
    const runPs = (cmd) => new Promise((res) => {
        exec(cmd, { maxBuffer: 1024 * 1024 * 5 }, (err, stdout, stderr) => {
            if (err) return res('');
            res(stdout);
        });
    });

    console.log("Scanning for Antigravity/Code processes...");
    const command = `powershell -Command "Get-CimInstance Win32_Process | Where-Object {$_.Name -like '*Antigravity*' -or $_.Name -like '*Code*' -or $_.Name -like '*Electron*'} | Select-Object -Property ProcessId, CommandLine, Name | ConvertTo-Json -Depth 1"`;

    const stdout = await runPs(command);

    if (!stdout || stdout.trim() === '') return [];

    try {
        let processes = JSON.parse(stdout);
        if (!Array.isArray(processes)) processes = [processes];

        const candidates = [];

        for (const proc of processes) {
            const cmd = (proc.CommandLine || "").toLowerCase();
            const name = (proc.Name || "").toLowerCase();

            // Filter out our own tools
            if (cmd.includes('server.js') || name.includes('powershell') || name.includes('cmd.exe')) {
                continue;
            }

            candidates.push({ pid: proc.ProcessId, cmd: proc.CommandLine, name: proc.Name });
        }

        return candidates;
    } catch (e) {
        console.error("Parse error", e);
        return [];
    }
};

const getListeningPorts = (pid) => {
    return new Promise((resolve) => {
        exec(`netstat -ano | findstr ${pid}`, (err, stdout) => {
            if (err) return resolve([]);

            const ports = new Set();
            const lines = stdout.split('\n');
            lines.forEach(line => {
                if (line.includes('LISTENING')) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 2) {
                        const localAddr = parts[1];
                        const lastColon = localAddr.lastIndexOf(':');
                        if (lastColon !== -1) {
                            const port = localAddr.substring(lastColon + 1);
                            if (port && !isNaN(port)) ports.add(port);
                        }
                    }
                }
            });
            resolve(Array.from(ports));
        });
    });
};

const tryFetchStatus = async (port) => {
    const url = `http://127.0.0.1:${port}/GetUserStatus`;
    console.log(`Trying ${url}...`);
    try {
        const res = await axios.get(url, { timeout: 1000 });
        console.log(`SUCCESS: ${url} returned ${res.status}`);
        return res.data;
    } catch (e) {
        if (e.response) {
            console.log(`FAILED ${url}: Status ${e.response.status} - ${JSON.stringify(e.response.data)}`);
        } else {
            console.log(`FAILED ${url}: ${e.message}`);
        }
        return null;
    }
};

const fs = require('fs');
const path = require('path');

app.get('/api/quota', async (req, res) => {
    try {
        const candidates = await findAntigravityProcesses();
        const debugData = { candidates: [] };

        console.log(`Checking ${candidates.length} candidate processes...`);

        // Check ALL candidates
        for (const proc of candidates) {
            const ports = await getListeningPorts(proc.pid);
            const entry = { pid: proc.pid, name: proc.name, cmd: proc.cmd, ports, apiChecks: [] };

            console.log(`Inspecting Process PID ${proc.pid}: ${proc.name}`);
            console.log(`Command Line: ${proc.cmd}`); // Log full command line to find tokens

            if (ports.length > 0) {
                console.log(`PID ${proc.pid} has ports: ${ports.join(', ')}`);
                for (const port of ports) {
                    const data = await tryFetchStatus(port);
                    entry.apiChecks.push({ port, status: data ? 'success' : 'failed' });

                    if (data) {
                        return res.json({
                            source: 'local-api',
                            port,
                            data
                        });
                    }
                }
            } else {
                console.log(`PID ${proc.pid} has no listening ports.`);
            }
            debugData.candidates.push(entry);
        }

        // Write debug file
        fs.writeFileSync('debug_dump.json', JSON.stringify(debugData, null, 2));
        console.log("Wrote debug logs to debug_dump.json");

        res.status(404).json({ error: 'Connection failed. Debug log written to debug_dump.json' });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
