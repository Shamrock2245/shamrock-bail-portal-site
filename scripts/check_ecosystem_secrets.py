#!/usr/bin/env python3
"""Thin wrapper: ecosystem secrets checklist lives in shamrock-leads."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

CANDIDATES = [
    Path(__file__).resolve().parents[2] / "shamrock-leads" / "scripts" / "check_ecosystem_secrets.py",
    Path.home()
    / "Desktop"
    / "shamrock-active-software"
    / "shamrock-leads"
    / "scripts"
    / "check_ecosystem_secrets.py",
]

for path in CANDIDATES:
    if path.is_file():
        raise SystemExit(
            subprocess.call([sys.executable, str(path), *sys.argv[1:]])
        )

print(
    "❌ Could not find shamrock-leads/scripts/check_ecosystem_secrets.py",
    file=sys.stderr,
)
sys.exit(2)
