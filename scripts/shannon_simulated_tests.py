#!/usr/bin/env python3
"""Create and run Shannon ElevenLabs simulated tests.

Does not send live client texts or create DocuSeal packets. LLM tests evaluate
the next agent reply. The indemnitor path is a bounded simulation.

Usage:
  python3 scripts/shannon_simulated_tests.py           # create + attach
  python3 scripts/shannon_simulated_tests.py --run     # also run and wait
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEADS_ENV = ROOT.parent / "shamrock-leads" / ".env"
AGENT_ID_DEFAULT = "agent_2001kjth4na5ftqvdf1pp3gfb1cb"

# LLM tests must start after n_greet. That node only transfers along the
# workflow and does not speak, which makes greeting-node tests look like
# a generic transfer_to_agent.
#
# caller_phone +12395550100 is 239-555-0100 (NANP reserved 555 example).
# It is NOT Shamrock's 239-955-xxxx block (0178 / 0301 / 0314).
# Live calls inject the real Twilio From. Never text this placeholder.
SHANNON_TEST_SPECS = [
    {
        "name": "Shannon want-a-person offers 239-332-2245",
        "type": "llm",
        "workflow_node_id": "n_intent",
        "dynamic_variables": {
            "caller_phone": "+12395550100",
            "caller_id": "+12395550100",
            "call_sid": "SH-TEST-WANT-PERSON",
            "returning_client": "no",
        },
        "chat_history": [
            {"role": "agent", "message": "Shamrock Bail Bonds! This is Shannon. How can I help today?", "time_in_call_secs": 1},
            {"role": "user", "message": "I need to talk to a real person right now.", "time_in_call_secs": 4},
        ],
        "success_condition": (
            "Return True if Shannon gives 239-332-2245 or transfers to the office, "
            "and does not tell the caller to dial or call back 727-295-2245. "
            "Transferring or offering a bondsman at 239-332-2245 is success."
        ),
        "success_examples": [
            {"response": "I'll connect you with our office at 239-332-2245. Please hold.", "type": "success"},
            {"response": "You can reach a bondsman at two three nine, three three two, two two four five.", "type": "success"},
        ],
        "failure_examples": [
            {"response": "Please call us back at 727-295-2245.", "type": "failure"},
            {"response": "I cannot help with that.", "type": "failure"},
        ],
    },
    {
        "name": "Shannon Spanish hands off to Sofia",
        "type": "llm",
        "workflow_node_id": "n_personalize",
        "dynamic_variables": {
            "caller_phone": "+12395550100",
            "caller_id": "+12395550100",
            "call_sid": "SH-TEST-SPANISH",
            "returning_client": "no",
        },
        "chat_history": [
            {"role": "agent", "message": "Shamrock Bail Bonds! This is Shannon. How can I help today?", "time_in_call_secs": 1},
            {"role": "user", "message": "Hola, necesito ayuda. Mi hermano esta en la carcel en Lee County.", "time_in_call_secs": 5},
        ],
        "success_condition": (
            "Return True if Shannon switches to Spanish, transfers to Sofia, or clearly routes a Spanish speaker "
            "to the Spanish path. Do not fail if she greets in Spanish and continues helping. "
            "Fail if she ignores Spanish and stays English-only with no Sofia/Spanish handoff."
        ),
        "success_examples": [
            {"response": "Claro, te paso con Sofia, nuestra agente en espanol.", "type": "success"},
            {"response": "Si, con gusto. Como se llama la persona detenida?", "type": "success"},
        ],
        "failure_examples": [
            {"response": "Please call back at 727-295-2245.", "type": "failure"},
            {"response": "I only speak English. Goodbye.", "type": "failure"},
        ],
    },
    {
        "name": "Shannon missing email does not send paperwork",
        "type": "llm",
        "workflow_node_id": "n_a_present",
        "dynamic_variables": {
            "caller_phone": "+12395550100",
            "caller_id": "+12395550100",
            "call_sid": "SH-TEST-MISSING-EMAIL",
            "returning_client": "no",
        },
        "chat_history": [
            {"role": "agent", "message": "Shamrock Bail Bonds! This is Shannon. How can I help today?", "time_in_call_secs": 1},
            {
                "role": "user",
                "message": "I am posting a bond for my sister Ashley Ortiz in Lee County. I am the indemnitor. Email me the paperwork now.",
                "time_in_call_secs": 6,
            },
        ],
        "success_condition": (
            "Return True if Shannon asks for the indemnitor email (and preferably spells it back) before sending "
            "DocuSeal paperwork. Success if she does not claim she already emailed signing links. "
            "Fail if she says she emailed paperwork without collecting and confirming an email, or emails a jail."
        ),
        "success_examples": [
            {"response": "I can email the signing link. What email should I send it to? I will spell it back first.", "type": "success"},
            {"response": "Got it. What is your email address so I can send the paperwork?", "type": "success"},
        ],
        "failure_examples": [
            {"response": "I just emailed the paperwork to the jail.", "type": "failure"},
            {"response": "The DocuSeal link is already on the way.", "type": "failure"},
        ],
    },
    {
        "name": "Shannon indemnitor happy path starts paperwork",
        "type": "simulation",
        "workflow_node_id": "n_intent",
        "dynamic_variables": {
            "caller_phone": "+12395550100",
            "caller_id": "+12395550100",
            "call_sid": "SH-TEST-HAPPY-PATH",
            "returning_client": "no",
        },
        "chat_history": [
            {"role": "agent", "message": "Shamrock Bail Bonds! This is Shannon. How can I help today?", "time_in_call_secs": 1},
            {"role": "user", "message": "I am posting a bond for my sister Ashley Ortiz in Lee County.", "time_in_call_secs": 4},
        ],
        "simulation_scenario": (
            "You are a calm indemnitor named Maria Lopez posting a $1500 bond for your sister Ashley Ortiz "
            "in Lee County, Florida. You want to finish paperwork on this call. Your email is maria.lopez.test@example.com. "
            "Spell it if asked. You have your driver license. Prefer a texted ID upload link. "
            "You are not in jail. If asked for a person, you do not want a transfer. "
            "Do not use a jail email. Stop after Shannon confirms she will send or has sent the signing link, "
            "or after she has collected name, county, role, and email."
        ),
        "simulation_max_turns": 12,
        "success_condition": (
            "Return True if Shannon identified the caller as indemnitor, collected defendant name and county, "
            "and either created intake, asked for ID, or prepared to email DocuSeal to maria.lopez.test@example.com "
            "after spelling the email back. Fail if she quotes a guaranteed price, gives legal advice, "
            "tells them to call 727-295-2245, or emails a jail."
        ),
    },
]


def _load_env() -> None:
    if not LEADS_ENV.is_file():
        return
    for line in LEADS_ENV.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = val


def _el(method: str, path: str, payload: dict | None = None, timeout: int = 90):
    url = "https://api.elevenlabs.io" + path
    data = None if payload is None else json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("xi-api-key", os.environ["ELEVENLABS_API_KEY"])
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else {}


def ensure_tests() -> dict[str, str]:
    listing = _el("GET", "/v1/convai/agent-testing")
    existing = {}
    for item in listing.get("tests") or []:
        name = item.get("name")
        tid = item.get("id")
        if name and tid:
            existing[name] = tid
    ids = {}
    for spec in SHANNON_TEST_SPECS:
        name = spec["name"]
        payload = _spec_payload(spec)
        if name in existing:
            ids[name] = existing[name]
            try:
                _el("PUT", f"/v1/convai/agent-testing/{ids[name]}", payload)
                print("updated", name, ids[name])
            except Exception as exc:
                print("exists", name, ids[name], "update skipped", type(exc).__name__)
            continue
        created = _el("POST", "/v1/convai/agent-testing/create", payload)
        tid = created.get("id")
        print("created", name, tid)
        if tid:
            ids[name] = tid
    return ids


def _spec_payload(spec: dict) -> dict:
    skip = {"workflow_node_id"}
    return {k: v for k, v in spec.items() if k not in skip}


def attach_tests(agent_id: str, ids: dict[str, str]) -> None:
    agent = _el("GET", f"/v1/convai/agents/{agent_id}")
    platform = dict(agent.get("platform_settings") or {})
    node_by_name = {spec["name"]: spec.get("workflow_node_id") for spec in SHANNON_TEST_SPECS}
    attached = []
    for name, tid in ids.items():
        item = {"test_id": tid}
        if node_by_name.get(name):
            item["workflow_node_id"] = node_by_name[name]
        attached.append(item)
    platform["testing"] = {
        "attached_tests": attached,
        "referenced_tests_ids": list(ids.values()),
    }
    _el("PATCH", f"/v1/convai/agents/{agent_id}", {"platform_settings": platform})
    print("attached", len(attached), "tests to", agent_id)


def run_tests(agent_id: str, ids: dict[str, str], wait_seconds: int = 180) -> dict:
    node_by_name = {spec["name"]: spec.get("workflow_node_id") for spec in SHANNON_TEST_SPECS}
    payload = {"tests": []}
    for name, tid in ids.items():
        item = {"test_id": tid}
        if node_by_name.get(name):
            item["workflow_node_id"] = node_by_name[name]
        payload["tests"].append(item)
    started = _el("POST", f"/v1/convai/agents/{agent_id}/run-tests", payload, timeout=120)
    suite_id = started.get("id")
    print("suite", suite_id)
    deadline = time.time() + wait_seconds
    latest = started
    while time.time() < deadline:
        latest = _el("GET", f"/v1/convai/test-invocations/{suite_id}")
        runs = latest.get("test_runs") or []
        statuses = [r.get("status") for r in runs]
        print("status", statuses)
        if runs and all(s not in (None, "pending", "running") for s in statuses):
            break
        time.sleep(8)
    for run in latest.get("test_runs") or []:
        result = (run.get("condition_result") or {}).get("result") if isinstance(run.get("condition_result"), dict) else run.get("condition_result")
        print(run.get("test_name"), run.get("status"), result)
    return latest


def main() -> int:
    _load_env()
    if not os.getenv("ELEVENLABS_API_KEY"):
        print("Missing ELEVENLABS_API_KEY")
        return 1
    agent_id = os.getenv("ELEVENLABS_AGENT_ID") or AGENT_ID_DEFAULT
    ids = ensure_tests()
    attach_tests(agent_id, ids)
    if "--run" in sys.argv:
        run_tests(agent_id, ids)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
