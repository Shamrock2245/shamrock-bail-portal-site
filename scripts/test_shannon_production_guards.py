"""Source guards for the last-24h Shannon production path. No live API calls."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
AGENT = (ROOT / "backend-gas" / "ElevenLabs_AfterHoursAgent.js").read_text(encoding="utf-8")
WEBHOOK = (ROOT / "backend-gas" / "ElevenLabs_WebhookHandler.js").read_text(encoding="utf-8")
HELPERS = (ROOT / "backend-gas" / "Shannon_Helpers.js").read_text(encoding="utf-8")
CODE = (ROOT / "backend-gas" / "Code.js").read_text(encoding="utf-8")
PUSH = (ROOT / "scripts" / "push_shannon_agent.py").read_text(encoding="utf-8")


def _prompt() -> str:
    match = re.search(r"systemPrompt:\s*\[(.*?)\]\.join\('\\n'\)", AGENT, re.S)
    assert match, "systemPrompt block missing"
    lines = re.findall(r'"((?:\\.|[^"\\])*)"', match.group(1))
    return "\n".join(bytes(line, "utf-8").decode("unicode_escape") for line in lines)


def test_prompt_never_sends_callers_to_727():
    prompt = _prompt()
    assert "239-332-2245" in prompt
    assert "Never say 727-295-2245" in prompt or "Never tell them to call 727-295-2245" in prompt
    assert "Never send them to 727-295-2245" in PUSH


def test_prompt_does_not_invent_account_or_office_times():
    prompt = _prompt()
    assert "not_found" in prompt
    assert "Never invent an active bond" in prompt
    assert "status requested" in prompt
    assert "first_appearance" in prompt
    assert "SignNow" in prompt and "Never mention SignNow" in prompt


def test_webhook_routes_new_csr_tools():
    assert "case 'check_client_account':" in WEBHOOK
    assert "case 'schedule_office_visit':" in WEBHOOK
    assert "case 'pull_court_dates':" in WEBHOOK
    assert "function toolCheckClientAccount" in WEBHOOK
    assert "function toolScheduleOfficeVisit" in WEBHOOK
    assert "shannonBuildAccountSpoken_" in WEBHOOK
    assert "shannonParseOfficeVisitWhen_" in WEBHOOK
    assert "shannonSafeToolMessage_" in WEBHOOK
    assert "shannonUnwrapToolPayload_" in WEBHOOK


def test_tool_errors_do_not_leak_exceptions():
    assert "message: err.message" not in WEBHOOK
    assert "shannonSafeToolMessage_()" in WEBHOOK
    assert "I pulled up the file" not in WEBHOOK
    assert "The bond is currently active" not in WEBHOOK


def test_office_visit_does_not_fake_calendar_now():
    assert "Date.now() + 3600000" not in WEBHOOK
    assert "when.parsed" in WEBHOOK
    assert "status: when.parsed ? 'scheduled' : 'requested'" in WEBHOOK
    assert "shannonNormalizePhone10_" in WEBHOOK


def test_lookup_redacts_indemnitor_pii():
    assert "shannonRedactDefendantForVoice_" in WEBHOOK
    assert "shannonPersonNamesMatch_" in WEBHOOK
    assert "params.caller_name" not in WEBHOOK.split("function toolCheckClientAccount")[1][:800]


def test_county_resolver_lives_in_helpers():
    assert "function resolveCountyDirectoryEntry_" in HELPERS
    assert "function resolveCountyDirectoryEntry_" not in WEBHOOK
    assert "function getCountyDirectory_" in WEBHOOK
    assert "shannonCountyAliasMap_" in HELPERS
    assert "fortmyers" in HELPERS
    assert "miami-dade" in HELPERS


def test_code_js_still_gates_tool_secret():
    assert "source === 'elevenlabs_tool'" in CODE
    assert "verifyElevenLabsToolSecret_(e)" in CODE
    assert "clasp deploy -i" not in WEBHOOK  # sanity: handler is not a deploy script


def test_premium_accepts_bond_amount_alias():
    assert "params.bail_amount || params.bond_amount" in WEBHOOK
    assert "shannonParseMoney_" in WEBHOOK
    assert "resolveCountyDirectoryEntry_(params.county)" in WEBHOOK


if __name__ == "__main__":
    test_prompt_never_sends_callers_to_727()
    test_prompt_does_not_invent_account_or_office_times()
    test_webhook_routes_new_csr_tools()
    test_tool_errors_do_not_leak_exceptions()
    test_office_visit_does_not_fake_calendar_now()
    test_lookup_redacts_indemnitor_pii()
    test_county_resolver_lives_in_helpers()
    test_code_js_still_gates_tool_secret()
    test_premium_accepts_bond_amount_alias()
    print("ok")
