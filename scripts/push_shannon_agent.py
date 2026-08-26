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


def _data_field(description: str, dtype: str = "string") -> dict:
    return {"type": dtype, "description": description}


def _ensure_knowledge_base(agent: dict) -> list[dict]:
    """Attach docs/shannon-knowledge-base.txt; reuse an existing Shannon KB doc if present."""
    prompt_cfg = ((agent.get("conversation_config") or {}).get("agent") or {}).get("prompt") or {}
    existing_kb = list(prompt_cfg.get("knowledge_base") or [])
    wanted_name = "Shannon Shamrock Knowledge"
    already = any(
        (doc.get("name") or "") == wanted_name or "shannon" in str(doc.get("name") or "").lower()
        for doc in existing_kb
        if isinstance(doc, dict)
    )
    if already:
        return existing_kb

    kb_path = ROOT / "docs" / "shannon-knowledge-base.txt"
    if not kb_path.is_file():
        print("Knowledge base file missing; skipping attach")
        return existing_kb

    created = _el_request("POST", "/v1/convai/knowledge-base/text", {
        "text": kb_path.read_text(encoding="utf-8"),
        "name": wanted_name,
    })
    doc_id = created.get("id") or created.get("documentation_id")
    print(f"Created knowledge base {wanted_name}: {doc_id}")
    if not doc_id:
        return existing_kb
    existing_kb.append({
        "type": "text",
        "id": doc_id,
        "name": wanted_name,
        "usage_mode": "auto",
    })
    return existing_kb


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
        "Save a section of bond paperwork answers during the call. Call after every section. Reuse case_reference from create_intake.",
        {
            "case_reference": _prop("case_reference", "Intake reference from create_intake, e.g. SH-2395550100-SMITH"),
            "caller_role": _prop("caller_role", "Exactly one of: defendant, indemnitor, coindemnitor"),
            "caller_phone": _prop("caller_phone", "Digits from {{caller_phone}}, e.g. +12395550100"),
            "defendant_name": _prop("defendant_name", "Defendant legal full name, e.g. Jane Ann Doe"),
            "county": _prop("county", "Florida county name only, e.g. Lee"),
            "section": _prop("section", "Section just collected, e.g. indemnitor_identity"),
            "indemnitor_name": _prop("indemnitor_name", "Indemnitor legal name"),
            "indemnitor_email": _prop("indemnitor_email", "Standard email, e.g. name@domain.com"),
            "indemnitor_phone": _prop("indemnitor_phone", "Digits only, e.g. 2395550100"),
            "notes": _prop("notes", "Freeform extras. No SSN."),
        },
        ["caller_role"],
    )
    email_tool = _webhook_tool(
        "email_paperwork_to_indemnitor",
        "Email the MAIN indemnitor the DocuSeal signing link and SwipeSimple payment link. Use when indemnitor name, indemnitor email, and defendant name are known. Never email the person in jail.",
        {
            "case_reference": _prop("case_reference", "Intake reference from create_intake"),
            "caller_role": _prop("caller_role", "Exactly one of: defendant, indemnitor, coindemnitor"),
            "defendant_name": _prop("defendant_name", "Defendant legal full name"),
            "county": _prop("county", "Florida county name only, e.g. Lee"),
            "indemnitor_name": _prop("indemnitor_name", "Person who will sign as the main cosigner"),
            "indemnitor_email": _prop("indemnitor_email", "Standard email, e.g. name@domain.com. Never a jail email."),
            "indemnitor_phone": _prop("indemnitor_phone", "Digits only, e.g. 2395550100"),
            "caller_phone": _prop("caller_phone", "Caller phone from {{caller_phone}}"),
            "surety_id": _prop("surety_id", "osi or palmetto. Default osi."),
            "bond_amount": _prop("bond_amount", "Numeric dollars if known, e.g. 5000"),
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
    existing_tts["text_normalisation_type"] = "elevenlabs"
    existing_asr["user_input_audio_format"] = "ulaw_8000"
    keywords = list(existing_asr.get("keywords") or [])
    for word in ("Charlotte", "Sarasota", "indemnitor", "capias", "DocuSeal", "Shamrock", "Lee County"):
        if word not in keywords:
            keywords.append(word)
    existing_asr["keywords"] = keywords

    try:
        knowledge_base = _ensure_knowledge_base(existing)
    except Exception as exc:
        print("Knowledge base attach skipped:", exc)
        knowledge_base = list(prompt_cfg.get("knowledge_base") or [])

    built_in = json.loads(json.dumps(prompt_cfg.get("built_in_tools") or {}))
    ttn = built_in.get("transfer_to_number")
    if isinstance(ttn, dict):
        ttn.setdefault("params", {})
        ttn["params"]["transfers"] = [{
            "transfer_destination": {"type": "phone", "phone_number": "+12393322245"},
            "transfer_type": "conference",
            "phone_number": "+12393322245",
            "condition": "Caller requests a person. Office line is 239-332-2245. Never send them back to 727-295-2245.",
            "custom_sip_headers": [],
            "require_acceptance": False,
        }]

    prompt_patch = {
        "prompt": prompt,
        "llm": "gpt-4o",
        "temperature": 0.3,
        "tool_ids": tool_ids,
        "knowledge_base": knowledge_base,
        "rag": {
            "enabled": True,
            "embedding_model": "e5_mistral_7b_instruct",
            "max_documents_length": 50000,
            "max_retrieved_rag_chunks_count": 12,
        },
    }
    if built_in:
        prompt_patch["built_in_tools"] = built_in

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
                "dynamic_variables": {
                    "dynamic_variable_placeholders": {
                        "caller_phone": "+12395550100",
                        "caller_id": "+12395550100",
                        "call_sid": "",
                        "returning_client": "no",
                        "known_defendant": "",
                        "prior_notes": "",
                    }
                },
                "prompt": prompt_patch,
            },
            "turn": {
                "turn_eagerness": "patient",
                "turn_timeout": 8,
                "silence_end_call_timeout": 45,
                "soft_timeout_config": {
                    "timeout_seconds": 3.0,
                    "message": "Okay.",
                    "use_llm_generated_message": False,
                },
            },
            "conversation": {"max_duration_seconds": 900},
            "asr": existing_asr,
            "tts": existing_tts,
        },
        "platform_settings": {
            "guardrails": {
                "version": "1",
                "prompt_injection": {"is_enabled": True},
                "focus": {"is_enabled": True},
            },
            "evaluation": {
                "criteria": [
                    {
                        "id": "intake_created",
                        "name": "intake_created",
                        "type": "prompt",
                        "conversation_goal_prompt": "Success if the agent created an intake or obtained a case reference for the defendant.",
                    },
                    {
                        "id": "paperwork_emailed_to_indemnitor",
                        "name": "paperwork_emailed_to_indemnitor",
                        "type": "prompt",
                        "conversation_goal_prompt": "Success if the agent emailed or sent DocuSeal signing and payment links to the MAIN indemnitor, not to a jail email.",
                    },
                    {
                        "id": "human_offered_3322245",
                        "name": "human_offered_3322245",
                        "type": "prompt",
                        "conversation_goal_prompt": "If the caller asked for a person, success if the agent gave 239-332-2245 and did not send them to 727-295-2245. If they did not ask for a person, mark unknown.",
                    },
                    {
                        "id": "no_legal_advice",
                        "name": "no_legal_advice",
                        "type": "prompt",
                        "conversation_goal_prompt": "Success if the agent did not give legal advice or guaranteed court outcomes.",
                    },
                ]
            },
            "data_collection": {
                "caller_role": _data_field("Caller role: defendant, indemnitor, or coindemnitor."),
                "defendant_name": _data_field("Defendant legal full name if stated."),
                "county": _data_field("Florida county name if stated."),
                "indemnitor_email": _data_field("Main indemnitor email in name@domain.com form if collected."),
                "packet_sent": _data_field("True if DocuSeal or payment links were emailed to the indemnitor.", "boolean"),
                "human_requested": _data_field("True if the caller asked for a person.", "boolean"),
                "returning_caller": _data_field("True if this was a returning caller with prior history.", "boolean"),
            },
        },
    }
    existing_platform = dict(existing.get("platform_settings") or {})
    existing_platform.update(patch["platform_settings"])
    patch["platform_settings"] = existing_platform
    _el_request("PATCH", f"/v1/convai/agents/{agent_id}", patch)
    print("Patched Shannon agent", agent_id)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
