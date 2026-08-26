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


DROP_AGENT_TOOLS = frozenset({
    "evaluate_flight_risk",
    "run_background_verification",
    "send_paperwork",
})
EMAIL_TOOL_ID = "tool_0501m0xjhwh5evqtfnhn50mb9bk7"
ID_TOOL_ID = "tool_0701m0zcarw2fvsr1gekvsr43djy"


def _tune_workflow(wf: dict, email_tid: str, id_tid: str) -> dict:
    """Listen-first greeting, DocuSeal email node, skip investigator tools, ID capture."""
    if not isinstance(wf, dict) or not isinstance(wf.get("nodes"), dict):
        return wf
    nodes = wf["nodes"]
    edges = wf.setdefault("edges", {})
    if "n_greet" in nodes:
        nodes["n_greet"]["additional_prompt"] = (
            "The first line is already spoken. Do not greet again. Listen to why they called."
        )
    if "n_a_paper" in nodes and email_tid:
        nodes["n_a_paper"]["tools"] = [{"tool_id": email_tid, "schema_overrides": None}]
    if "n_a_large" in nodes:
        nodes["n_a_large"]["edge_order"] = ["e23"]
        nodes["n_a_large"]["additional_prompt"] = (
            "Do not run flight risk or background checks on this call. Proceed to the premium estimate."
        )
    if "e23" in edges:
        edges["e23"]["forward_condition"] = {"label": None, "type": "unconditional"}
    if "n_c_general" in nodes:
        nodes["n_c_general"]["additional_prompt"] = (
            "Answer using the knowledge base. Never recommend a specific attorney. "
            "Never give legal advice. Office number is 239-332-2245. Never 727-295-2245."
        )
    if "n_a_conf_p" in nodes:
        nodes["n_a_conf_p"]["additional_prompt"] = (
            "Confirm the DocuSeal signing email went to the indemnitor after they confirmed "
            "the spelled address. Ask if anything else is needed. Office is 239-332-2245."
        )
    if "n_a_present" in nodes:
        nodes["n_a_present"]["additional_prompt"] = (
            "Give a Florida estimate only, never a guaranteed price. Spell the indemnitor email "
            "before sending paperwork. Offer paperwork now or a bondsman at 239-332-2245."
        )
    if id_tid and "n_a_id" not in nodes and "n_a_intake" in nodes:
        nodes["n_a_id"] = {
            "type": "tool",
            "position": {"x": 50.0, "y": 1500.0},
            "edge_order": ["e29b"],
            "parent_subgraph_id": None,
            "tools": [{"tool_id": id_tid, "schema_overrides": None}],
        }
        if "e29" in edges:
            edges["e29"]["target"] = "n_a_id"
        edges["e29b"] = {
            "source": "n_a_id",
            "target": "n_a_paper",
            "forward_condition": {"label": None, "type": "unconditional"},
            "backward_condition": None,
        }
    return wf


def _ensure_pronunciation(tts: dict) -> dict:
    locators = list(tts.get("pronunciation_dictionary_locators") or [])
    if locators:
        return tts
    try:
        created = _el_request("POST", "/v1/pronunciation-dictionaries/add-from-rules", {
            "name": "Shannon Florida legal",
            "rules": [
                {"type": "alias", "string_to_replace": "Charlotte", "alias": "Shar-let"},
                {"type": "alias", "string_to_replace": "Sarasota", "alias": "Sara-so-ta"},
                {"type": "alias", "string_to_replace": "indemnitor", "alias": "in-dem-ni-tor"},
                {"type": "alias", "string_to_replace": "capias", "alias": "cap-ee-us"},
                {"type": "alias", "string_to_replace": "DocuSeal", "alias": "Doc-you-seal"},
            ],
        })
        pid = created.get("id") or created.get("pronunciation_dictionary_id")
        vid = created.get("version_id")
        if pid and vid:
            tts["pronunciation_dictionary_locators"] = [{
                "pronunciation_dictionary_id": pid,
                "version_id": vid,
            }]
            print("Attached pronunciation dictionary", pid)
        else:
            print("Pronunciation dictionary response missing ids")
    except Exception as exc:
        print("Pronunciation dictionary skipped:", exc)
    return tts


def _ensure_knowledge_base(agent: dict) -> list[dict]:
    """Refresh Shannon RAG from docs/shannon-knowledge-base.txt."""
    prompt_cfg = ((agent.get("conversation_config") or {}).get("agent") or {}).get("prompt") or {}
    existing_kb = list(prompt_cfg.get("knowledge_base") or [])
    wanted_name = "Shannon Shamrock Knowledge"
    kb_path = ROOT / "docs" / "shannon-knowledge-base.txt"
    if not kb_path.is_file():
        print("Knowledge base file missing; skipping attach")
        return existing_kb

    text = kb_path.read_text(encoding="utf-8")
    existing_id = None
    for doc in existing_kb:
        if not isinstance(doc, dict):
            continue
        name = str(doc.get("name") or "")
        if name == wanted_name or "shannon" in name.lower():
            existing_id = doc.get("id")
            break

    if existing_id:
        try:
            _el_request("PATCH", f"/v1/convai/knowledge-base/{existing_id}", {
                "name": wanted_name,
                "text": text,
            })
            print(f"Updated knowledge base {wanted_name}: {existing_id}")
            kept = []
            replaced = False
            for doc in existing_kb:
                if not isinstance(doc, dict):
                    continue
                name = str(doc.get("name") or "")
                if name == wanted_name or "shannon" in name.lower():
                    if not replaced:
                        kept.append({
                            "type": doc.get("type") or "text",
                            "id": existing_id,
                            "name": wanted_name,
                            "usage_mode": "auto",
                        })
                        replaced = True
                    continue
                kept.append(doc)
            return kept
        except Exception as exc:
            print("Knowledge base PATCH skipped:", exc)

    created = _el_request("POST", "/v1/convai/knowledge-base/text", {
        "text": text,
        "name": wanted_name,
    })
    doc_id = created.get("id") or created.get("documentation_id")
    print(f"Created knowledge base {wanted_name}: {doc_id}")
    if not doc_id:
        return existing_kb
    kept = [
        doc for doc in existing_kb
        if isinstance(doc, dict) and "shannon" not in str(doc.get("name") or "").lower()
    ]
    kept.append({
        "type": "text",
        "id": doc_id,
        "name": wanted_name,
        "usage_mode": "auto",
    })
    return kept


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
    id_tool = _webhook_tool(
        "request_id_photo",
        "Ask the caller for a government ID. method=upload texts a mobile photo-upload link. method=email emails instructions to send front and back photos. Never email the jail. Prefer upload for defendants in custody.",
        {
            "method": _prop("method", "Exactly upload or email. upload texts a scan link. email sends ID photo instructions."),
            "caller_role": _prop("caller_role", "Exactly one of: defendant, indemnitor, coindemnitor"),
            "caller_phone": _prop("caller_phone", "Digits from {{caller_phone}} for the texted upload link"),
            "phone": _prop("phone", "Mobile number to text the upload link if different from caller_phone"),
            "email": _prop("email", "Standard email for ID instructions, e.g. name@domain.com. Never a jail email."),
            "indemnitor_email": _prop("indemnitor_email", "Alias for email"),
            "caller_name": _prop("caller_name", "Person sending the ID"),
            "defendant_name": _prop("defendant_name", "Defendant legal full name"),
            "case_reference": _prop("case_reference", "Intake reference from create_intake"),
        },
        ["method"],
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
    # Default is prompt-only. Creating tools duplicates ElevenLabs workspace tools.
    skip_create = "--create-tools" not in sys.argv
    if not skip_create:
        for spec in (save_tool, email_tool):
            created = _el_request("POST", "/v1/convai/tools", {"tool_config": spec})
            tid = created.get("id") or created.get("tool_id")
            print(f"Created tool {spec['name']}: {tid}")
            if tid:
                created_ids.append(tid)

    # Attach request_id_photo once. Do not duplicate save/email tools.
    existing_names: dict[str, str] = {}
    try:
        listing = _el_request("GET", "/v1/convai/tools")
        for item in listing.get("tools") or listing.get("items") or []:
            tid = item.get("id") or item.get("tool_id")
            cfg = item.get("tool_config") or item
            name = cfg.get("name")
            if tid and name:
                existing_names[str(name)] = str(tid)
    except Exception as exc:
        print("Tool listing skipped:", exc)
    id_tid = existing_names.get("request_id_photo")
    if not id_tid:
        created = _el_request("POST", "/v1/convai/tools", {"tool_config": id_tool})
        id_tid = created.get("id") or created.get("tool_id")
        print(f"Created tool request_id_photo: {id_tid}")
    if id_tid:
        created_ids.append(id_tid)

    for tid in created_ids:
        if tid not in tool_ids:
            tool_ids.append(tid)

    drop_ids = {tid for name, tid in existing_names.items() if name in DROP_AGENT_TOOLS}
    if drop_ids:
        before = len(tool_ids)
        tool_ids = [tid for tid in tool_ids if tid not in drop_ids]
        print(f"Dropped investigator/duplicate tools: {before - len(tool_ids)}")

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
    existing_tts["expressive_mode"] = True
    if existing_tts.get("stability") is None or float(existing_tts.get("stability") or 1) > 0.45:
        existing_tts["stability"] = 0.42
    existing_tts = _ensure_pronunciation(existing_tts)
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
        "temperature": 0.55,
        "timezone": "America/New_York",
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
                "first_message": "Shamrock Bail Bonds. How may I help you today?",
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
                "speculative_turn": False,
                "soft_timeout_config": {
                    "timeout_seconds": 3.0,
                    "message": "Okay.",
                    "use_llm_generated_message": False,
                    "disable_until_first_user_message": True,
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
                        "conversation_goal_prompt": "If the caller wanted paperwork, success if the agent spelled the indemnitor email back, got confirmation, then emailed DocuSeal signing and payment links to the MAIN indemnitor, not a jail email. If they only wanted a person, a lookup, or directions, mark unknown.",
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
    try:
        wf = json.loads(json.dumps(existing.get("workflow") or {}))
        email_tid = existing_names.get("email_paperwork_to_indemnitor") or EMAIL_TOOL_ID
        id_tid = existing_names.get("request_id_photo") or ID_TOOL_ID
        patch["workflow"] = _tune_workflow(wf, email_tid, id_tid)
        print("Tuned Shannon workflow nodes")
    except Exception as exc:
        print("Workflow tune skipped:", exc)
    _el_request("PATCH", f"/v1/convai/agents/{agent_id}", patch)
    print("Patched Shannon agent", agent_id)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
