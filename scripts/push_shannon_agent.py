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
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        err_body = exc.read().decode()
        print(f"ElevenLabs API Error [{exc.code} {exc.reason}]: {err_body}")
        raise


def _tool_url(tool: str) -> str:
    secret = os.environ.get("ELEVENLABS_TOOL_SECRET") or ""
    return f"{GAS_EXEC}?source=elevenlabs_tool&tool={tool}&secret={secret}"


def _prop(name: str, description: str, required: bool = False, dynamic_variable: str = "") -> dict:
    return {
        "type": "string",
        "description": description,
        "enum": None,
        "is_system_provided": False,
        "dynamic_variable": dynamic_variable,
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
CHECK_ID_TOOL_NAME = "check_id_upload"
TRANSFER_TOOL_ID = "tool_6201kjw9k6xff9p9qa8qtbjr8ya4"
DESK_E164 = "+12399550301"
NAP_E164 = "+12393322245"
OFFICE_E164 = NAP_E164

# Blocking + retry: rewrite the turn. Do not transfer. Shannon's Twilio
# register-call path cannot use transfer_to_number (external calls).
_GUARDRAIL_CONTINUE_FEEDBACK = (
    "Your previous response was blocked. Blocked text: '{{agent_message}}'. "
    "During your next turn continue the bail paperwork on this call. Ask for "
    "the indemnitor name as it appears on their driver license, then their email. "
    "Do not transfer unless the caller asked for a person. Do not call "
    "transfer_to_number. Do not give legal advice about pleas, judges, or specific "
    "attorneys. Never send them to 727-295-2245. If they asked for a person, the "
    "office is 239-332-2245. Do not repeat the blocked wording."
)


def _custom_guardrail(name: str, prompt: str) -> dict:
    return {
        # Blocking evaluators add 200-500ms after every user turn. Off for
        # live voice; rules stay in the system prompt.
        "is_enabled": False,
        "name": name,
        "prompt": prompt,
        "execution_mode": "blocking",
        "trigger_action": {
            "type": "retry",
            "feedback": _GUARDRAIL_CONTINUE_FEEDBACK,
        },
    }


SHANNON_CUSTOM_GUARDRAILS = [
    _custom_guardrail(
        "No legal advice",
        "Block only if Shannon tells the caller what to plead, predicts what a judge or "
        "prosecutor will do, says a charge will be dropped or dismissed, or recommends a "
        "specific attorney. Never block paperwork. Always allow starting the packet, asking "
        "for the name on the driver license, saying legal name, email, ID photos, county, "
        "listed charges, bond amount, Florida premium estimates, inmate status, and emailing "
        "DocuSeal. The phrase legal name is paperwork, not legal advice. Allow saying she is "
        "not an attorney and a bondsman will review.",
    ),
    _custom_guardrail(
        "Never send them to 727",
        "Block only if Shannon tells the caller to dial, redial, or call back 727-295-2245. "
        "Allow 239-955-0301 and 239-332-2245. Never 727-295-2245.",
    ),
    _custom_guardrail(
        "No promised release",
        "Block only if Shannon promises they will be released, names a release time, or "
        "guarantees a court outcome. Allow Florida premium estimates that are clearly estimates, "
        "jail or court directions, and inmate status from tools.",
    ),
    _custom_guardrail(
        "No fee rebating or unauthorized discounts",
        "Block only if Shannon offers or agrees to premium discounts below Florida statutory 10% rate, "
        "or offers illegal rebates. Allow explaining statutory 10% rate and 0% interest payment plans.",
    ),
    _custom_guardrail(
        "No P2P payments",
        "Block only if Shannon accepts or suggests CashApp, Venmo, Zelle, PayPal, or crypto. "
        "Allow SwipeSimple card link and in-person payment at 1528 Broadway.",
    ),
]



def _merge_guardrails(existing: dict | None) -> dict:
    """Keep Focus + Manipulation on, Content off, custom rails that continue paperwork."""
    g = json.loads(json.dumps(existing or {}))
    g["version"] = "1"
    g.setdefault("focus", {})["is_enabled"] = True
    g.setdefault("prompt_injection", {})["is_enabled"] = True
    content = g.setdefault("content", {})
    content.setdefault("config", {})
    content["trigger_action"] = content.get("trigger_action") or {"type": "end_call"}
    for cat in content.get("config") or {}:
        if isinstance(content["config"].get(cat), dict):
            content["config"][cat]["is_enabled"] = False
    g["custom"] = {"config": {"configs": list(SHANNON_CUSTOM_GUARDRAILS)}}
    return g


def _tune_workflow(wf: dict, email_tid: str, id_tid: str, check_tid: str = "") -> dict:
    """Listen-first greeting, DocuSeal email node, skip investigator tools, ID capture."""
    if not isinstance(wf, dict) or not isinstance(wf.get("nodes"), dict):
        return wf
    nodes = wf["nodes"]
    edges = wf.setdefault("edges", {})
    if "n_greet" in nodes:
        nodes["n_greet"]["additional_prompt"] = (
            "The opening is already spoken: Shamrock Bail Bonds, this is Shannon, then a short how-can-I-help. No hey. Keep that energy. Answer what they just said. Do not wait on a tool."
        )
    # Mem0 is already injected at ring. Do not block the first reply on history.
    if "e02" in edges and "n_personalize" in nodes:
        edges["e02"]["target"] = "n_personalize"
        edges["e02"]["forward_condition"] = {"label": None, "type": "unconditional"}
        if "n_greet" in nodes:
            nodes["n_greet"]["edge_order"] = ["e02"]
    if "n_history" in nodes:
        nodes["n_history"]["tools"] = []
        nodes["n_history"]["additional_prompt"] = "Skip. Memory is already on the call."
    if "n_personalize" in nodes:
        nodes["n_personalize"]["additional_prompt"] = (
            "Spanish to Sofia. Then talk. Use returning_client if it is yes. "
            "Do not wait on check_caller_history. Do not re-greet."
        )
    if "n_intent" in nodes:
        nodes["n_intent"]["additional_prompt"] = (
            "Answer them first. One short question. Posting a bond is paperwork, not a transfer."
        )
    if "n_a_gather" in nodes:
        nodes["n_a_gather"]["additional_prompt"] = (
            "Ask the defendant's full name, then the county, one question at a time. "
            "For the caller's legal last name, if it sounds Irish or has an apostrophe, "
            "ask them to spell it. O'Neal is N-E-A-L. O'Neill is N-E-I-L-L. Pass that "
            "spelling as caller_name / indemnitor_name on request_id_photo. "
            "When they agree to send ID, call request_id_photo immediately. "
            "Do not say you texted a link until the tool result says you did."
        )
        if id_tid:
            tools = list(nodes["n_a_gather"].get("tools") or [])
            if not any((t or {}).get("tool_id") == id_tid for t in tools):
                tools.append({"tool_id": id_tid, "schema_overrides": None})
            nodes["n_a_gather"]["tools"] = tools
            if "n_a_id" in nodes:
                edges["e13_id"] = {
                    "source": "n_a_gather",
                    "target": "n_a_id",
                    "forward_condition": {
                        "label": None,
                        "type": "llm",
                        "condition": "The caller wants to upload, text, or email a photo of their ID.",
                    },
                    "backward_condition": None,
                }
                order = list(nodes["n_a_gather"].get("edge_order") or [])
                nodes["n_a_gather"]["edge_order"] = ["e13_id"] + [e for e in order if e != "e13_id"]
    if "n_a_paper" in nodes and email_tid:
        nodes["n_a_paper"]["tools"] = [{"tool_id": email_tid, "schema_overrides": None}]
    if "n_a_large" in nodes:
        nodes["n_a_large"]["edge_order"] = ["e23"]
        nodes["n_a_large"]["additional_prompt"] = (
            "Do not run flight risk or background checks on this call. Proceed to the premium estimate."
        )
    if "e23" in edges:
        edges["e23"]["forward_condition"] = {"label": None, "type": "unconditional"}
        edges["e23"]["target"] = edges["e23"].get("target") or "n_a_present"
    for eid, edge in list(edges.items()):
        if not isinstance(edge, dict):
            continue
        if eid in ("e21", "e22") or edge.get("target") in ("n_a_flight", "n_a_bg"):
            edges.pop(eid, None)
    for dead_node in ("n_a_flight", "n_a_bg"):
        node = nodes.get(dead_node)
        if isinstance(node, dict):
            node["tools"] = []
            node["edge_order"] = []
            node["additional_prompt"] = "Disabled. Do not run flight risk or background checks on this call."
    if "n_c_general" in nodes:
        nodes["n_c_general"]["additional_prompt"] = (
            "Answer using the knowledge base. Never recommend a specific attorney. "
            "Never give legal advice. Office landline is 239-332-2245. Transfer rings that line and 239-955-0301 together. Never 727-295-2245."
        )
    if "n_a_conf_p" in nodes:
        nodes["n_a_conf_p"]["additional_prompt"] = (
            "Confirm the signing link was texted and emailed. Ask them to open the text. "
            "Office landline is 239-332-2245."
        )
    if "n_a_present" in nodes:
        nodes["n_a_present"]["edge_order"] = ["e27", "e28"]
        nodes["n_a_present"]["additional_prompt"] = (
            "They are posting the bond. Start paperwork now. Collect the indemnitor name as it "
            "appears on the driver license, then email. Do not transfer unless they asked for a person."
        )
    if "e27" in edges:
        edges["e27"]["forward_condition"] = {
            "label": None,
            "type": "llm",
            "condition": "The caller is posting the bond or wants paperwork, even if they did not use the word paperwork.",
        }
    if "e28" in edges:
        edges["e28"]["forward_condition"] = {
            "label": None,
            "type": "llm",
            "condition": "The caller explicitly asked for a person, a bondsman, or to be transferred. Starting paperwork is not a transfer.",
        }
    if "n_transfer" in nodes:
        nodes["n_transfer"]["transfer_destination"] = {
            "type": "phone",
            "phone_number": OFFICE_E164,
        }
        nodes["n_transfer"]["phone_number"] = OFFICE_E164
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
            "target": "n_a_id_wait",
            "forward_condition": {"label": None, "type": "unconditional"},
            "backward_condition": None,
        }
    if "n_a_id" in nodes:
        if "e29b" in edges:
            edges["e29b"]["source"] = "n_a_id"
            edges["e29b"]["target"] = "n_a_id_wait"
            edges["e29b"]["forward_condition"] = {"label": None, "type": "unconditional"}
        nodes["n_a_id_wait"] = {
            "type": "override_agent",
            "position": {"x": 50.0, "y": 1650.0},
            "edge_order": ["e29c"],
            "parent_subgraph_id": None,
            "label": "Wait for ID upload",
            "entry_behavior": "auto",
            "additional_knowledge_base": [],
            "additional_tool_ids": [check_tid] if check_tid else [],
            "additional_prompt": (
                "Stay on the line while they photograph the ID. Do not hang up. "
                "Do not email paperwork yet. If they are quiet they are taking photos. "
                "Do not ask are you still there more than once. Call check_id_upload "
                "when they say they uploaded, or after a pause. Read back the name "
                "on the license. If name_conflict is set, have them spell the last "
                "name letter by letter. O'Neal (N-E-A-L) is not O'Neill (N-E-I-L-L). "
                "Keep the spelling they confirm. Then send paperwork. Tell them the "
                "signing link is texted."
            ),
        }
        edges["e29c"] = {
            "source": "n_a_id_wait",
            "target": "n_a_paper",
            "forward_condition": {
                "label": None,
                "type": "llm",
                "condition": "The ID photo was received and they confirmed the name, or they asked to skip ID and send the signing link now.",
            },
            "backward_condition": None,
        }
    if id_tid and "n_a_id" in nodes and "n_a_gather" in nodes and "e13_id" not in edges:
        edges["e13_id"] = {
            "source": "n_a_gather",
            "target": "n_a_id",
            "forward_condition": {
                "label": None,
                "type": "llm",
                "condition": "The caller wants to upload, text, or email a photo of their ID.",
            },
            "backward_condition": None,
        }
        order = list(nodes["n_a_gather"].get("edge_order") or [])
        nodes["n_a_gather"]["edge_order"] = ["e13_id"] + [e for e in order if e != "e13_id"]
    return wf


SWFL_AND_BAIL_PRONUNCIATIONS = [
    # --- SWFL Municipalities, Regions & Waterways ---
    {"type": "alias", "string_to_replace": "Bonita Springs", "alias": "boh-NEE-tuh springs"},
    {"type": "alias", "string_to_replace": "Caloosahatchee", "alias": "kuh-LOO-suh-hatch-ee"},
    {"type": "alias", "string_to_replace": "Calusa", "alias": "kuh-LOO-suh"},
    {"type": "alias", "string_to_replace": "Matlacha", "alias": "MAT-luh-shay"},
    {"type": "alias", "string_to_replace": "Alva", "alias": "AL-vuh"},
    {"type": "alias", "string_to_replace": "Bokeelia", "alias": "boh-KEEL-yuh"},
    {"type": "alias", "string_to_replace": "Chokoloskee", "alias": "chok-oh-LUSS-kee"},
    {"type": "alias", "string_to_replace": "Ochopee", "alias": "oh-CHOP-ee"},
    {"type": "alias", "string_to_replace": "Palmdale", "alias": "PAHM-dale"},
    {"type": "alias", "string_to_replace": "LaBelle", "alias": "luh-BELL"},
    {"type": "alias", "string_to_replace": "Clewiston", "alias": "CLUE-iss-ton"},
    {"type": "alias", "string_to_replace": "Port Charlotte", "alias": "port SHAR-let"},
    {"type": "alias", "string_to_replace": "Charlotte", "alias": "Shar-let"},
    {"type": "alias", "string_to_replace": "Punta Gorda", "alias": "PUN-tuh GOR-duh"},
    {"type": "alias", "string_to_replace": "Rotonda", "alias": "roh-TAHN-duh"},
    {"type": "alias", "string_to_replace": "Englewood", "alias": "ENG-ul-wood"},
    {"type": "alias", "string_to_replace": "Sarasota", "alias": "Sara-so-ta"},
    {"type": "alias", "string_to_replace": "Venice", "alias": "VEN-iss"},
    {"type": "alias", "string_to_replace": "Nokomis", "alias": "noh-KOH-miss"},
    {"type": "alias", "string_to_replace": "Osprey", "alias": "OSS-pree"},
    {"type": "alias", "string_to_replace": "Siesta Key", "alias": "see-ESS-tuh key"},
    {"type": "alias", "string_to_replace": "Lido Key", "alias": "LEE-doh key"},
    {"type": "alias", "string_to_replace": "Longboat Key", "alias": "LONG-boat key"},
    {"type": "alias", "string_to_replace": "Bradenton", "alias": "BRAY-den-ton"},
    {"type": "alias", "string_to_replace": "Palmetto", "alias": "pal-MET-oh"},
    {"type": "alias", "string_to_replace": "Anna Maria", "alias": "AN-nuh muh-REE-uh"},
    {"type": "alias", "string_to_replace": "Arcadia", "alias": "ar-KAY-dee-uh"},
    {"type": "alias", "string_to_replace": "Nocatee", "alias": "NOK-uh-tee"},
    {"type": "alias", "string_to_replace": "Wauchula", "alias": "wah-CHOO-luh"},
    {"type": "alias", "string_to_replace": "Zolfo Springs", "alias": "ZOL-foh springs"},
    {"type": "alias", "string_to_replace": "Immokalee", "alias": "ih-MAH-kuh-lee"},
    {"type": "alias", "string_to_replace": "Marco Island", "alias": "MAR-koh island"},
    {"type": "alias", "string_to_replace": "Everglades City", "alias": "EV-er-glades city"},
    {"type": "alias", "string_to_replace": "Ave Maria", "alias": "AH-vay muh-REE-uh"},
    {"type": "alias", "string_to_replace": "Golden Gate", "alias": "GOHL-den gate"},
    {"type": "alias", "string_to_replace": "Estero", "alias": "eh-STAIR-oh"},
    {"type": "alias", "string_to_replace": "San Carlos Park", "alias": "san CAR-los park"},
    {"type": "alias", "string_to_replace": "Lehigh Acres", "alias": "LEE-high acres"},
    {"type": "alias", "string_to_replace": "Cape Coral", "alias": "cape COR-al"},
    {"type": "alias", "string_to_replace": "Fort Myers", "alias": "fort MY-erz"},
    {"type": "alias", "string_to_replace": "North Fort Myers", "alias": "north fort MY-erz"},
    {"type": "alias", "string_to_replace": "Fort Myers Beach", "alias": "fort MY-erz beach"},
    {"type": "alias", "string_to_replace": "Sanibel", "alias": "SAN-ih-bell"},
    {"type": "alias", "string_to_replace": "Captiva", "alias": "cap-TEE-vuh"},
    {"type": "alias", "string_to_replace": "Useppa", "alias": "yoo-SEP-uh"},
    {"type": "alias", "string_to_replace": "Babcock Ranch", "alias": "BAB-cock ranch"},
    {"type": "alias", "string_to_replace": "Hendry", "alias": "HEN-dree"},
    {"type": "alias", "string_to_replace": "DeSoto", "alias": "dee-SOH-toh"},
    {"type": "alias", "string_to_replace": "Collier", "alias": "CALL-yer"},

    # --- Local Roads, Jails & Facilities ---
    {"type": "alias", "string_to_replace": "Ortiz", "alias": "or-TEEZ"},
    {"type": "alias", "string_to_replace": "Ortiz Avenue", "alias": "or-TEEZ avenue"},
    {"type": "alias", "string_to_replace": "Alicia Street", "alias": "uh-LEE-shuh street"},
    {"type": "alias", "string_to_replace": "Del Prado", "alias": "del PRAH-doh"},
    {"type": "alias", "string_to_replace": "Chiquita", "alias": "chih-KEE-tuh"},
    {"type": "alias", "string_to_replace": "Santa Barbara", "alias": "SAN-tuh BAR-bur-uh"},
    {"type": "alias", "string_to_replace": "Skyline", "alias": "SKY-line"},
    {"type": "alias", "string_to_replace": "Tamiami", "alias": "tam-ee-AM-ee"},
    {"type": "alias", "string_to_replace": "Daniells", "alias": "DAN-yellz"},
    {"type": "alias", "string_to_replace": "Metro Parkway", "alias": "MET-roh parkway"},
    {"type": "alias", "string_to_replace": "Colonial", "alias": "kuh-LOH-nee-ul"},
    {"type": "alias", "string_to_replace": "Winkler", "alias": "WINK-ler"},
    {"type": "alias", "string_to_replace": "Summerlin", "alias": "SUM-mer-lin"},
    {"type": "alias", "string_to_replace": "McGregor", "alias": "muh-GREG-er"},
    {"type": "alias", "string_to_replace": "Cleveland Avenue", "alias": "CLEEV-land avenue"},

    # --- Bail Bonds, Surety & Legal Terms ---
    {"type": "alias", "string_to_replace": "indemnitor", "alias": "in-dem-ni-tor"},
    {"type": "alias", "string_to_replace": "indemnitors", "alias": "in-dem-ni-tors"},
    {"type": "alias", "string_to_replace": "coindemnitor", "alias": "co in-dem-ni-tor"},
    {"type": "alias", "string_to_replace": "co-indemnitor", "alias": "co in-dem-ni-tor"},
    {"type": "alias", "string_to_replace": "coindemnitors", "alias": "co in-dem-ni-tors"},
    {"type": "alias", "string_to_replace": "co-indemnitors", "alias": "co in-dem-ni-tors"},
    {"type": "alias", "string_to_replace": "capias", "alias": "cap-ee-us"},
    {"type": "alias", "string_to_replace": "mittimus", "alias": "MIT-ih-mus"},
    {"type": "alias", "string_to_replace": "surety", "alias": "SHUR-uh-tee"},
    {"type": "alias", "string_to_replace": "sureties", "alias": "SHUR-uh-teez"},
    {"type": "alias", "string_to_replace": "affidavit", "alias": "af-ih-DAY-vit"},
    {"type": "alias", "string_to_replace": "collateral", "alias": "kuh-LAT-er-ul"},
    {"type": "alias", "string_to_replace": "promissory", "alias": "PRAHM-ih-sor-ee"},
    {"type": "alias", "string_to_replace": "forfeiture", "alias": "FOR-fih-chur"},
    {"type": "alias", "string_to_replace": "exoneration", "alias": "eg-zahn-er-AY-shun"},
    {"type": "alias", "string_to_replace": "estreature", "alias": "eh-STREE-chur"},
    {"type": "alias", "string_to_replace": "arraignment", "alias": "uh-RAIN-ment"},
    {"type": "alias", "string_to_replace": "extradition", "alias": "ex-truh-DISH-un"},
    {"type": "alias", "string_to_replace": "subpoena", "alias": "suh-PEE-nuh"},
    {"type": "alias", "string_to_replace": "docket", "alias": "DAHK-it"},
    {"type": "alias", "string_to_replace": "nolle pros", "alias": "NAH-lee prahss"},
    {"type": "alias", "string_to_replace": "nolle prosequi", "alias": "NAH-lee PRAH-suh-kwee"},
    {"type": "alias", "string_to_replace": "habeas corpus", "alias": "HAY-bee-us KOR-pus"},
    {"type": "alias", "string_to_replace": "supersedeas", "alias": "soo-per-SEE-dee-us"},
    {"type": "alias", "string_to_replace": "scire facias", "alias": "SY-ree FAY-shee-us"},
    {"type": "alias", "string_to_replace": "recusal", "alias": "rih-KYOO-zul"},

    # --- Abbreviations & System Platforms ---
    {"type": "alias", "string_to_replace": "ROR", "alias": "R-O-R"},
    {"type": "alias", "string_to_replace": "DWLSR", "alias": "D-W-L-S-R"},
    {"type": "alias", "string_to_replace": "DUI", "alias": "D-U-I"},
    {"type": "alias", "string_to_replace": "VOP", "alias": "V-O-P"},
    {"type": "alias", "string_to_replace": "FTA", "alias": "F-T-A"},
    {"type": "alias", "string_to_replace": "FDLE", "alias": "F-D-L-E"},
    {"type": "alias", "string_to_replace": "FDC", "alias": "F-D-C"},
    {"type": "alias", "string_to_replace": "DOC", "alias": "D-O-C"},
    {"type": "alias", "string_to_replace": "LCSO", "alias": "L-C-S-O"},
    {"type": "alias", "string_to_replace": "CCSO", "alias": "C-C-S-O"},
    {"type": "alias", "string_to_replace": "FMPD", "alias": "F-M-P-D"},
    {"type": "alias", "string_to_replace": "CCPD", "alias": "C-C-P-D"},
    {"type": "alias", "string_to_replace": "DocuSeal", "alias": "Doc-you-seal"},
    {"type": "alias", "string_to_replace": "SwipeSimple", "alias": "Swipe Simple"},
    {"type": "alias", "string_to_replace": "BlueBubbles", "alias": "Blue Bubbles"},
    {"type": "alias", "string_to_replace": "Shamrock", "alias": "SHAM-rock"},
]


def _ensure_pronunciation(tts: dict) -> dict:
    try:
        created = _el_request("POST", "/v1/pronunciation-dictionaries/add-from-rules", {
            "name": "Shannon SWFL & Bail Master Lexicon",
            "rules": SWFL_AND_BAIL_PRONUNCIATIONS,
        })
        pid = created.get("id") or created.get("pronunciation_dictionary_id")
        vid = created.get("version_id")
        if pid and vid:
            tts["pronunciation_dictionary_locators"] = [{
                "pronunciation_dictionary_id": pid,
                "version_id": vid,
            }]
            print(f"Attached SWFL & Bail Lexicon ({len(SWFL_AND_BAIL_PRONUNCIATIONS)} rules): {pid}")
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


def _ensure_transfer_tool() -> None:
    """Keep call_sid on transfer_to_bondsman so Twilio can redirect the live call."""
    existing = _el_request("GET", f"/v1/convai/tools/{TRANSFER_TOOL_ID}")
    cfg = existing.get("tool_config") or {}
    schema = ((cfg.get("api_schema") or {}).get("request_body_schema") or {})
    props = dict(schema.get("properties") or {})
    # ElevenLabs allows only one of description / dynamic_variable per property.
    props["call_sid"] = {
        "type": "string",
        "dynamic_variable": "call_sid",
        "enum": None,
        "is_system_provided": False,
        "allowed_values_dynamic_variable": "",
        "constant_value": "",
        "is_omitted": False,
    }
    props["caller_phone"] = {
        "type": "string",
        "dynamic_variable": "caller_phone",
        "enum": None,
        "is_system_provided": False,
        "allowed_values_dynamic_variable": "",
        "constant_value": "",
        "is_omitted": False,
    }
    schema["properties"] = props
    schema["required"] = ["reason"]
    cfg["api_schema"]["request_body_schema"] = schema
    cfg["description"] = (
        "Connect this live phone call to the Shamrock office. It rings 239-332-2245 and 239-955-0301 together. Tell the caller 239-332-2245. "
        "Use only when the caller asked for a person or a bondsman. Do not use "
        "for starting paperwork. call_sid and caller_phone are filled from the live call."
    )
    cfg["force_pre_tool_speech"] = True
    cfg["disable_interruptions"] = True
    _el_request("PATCH", f"/v1/convai/tools/{TRANSFER_TOOL_ID}", {"tool_config": cfg})
    print("Updated transfer_to_bondsman to pass call_sid")


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
            "caller_name": _prop("caller_name", "Person sending the ID. Pass the spelled legal name, e.g. Brendan O'Neal."),
            "indemnitor_name": _prop("indemnitor_name", "Same as caller_name when they are the indemnitor. Keep O'Neal if they spelled N-E-A-L."),
            "defendant_name": _prop("defendant_name", "Defendant legal full name"),
            "case_reference": _prop("case_reference", "Intake reference from create_intake"),
        },
        ["method"],
    )
    check_id_tool = _webhook_tool(
        CHECK_ID_TOOL_NAME,
        "Check whether the caller uploaded ID photos yet. Call this while they photograph the front and back. If name_conflict is set, have them spell the last name on the license. Do not send paperwork until this says received, unless they skip ID.",
        {
            "case_reference": _prop("case_reference", "Same case_reference used for request_id_photo. Never a CallSid."),
            "packet_id": _prop("packet_id", "Packet id from request_id_photo if different from case_reference."),
            "caller_phone": _prop("caller_phone", "Caller E.164 from {{caller_phone}}."),
            "defendant_name": _prop("defendant_name", "Defendant name if known."),
        },
        ["case_reference"],
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

    check_tid = existing_names.get(CHECK_ID_TOOL_NAME)
    if not check_tid:
        created = _el_request("POST", "/v1/convai/tools", {"tool_config": check_id_tool})
        check_tid = created.get("id") or created.get("tool_id")
        print(f"Created tool {CHECK_ID_TOOL_NAME}: {check_tid}")
        existing_names[CHECK_ID_TOOL_NAME] = str(check_tid or "")
    if check_tid:
        created_ids.append(check_tid)

    try:
        _ensure_transfer_tool()
    except Exception as exc:
        print("transfer_to_bondsman tool patch skipped:", exc)
    transfer_tid = existing_names.get("transfer_to_bondsman") or TRANSFER_TOOL_ID
    if transfer_tid and transfer_tid not in tool_ids:
        tool_ids.append(transfer_tid)

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
    existing_tts["model_id"] = "eleven_turbo_v2"
    existing_tts["optimize_streaming_latency"] = 4
    existing_tts["stability"] = 0.35
    existing_tts["speed"] = 1.02
    existing_tts["similarity_boost"] = 0.78
    existing_tts = _ensure_pronunciation(existing_tts)
    existing_asr["user_input_audio_format"] = "ulaw_8000"
    keywords = list(existing_asr.get("keywords") or [])
    for word in (
        "Charlotte", "Sarasota", "Lee County", "Collier", "Hendry", "DeSoto",
        "Immokalee", "Estero", "Punta Gorda", "Bonita Springs", "Caloosahatchee",
        "Calusa", "Matlacha", "Alva", "Bokeelia", "Chokoloskee", "LaBelle",
        "Clewiston", "Port Charlotte", "Rotonda", "Englewood", "Venice", "Nokomis",
        "Osprey", "Siesta Key", "Bradenton", "Palmetto", "Arcadia", "Wauchula",
        "Marco Island", "Everglades City", "Ave Maria", "Golden Gate", "Lehigh Acres",
        "Cape Coral", "Fort Myers", "Sanibel", "Captiva", "Babcock Ranch", "Ortiz",
        "indemnitor", "coindemnitor", "capias", "mittimus", "surety", "affidavit",
        "collateral", "promissory", "forfeiture", "exoneration", "estreature",
        "arraignment", "extradition", "DocuSeal", "SwipeSimple", "BlueBubbles", "Shamrock"
    ):
        if word not in keywords:
            keywords.append(word)
    existing_asr["keywords"] = keywords

    try:
        knowledge_base = _ensure_knowledge_base(existing)
    except Exception as exc:
        print("Knowledge base attach skipped:", exc)
        knowledge_base = list(prompt_cfg.get("knowledge_base") or [])

    built_in = json.loads(json.dumps(prompt_cfg.get("built_in_tools") or {}))
    # Native transfer_to_number fails on register-call. Live transfer is
    # transfer_to_bondsman → simultaneous Dial 239-332-2245 and 239-955-0301.
    built_in["transfer_to_number"] = None

    prompt_patch = {
        "prompt": prompt,
        "llm": "gpt-4o",
        "temperature": 0.6,
        "max_tokens": 500,
        "timezone": "America/New_York",
        "tool_ids": tool_ids,
        "knowledge_base": knowledge_base,
        "rag": {
            "enabled": True,
            "embedding_model": "e5_mistral_7b_instruct",
            "max_documents_length": 12000,
            "max_retrieved_rag_chunks_count": 4,
        },
    }
    if built_in:
        prompt_patch["built_in_tools"] = built_in

    patch = {
        "name": "Shannon — Shamrock Paperwork Assistant",
        "conversation_config": {
            "agent": {
                "first_message": "Shamrock Bail Bonds! This is Shannon. How can I help today?",
                "language": "en",
                "dynamic_variables": {
                    "dynamic_variable_placeholders": {
                        # 239-555-0100 is the reserved NANP example, not a Shamrock DID.
                        "caller_phone": "+12395550100",
                        "caller_id": "+12395550100",
                        "call_sid": "",
                        "returning_client": "no",
                        "known_defendant": "",
                        "prior_notes": "",
                        "is_jail_call": "no",
                        "jail_facility": "",
                    }
                },
                "prompt": prompt_patch,
            },

            "turn": {
                "turn_eagerness": "normal",
                "turn_timeout": 5,
                "silence_end_call_timeout": 45,
                "speculative_turn": True,
                "soft_timeout_config": {
                    "timeout_seconds": 2.5,
                    "message": "Mm-hmm.",
                    "use_llm_generated_message": False,
                    "randomize_fillers": True,
                    "disable_until_first_user_message": True,
                },
            },
            "conversation": {"max_duration_seconds": 900},
            "asr": existing_asr,
            "tts": existing_tts,
        },
        "platform_settings": {
            "guardrails": _merge_guardrails((existing.get("platform_settings") or {}).get("guardrails")),
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
        patch["workflow"] = _tune_workflow(wf, email_tid, id_tid, check_tid or "")
        print("Tuned Shannon workflow nodes")
    except Exception as exc:
        print("Workflow tune skipped:", exc)
    _el_request("PATCH", f"/v1/convai/agents/{agent_id}", patch)
    print("Patched Shannon agent", agent_id)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
