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


def test_custom_guardrails_warm_transfer_to_office():
    rails = _mod.SHANNON_CUSTOM_GUARDRAILS
    names = {item["name"] for item in rails}
    assert names == {"No legal advice", "Never send them to 727", "No promised release"}
    merged = _mod._merge_guardrails({
        "content": {"config": {"violence": {"is_enabled": True, "threshold": 0.5}}},
        "focus": {"is_enabled": False},
    })
    assert merged["focus"]["is_enabled"] is True
    assert merged["prompt_injection"]["is_enabled"] is True
    assert merged["content"]["config"]["violence"]["is_enabled"] is False
    for item in merged["custom"]["config"]["configs"]:
        assert item["is_enabled"] is True
        assert item["execution_mode"] == "blocking"
        assert item["trigger_action"]["type"] == "retry"
        assert "+12393322245" in item["trigger_action"]["feedback"]
        assert "transfer_to_number" in item["trigger_action"]["feedback"]
        assert "end_call" not in str(item["trigger_action"])


if __name__ == "__main__":
    test_tune_workflow_drops_underwriting_edges()
    test_custom_guardrails_warm_transfer_to_office()
    print("ok")
