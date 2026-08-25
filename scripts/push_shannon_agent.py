#!/usr/bin/env python3
"""Push Shannon prompt, duration, and paperwork tools to ElevenLabs.

Reads ELEVENLABS_API_KEY / ELEVENLABS_AGENT_ID / ELEVENLABS_TOOL_SECRET
from the environment or shamrock-leads/.env. Does not print secrets.
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEADS_ENV = ROOT.parent / "shamrock-leads" / ".env"
GAS_EXEC = (
    "https://script.google.com/macros/s/"
    "AKfycbyCIDPzA_EA1B1SGsfhYiXRGKM8z61EgACZdDPILT_MjjXee0wSDEI0RRYthE0CvP-Z/exec"
)


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


def _extract_prompt() -> str:
    text = (ROOT / "backend-gas" / "ElevenLabs_AfterHoursAgent.js").read_text(encoding="utf-8")
    match = re.search(r"systemPrompt:\s*\[(.*?)\]\.join\('\\\\n'\)", text, re.S)
    if not match:
        match = re.search(r"systemPrompt:\s*\[(.*?)\]\.join\('\\n'\)", text, re.S)
    if not match:
        raise SystemExit("Could not extract systemPrompt from ElevenLabs_AfterHoursAgent.js")
    body = match.group(1)
    lines = re.findall(r'"((?:\\.|[^"\\])*)"', body)
    decoded = [bytes(line, "utf-8").decode("unicode_escape") for line in lines]
    return "\n".join(decoded)


def _el_request(method: str, path: str, payload: dict | None = None) -> dict:
    key = os.environ["ELEVENLABS_API_KEY"]
    url = "https://api.elevenlabs.io" + path
    data = None if payload is None else json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("xi-api-key", key)
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else {}


def _tool_url(tool: str) -> str:
    secret = os.environ.get("ELEVENLABS_TOOL_SECRET") or ""
    return f"{GAS_EXEC}?source=elevenlabs_tool&tool={tool}&secret={secret}"


def _prop(name: str, description: str, required: bool = False) -> dict:
    return {
        "type": "string",
        "description": description,
        "enum": None,
        "is_system_provided": False,
        "dynamic_variable": "",
        "is_omitted": False,
    }


def _webhook_tool(name: str, description: str, properties: dict, required: list[str]) -> dict:
    return {
        "type": "webhook",
        "name": name,
        "description": description,
        "response_timeout_secs": 25,
        "disable_interruptions": True,
        "force_pre_tool_speech": False,
        "api_schema": {
            "request_headers": {},
            "url": _tool_url(name),
            "method": "POST",
            "path_params_schema": {},
            "query_params_schema": None,
            "request_body_schema": {
                "type": "object",
                "description": description,
                "required": required,
                "properties": properties,
            },
        },
    }


def main() -> int:
    _load_env()
    if not os.getenv("ELEVENLABS_API_KEY") or not os.getenv("ELEVENLABS_AGENT_ID"):
        print("Missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID")
        return 1
    agent_id = os.environ["ELEVENLABS_AGENT_ID"]
    prompt = _extract_prompt()
    print(f"Prompt chars: {len(prompt)}")

    save_tool = _webhook_tool(
        "save_paperwork_answers",
        "Save a section of bond paperwork answers during the call. Call after every section. Reuse case_reference.",
        {
            "case_reference": _prop("case_reference", "Intake reference from create_intake"),
            "caller_role": _prop("caller_role", "defendant, indemnitor, or coindemnitor"),
            "caller_phone": _prop("caller_phone", "Caller phone from {{caller_phone}}"),
            "defendant_name": _prop("defendant_name", "Defendant full name"),
            "county": _prop("county", "Florida county"),
            "section": _prop("section", "Which section was just collected"),
            "indemnitor_name": _prop("indemnitor_name", "Indemnitor legal name"),
            "indemnitor_email": _prop("indemnitor_email", "Indemnitor email"),
            "indemnitor_phone": _prop("indemnitor_phone", "Indemnitor phone"),
            "notes": _prop("notes", "Freeform extras"),
        },
        ["caller_role"],
    )
    email_tool = _webhook_tool(
        "email_paperwork_to_indemnitor",
        "Email the indemnitor the DocuSeal signing link and SwipeSimple payment link. Use when you have indemnitor name, indemnitor email, and defendant name. Do not email the person in jail.",
        {
            "case_reference": _prop("case_reference", "Intake reference"),
            "caller_role": _prop("caller_role", "defendant, indemnitor, or coindemnitor"),
            "defendant_name": _prop("defendant_name", "Defendant full name"),
            "county": _prop("county", "Florida county"),
            "indemnitor_name": _prop("indemnitor_name", "Person who will sign as cosigner"),
            "indemnitor_email": _prop("indemnitor_email", "Cosigner email"),
            "indemnitor_phone": _prop("indemnitor_phone", "Cosigner phone"),
            "caller_phone": _prop("caller_phone", "Caller phone"),
            "surety_id": _prop("surety_id", "osi or palmetto"),
            "bond_amount": _prop("bond_amount", "Bond amount if known"),
            "charges": _prop("charges", "Charges if known"),
        },
        ["defendant_name", "indemnitor_name", "indemnitor_email"],
    )

    # Create workspace tools then attach IDs
    existing = _el_request("GET", f"/v1/convai/agents/{agent_id}")
    prompt_cfg = ((existing.get("conversation_config") or {}).get("agent") or {}).get("prompt") or {}
    tool_ids = list(prompt_cfg.get("tool_ids") or [])
    created_ids = []
    skip_create = "--prompt-only" in sys.argv or "--skip-create-tools" in sys.argv
    if not skip_create:
        for spec in (save_tool, email_tool):
            created = _el_request("POST", "/v1/convai/tools", {"tool_config": spec})
            tid = created.get("id") or created.get("tool_id")
            print(f"Created tool {spec['name']}: {tid}")
            if tid:
                created_ids.append(tid)

    for tid in created_ids:
        if tid not in tool_ids:
            tool_ids.append(tid)

    if not skip_create:
        send_id = "tool_4401kjz6dcxxeyfbr37eesvvz6h4"
        try:
            _el_request("PATCH", f"/v1/convai/tools/{send_id}", {
                "tool_config": {
                    **email_tool,
                    "name": "send_paperwork",
                    "description": email_tool["description"],
                    "api_schema": {
                        **email_tool["api_schema"],
                        "url": _tool_url("send_paperwork"),
                    },
                }
            })
            print("Updated send_paperwork tool to email DocuSeal + payment")
        except Exception as exc:
            print("send_paperwork tool patch skipped:", exc)

    existing_tts = dict(((existing.get("conversation_config") or {}).get("tts") or {}))
    existing_asr = dict(((existing.get("conversation_config") or {}).get("asr") or {}))
    existing_tts["agent_output_audio_format"] = "ulaw_8000"
    existing_asr["user_input_audio_format"] = "ulaw_8000"

    patch = {
        "name": "Shannon — Shamrock Paperwork Assistant",
        "conversation_config": {
            "agent": {
                "first_message": (
                    "Hey there, thank you for calling Shamrock Bail Bonds. "
                    "My name is Shannon and I can walk you through the paperwork on this call. "
                    "What is your first name?"
                ),
                "language": "en",
                "prompt": {
                    "prompt": prompt,
                    "llm": "gpt-4o",
                    "temperature": 0.3,
                    "tool_ids": tool_ids,
                },
            },
            "turn": {
                "turn_eagerness": "patient",
                "turn_timeout": 8,
                "silence_end_call_timeout": 45,
            },
            "conversation": {"max_duration_seconds": 900},
            "asr": existing_asr,
            "tts": existing_tts,
        },
    }
    _el_request("PATCH", f"/v1/convai/agents/{agent_id}", patch)
    print("Patched Shannon agent", agent_id)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
