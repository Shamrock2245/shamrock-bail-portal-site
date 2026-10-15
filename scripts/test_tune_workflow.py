#!/usr/bin/env python3
"""Local checks for Shannon workflow edge stripping. No live API calls."""
from __future__ import annotations

import importlib.util
from pathlib import Path

_SPEC = importlib.util.spec_from_file_location(
    "push_shannon_agent",
    Path(__file__).resolve().parent / "push_shannon_agent.py",
)
_mod = importlib.util.module_from_spec(_SPEC)
assert _SPEC.loader is not None
_SPEC.loader.exec_module(_mod)


def test_tune_workflow_drops_underwriting_edges():
    wf = {
        "nodes": {
            "n_a_large": {"edge_order": ["e23", "e21", "e22"], "tools": []},
            "n_a_flight": {"tools": [{"tool_id": "flight"}], "edge_order": ["e99"]},
            "n_a_bg": {"tools": [{"tool_id": "bg"}], "edge_order": ["e98"]},
            "n_a_present": {"tools": []},
        },
        "edges": {
            "e23": {"source": "n_a_large", "target": "n_a_present", "forward_condition": {"type": "llm"}},
            "e21": {"source": "n_a_large", "target": "n_a_flight"},
            "e22": {"source": "n_a_large", "target": "n_a_bg"},
        },
    }
    out = _mod._tune_workflow(wf, "email_tid", "id_tid")
    assert out["nodes"]["n_a_large"]["edge_order"] == ["e23"]
    assert "e21" not in out["edges"]
    assert "e22" not in out["edges"]
    assert out["edges"]["e23"]["forward_condition"]["type"] == "unconditional"
    assert out["nodes"]["n_a_flight"]["tools"] == []
    assert out["nodes"]["n_a_bg"]["tools"] == []


def test_custom_guardrails_continue_paperwork_not_transfer():
    rails = _mod.SHANNON_CUSTOM_GUARDRAILS
    names = {item["name"] for item in rails}
    assert {"No legal advice", "Never send them to 727", "No promised release"}.issubset(names)
    legal = next(item for item in rails if item["name"] == "No legal advice")
    assert "legal name" in legal["prompt"].lower()
    assert "never block paperwork" in legal["prompt"].lower()
    merged = _mod._merge_guardrails({
        "content": {"config": {"violence": {"is_enabled": True, "threshold": 0.5}}},
        "focus": {"is_enabled": False},
    })
    assert merged["focus"]["is_enabled"] is True
    assert merged["prompt_injection"]["is_enabled"] is True
    assert merged["content"]["config"]["violence"]["is_enabled"] is False
    for item in merged["custom"]["config"]["configs"]:
        assert item["is_enabled"] is False
        assert item["execution_mode"] == "blocking"
        assert item["trigger_action"]["type"] == "retry"
        fb = item["trigger_action"]["feedback"]
        assert "continue the bail paperwork" in fb.lower()
        assert "Do not call transfer_to_number" in fb
        assert "MUST transfer" not in fb
        assert "end_call" not in str(item["trigger_action"])


def test_transfer_twiml_dials_office_not_shannon():
    path = (
        Path(__file__).resolve().parents[2]
        / "shamrock-telegram-app"
        / "netlify"
        / "edge-functions"
        / "twilio-transfer-office.js"
    )
    text = path.read_text(encoding="utf-8")
    targets_path = (
        Path(__file__).resolve().parents[2]
        / "shamrock-telegram-app"
        / "shared"
        / "office-ring-targets.js"
    )
    targets_text = targets_path.read_text(encoding="utf-8") if targets_path.is_file() else ""
    assert "officeRingNumbersXml" in text or "const DESK_CELL" in text
    assert "+12399550301" in targets_text or "DESK_CELL" in text
    assert "+12393322245" in targets_text or "LANDLINE" in text
    assert "<Number>+17272952245</Number>" not in text and "<Number>+17272952245</Number>" not in targets_text
    assert "Never dial +17272952245" in text or "Never dial 727" in text


def test_present_node_prefers_paperwork_over_office():
    wf = {
        "nodes": {
            "n_a_present": {"edge_order": ["e27", "e28"], "additional_prompt": ""},
        },
        "edges": {
            "e27": {"source": "n_a_present", "target": "n_a_intake", "forward_condition": {"type": "llm"}},
            "e28": {"source": "n_a_present", "target": "n_transfer", "forward_condition": {"type": "llm"}},
        },
    }
    out = _mod._tune_workflow(wf, "email_tid", "id_tid")
    assert "start paperwork" in out["nodes"]["n_a_present"]["additional_prompt"].lower()
    assert "explicitly asked for a person" in out["edges"]["e28"]["forward_condition"]["condition"].lower()


def test_id_wait_before_paperwork_email():
    wf = {
        "nodes": {
            "n_a_id": {"type": "tool", "edge_order": ["e29b"], "tools": []},
            "n_a_paper": {"type": "tool", "edge_order": ["e31"], "tools": []},
        },
        "edges": {
            "e29b": {"source": "n_a_id", "target": "n_a_paper", "forward_condition": {"type": "unconditional"}},
        },
    }
    out = _mod._tune_workflow(wf, "email_tid", "id_tid_123", "check_tid_123")
    assert out["edges"]["e29b"]["target"] == "n_a_id_wait"
    assert out["edges"]["e29c"]["source"] == "n_a_id_wait"
    assert out["edges"]["e29c"]["target"] == "n_a_paper"
    assert "Do not hang up" in out["nodes"]["n_a_id_wait"]["additional_prompt"]
    assert "check_tid_123" in (out["nodes"]["n_a_id_wait"].get("additional_tool_ids") or [])


def test_gather_can_route_to_id_upload():
    wf = {
        "nodes": {
            "n_a_gather": {"type": "override_agent", "edge_order": ["e13", "e14"], "tools": []},
            "n_a_id": {"type": "tool", "edge_order": ["e29b"], "tools": []},
            "n_a_check": {"type": "tool", "edge_order": []},
        },
        "edges": {
            "e13": {"source": "n_a_gather", "target": "n_a_check", "forward_condition": {"type": "llm"}},
            "e14": {"source": "n_a_gather", "target": "n_transfer", "forward_condition": {"type": "llm"}},
        },
    }
    out = _mod._tune_workflow(wf, "email_tid", "id_tid_123")
    assert out["edges"]["e13_id"]["target"] == "n_a_id"
    assert out["nodes"]["n_a_gather"]["edge_order"][0] == "e13_id"
    assert any(t.get("tool_id") == "id_tid_123" for t in out["nodes"]["n_a_gather"]["tools"])
    assert "request_id_photo" in out["nodes"]["n_a_gather"]["additional_prompt"]


def test_greet_node_is_assistant_not_brendan_or_shannon():
    wf = {
        "nodes": {"n_greet": {"edge_order": ["e02"], "additional_prompt": "Shannon. this is Brendan."}},
        "edges": {},
    }
    out = _mod._tune_workflow(wf, "email_tid", "id_tid")
    text = out["nodes"]["n_greet"]["additional_prompt"]
    lowered = text.lower()
    assert "brendan's assistant" in lowered
    assert "not brendan himself" in lowered
    assert "shannon" not in lowered
    assert "this is brendan" not in lowered
    assert _mod.FIRST_MESSAGE == "Hi, this is Brendan's assistant at Shamrock Bail Bonds. How can I help?"
    assert _mod.VOICE_ID == "2cx6OnG1GDLOtE8L9l9O"
    assert _mod.TTS_MODEL_ID == "eleven_flash_v2"
    assert _mod.TRANSFER_RING_E164 == (
        "+12393322245",
        "+12399550301",
        "+12399550178",
        "+12399550314",
    )
    ring = _mod._transfer_ring_phrase()
    assert ring.startswith("+12393322245")
    assert "+12399550314" in ring
    guard = next(item for item in _mod.SHANNON_CUSTOM_GUARDRAILS if item["name"] == "Never send them to 727")
    assert "727-295-2245" in guard["prompt"]
    assert "Never 727-295-2245" in guard["prompt"]


def test_sync_sources_match_live_greeting_and_ring():
    root = Path(__file__).resolve().parents[1]
    agent = (root / "backend-gas" / "ElevenLabs_AfterHoursAgent.js").read_text(encoding="utf-8")
    webhook = (root / "backend-gas" / "ElevenLabs_WebhookHandler.js").read_text(encoding="utf-8")
    tests = (root / "scripts" / "shannon_simulated_tests.py").read_text(encoding="utf-8")
    greeting = "Hi, this is Brendan's assistant at Shamrock Bail Bonds. How can I help?"
    for text in (agent, webhook, tests):
        assert greeting in text
        assert "This is Brendan" not in text
    assert "You are Brendan's assistant at Shamrock Bail Bonds in Fort Myers, not Brendan himself." in agent
    assert "voiceId: '2cx6OnG1GDLOtE8L9l9O'" in agent
    assert "modelId: 'eleven_flash_v2'" in agent
    assert "Never tell them to call 727-295-2245." in agent
    for number in ("+12393322245", "+12399550301", "+12399550178", "+12399550314"):
        assert number in agent
        assert number in webhook
    assert "SHANNON_TRANSFER_RING_E164" in webhook
    assert "The first to answer takes the call." in webhook


def test_greet_skips_blocking_history_lookup():
    wf = {
        "nodes": {
            "n_greet": {"edge_order": ["e02"], "additional_prompt": ""},
            "n_history": {"type": "tool", "tools": [{"tool_id": "hist"}], "edge_order": ["e03"]},
            "n_personalize": {"edge_order": ["e04"], "additional_prompt": ""},
            "n_intent": {"edge_order": ["e08"], "additional_prompt": ""},
        },
        "edges": {
            "e02": {"source": "n_greet", "target": "n_history", "forward_condition": {"type": "unconditional"}},
            "e03": {"source": "n_history", "target": "n_personalize", "forward_condition": {"type": "unconditional"}},
        },
    }
    out = _mod._tune_workflow(wf, "email_tid", "id_tid")
    assert out["edges"]["e02"]["target"] == "n_personalize"
    assert out["nodes"]["n_history"]["tools"] == []


def test_workflow_transfer_node_is_office_not_0178():
    wf = {
        "nodes": {
            "n_transfer": {
                "type": "phone_number",
                "phone_number": "+12399550178",
                "transfer_destination": {"type": "phone", "phone_number": "+12399550178"},
            }
        },
        "edges": {},
    }
    out = _mod._tune_workflow(wf, "email_tid", "id_tid")
    assert out["nodes"]["n_transfer"]["phone_number"] in ("+12399550301", "+12393322245")
    assert out["nodes"]["n_transfer"]["transfer_destination"]["phone_number"] in ("+12399550301", "+12393322245")


if __name__ == "__main__":
    test_tune_workflow_drops_underwriting_edges()
    test_custom_guardrails_continue_paperwork_not_transfer()
    test_transfer_twiml_dials_office_not_shannon()
    test_present_node_prefers_paperwork_over_office()
    test_id_wait_before_paperwork_email()
    test_gather_can_route_to_id_upload()
    test_greet_node_is_assistant_not_brendan_or_shannon()
    test_sync_sources_match_live_greeting_and_ring()
    test_greet_skips_blocking_history_lookup()
    test_workflow_transfer_node_is_office_not_0178()
    print("ok")
