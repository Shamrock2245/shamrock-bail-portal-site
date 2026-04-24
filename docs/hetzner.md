# Hetzner Cloud — Shamrock Scraper Infrastructure

> **Project**: Shamrock Leads (`shamrock-leads`)
> **Purpose**: VPS hosting for Dockerized arrest intelligence platform across 67 FL counties
> **CLI Context**: `shamrock` (authenticated via `hcloud context create shamrock`)

---

## Quick Reference

```bash
# See your servers
hcloud server list

# SSH into a server
hcloud server ssh <server-name>

# Create a new scraper box
hcloud server create --name scraper-01 \
  --type cpx21 \
  --image ubuntu-24.04 \
  --ssh-key brendan-mac \
  --location ash

# Snapshot before changes
hcloud server create-image --type snapshot --description "pre-deploy" <server-name>

# Stop / Start / Rebuild
hcloud server stop <server-name>
hcloud server start <server-name>
hcloud server rebuild --image ubuntu-24.04 <server-name>

# Delete (careful!)
hcloud server delete <server-name>
```

---

## Recommended Server Types

| Type | vCPUs | RAM | Disk | Price | Use Case |
|------|-------|-----|------|-------|----------|
| **CPX11** | 2 (AMD) | 2 GB | 40 GB | ~€4.85/mo | Single-county scraper |
| **CPX21** | 3 (AMD) | 4 GB | 80 GB | ~€8.49/mo | Multi-county fleet (recommended) |
| **CPX31** | 4 (AMD) | 8 GB | 160 GB | ~€15.49/mo | Full 67-county deployment |
| **CAX11** | 2 (ARM) | 4 GB | 40 GB | ~€3.79/mo | Budget ARM option |

> **Pick**: `cpx21` is the sweet spot — enough RAM for headless Chrome (2GB shm) + Docker overhead.

---

## Server Setup (Post-Create)

After `hcloud server create`, SSH in and run:

```bash
# 1. Update
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 3. Install Docker Compose
sudo apt install docker-compose-plugin -y

# 4. Clone the repo
git clone https://github.com/Shamrock2245/shamrock-leads.git
cd shamrock-leads

# 5. Configure env
cp .env.example .env
nano .env  # Add API keys, Google creds, Slack webhooks

# 6. Add Google service account
mkdir -p creds
# scp your service-account-key.json into creds/

# 7. Launch
docker compose up -d
docker compose logs -f
```

---

## Docker Compose Architecture

The scraper fleet uses a **dual-stack** Docker setup:

```
┌─────────────────────────────────────────────┐
│            docker-compose.yml               │
├─────────────────────┬───────────────────────┤
│  python-scrapers    │  node-scrapers        │
│  (always running)   │  (on-demand)          │
│                     │                       │
│  Charlotte          │  Collier (JS)         │
│  Collier            │  Charlotte (JS)       │
│  Hendry             │  DeSoto (JS)          │
│  Sarasota           │  Manatee (JS)         │
│  Manatee            │                       │
│  Palm Beach         │  Profile: "manual"    │
│  Hillsborough       │  (docker compose run) │
│                     │                       │
│  2GB shm_size       │  2GB shm_size         │
│  restart: unless-   │                       │
│           stopped   │                       │
└─────────────────────┴───────────────────────┘
           │                       │
     scraper-progress          (stateless)
     (persistent volume)
```

### Key Commands

```bash
# Start the 24/7 Python scheduler
docker compose up python-scrapers -d

# One-off Node.js scrape
docker compose run node-scrapers node index.js collier

# View logs
docker compose logs -f python-scrapers

# Restart after code update
docker compose down && docker compose up -d
```

---

## Python SDK — Programmatic Server Management

Install: `pip install hcloud`

### Basic Usage

```python
from hcloud import Client
from hcloud.images import Image
from hcloud.server_types import ServerType
from hcloud.ssh_keys import SSHKey

client = Client(token="YOUR_API_TOKEN")

# List all servers
for server in client.servers.get_all():
    print(f"{server.name} — {server.status} — {server.public_net.ipv4.ip}")

# Spin up a county-specific scraper box
response = client.servers.create(
    name="scraper-sarasota",
    server_type=ServerType(name="cpx21"),
    image=Image(name="ubuntu-24.04"),
    ssh_keys=[SSHKey(name="brendan-mac")],
    location="ash",  # Ashburn, VA (closest to FL)
    user_data="""#!/bin/bash
        curl -fsSL https://get.docker.com | sh
        usermod -aG docker root
        git clone https://github.com/Shamrock2245/shamrock-leads.git /opt/scrapers
        cd /opt/scrapers && docker compose up python-scrapers -d
    """,
)
print(f"Server {response.server.name} created — IP: {response.server.public_net.ipv4.ip}")

# Take a snapshot
image = client.servers.create_image(
    server=response.server,
    description="sarasota-working-baseline",
    type="snapshot"
)

# Tear down when done
client.servers.delete(server=response.server)
```

### Auto-Scaling Vision

```python
"""
Future: Node-RED or GitHub Actions triggers this to
auto-provision per-county scraper boxes on demand.
"""

COUNTIES_TO_SCRAPE = ["sarasota", "palm-beach", "hillsborough"]

for county in COUNTIES_TO_SCRAPE:
    response = client.servers.create(
        name=f"scraper-{county}",
        server_type=ServerType(name="cpx11"),  # Cheapest for single-county
        image=Image(name="ubuntu-24.04"),
        ssh_keys=[SSHKey(name="brendan-mac")],
        user_data=f"""#!/bin/bash
            curl -fsSL https://get.docker.com | sh
            git clone https://github.com/Shamrock2245/shamrock-leads.git /opt/scrapers
            cd /opt/scrapers
            docker compose run python-scrapers python counties/{county}/runner.py
            # Self-destruct after scrape completes (via API callback)
        """,
    )
    print(f"🚀 {county}: {response.server.public_net.ipv4.ip}")
```

---

## Firewall Rules

```bash
# Create firewall
hcloud firewall create --name scraper-firewall

# Allow SSH
hcloud firewall add-rule scraper-firewall \
  --direction in --protocol tcp --port 22 \
  --source-ips 0.0.0.0/0 --source-ips ::/0

# Apply to server
hcloud firewall apply-to-resource scraper-firewall \
  --type server --server scraper-01
```

> **Recommended rules**: Allow inbound SSH (22) only. Scrapers only need *outbound* access to jail sites, Google Sheets API, Slack webhooks, and MongoDB. All outbound is allowed by default.

---

## Snapshots & Backups

```bash
# Take a snapshot (free, manual)
hcloud server create-image --type snapshot --description "pre-deploy-$(date +%Y%m%d)" scraper-01

# List snapshots
hcloud image list --type snapshot

# Rebuild from snapshot
hcloud server rebuild --image <snapshot-id> scraper-01

# Enable automatic backups (~20% server cost)
hcloud server enable-backup scraper-01
```

> **Best practice**: Snapshot before every major deployment. Snapshots are cheap and let you rollback in seconds.

---

## Monitoring & SSH

```bash
# Quick SSH (uses your configured key)
hcloud server ssh scraper-01

# Check resource usage once inside
htop
docker stats
df -h

# Check scraper logs
cd /opt/scrapers
docker compose logs --tail 100 python-scrapers
```

---

## Self-Hosted GitHub Actions Runner

> **Runner Name**: `shamrock-hetzner`
> **Server**: `shamrock-scraper-vps` (`178.156.179.237`)
> **Labels**: `self-hosted`, `linux`, `x64`, `hetzner`
> **Installed**: 2026-03-14 | **Agent**: v2.332.0

### Service Management

```bash
# Check runner status
ssh root@178.156.179.237 'systemctl status actions.runner.Shamrock2245-shamrock-leads.shamrock-hetzner'

# Restart runner
ssh root@178.156.179.237 'cd /opt/actions-runner && ./svc.sh stop && ./svc.sh start'

# View runner logs
ssh root@178.156.179.237 'journalctl -u actions.runner.Shamrock2245-shamrock-leads.shamrock-hetzner -f'
```

### Installed Software (Pre-baked)

| Software | Version | Why |
|----------|---------|-----|
| Docker | 28.2.2 | Container orchestration |
| Docker Compose | 2.37.1 | Multi-service scraper fleet |
| Python | 3.12.3 | Scraper runtime |
| Node.js | 20.20.1 | JS scraper stacks |
| Google Chrome | 146 | Headless browser for scraping |
| xvfb | - | Virtual framebuffer for Chrome |

### Maintenance

```bash
# Update runner agent
ssh root@178.156.179.237 'cd /opt/actions-runner && ./svc.sh stop'
# Runner auto-updates on next job pickup, or manually:
ssh root@178.156.179.237 'cd /opt/actions-runner && su - runner -c "./config.sh --check"'
ssh root@178.156.179.237 'cd /opt/actions-runner && ./svc.sh start'

# Re-register after server rebuild (need new token from GitHub)
# 1. Generate token: gh api --method POST repos/Shamrock2245/shamrock-leads/actions/runners/registration-token --jq '.token'
# 2. SSH in and run:
#    su - runner -c 'cd /opt/actions-runner && ./config.sh --url https://github.com/Shamrock2245/shamrock-leads --token <TOKEN> --name shamrock-hetzner --labels self-hosted,linux,x64,hetzner --work _work --unattended --replace'
# 3. sudo ./svc.sh install runner && sudo ./svc.sh start

# Snapshot before major updates
hcloud server create-image --type snapshot --description "pre-update-$(date +%Y%m%d)" shamrock-scraper-vps
```

### Health Monitoring

The `runner_health.yml` workflow runs every 4 hours and alerts `#shamrock` Slack channel if the runner is unreachable. Trigger manually:

```
GitHub → Actions → Runner Health Check → Run workflow
```

---

## CLI Command Reference

| Command | Description |
|---------|-------------|
| `hcloud server list` | List all servers with IPs and status |
| `hcloud server create` | Create a new server |
| `hcloud server delete` | Delete a server |
| `hcloud server ssh` | SSH into a server |
| `hcloud server stop/start` | Power management |
| `hcloud server rebuild` | Reinstall OS or restore snapshot |
| `hcloud server create-image` | Take snapshot |
| `hcloud server enable-backup` | Enable auto-backups |
| `hcloud firewall list` | List firewalls |
| `hcloud firewall add-rule` | Add firewall rule |
| `hcloud ssh-key list` | List SSH keys |
| `hcloud image list` | List images and snapshots |
| `hcloud context list` | Show configured contexts |
| `hcloud context use <name>` | Switch between projects |

---

## Links

- **Hetzner Console**: [console.hetzner.com](https://console.hetzner.com)
- **Cloud Docs**: [docs.hetzner.com/cloud](https://docs.hetzner.com/cloud)
- **Cloud API**: [docs.hetzner.cloud](https://docs.hetzner.cloud)
- **CLI Repo**: [github.com/hetznercloud/cli](https://github.com/hetznercloud/cli)
- **Python SDK**: [github.com/hetznercloud/hcloud-python](https://github.com/hetznercloud/hcloud-python)
- **Python SDK Docs**: [hcloud-python.readthedocs.io](https://hcloud-python.readthedocs.io/en/stable/)
- **Runner Agent**: [github.com/actions/runner](https://github.com/actions/runner)
- **CLI Config**: `~/.config/hcloud/cli.toml`