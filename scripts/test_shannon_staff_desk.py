"""Shannon staff-desk text fan-out. No live sends."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / "backend-gas" / "Shannon_PaperworkTools.js"
WEBHOOK = ROOT / "backend-gas" / "ElevenLabs_WebhookHandler.js"

REQUIRED = {
    "+12397849365",
    "+12393197008",
    "+12399550301",
    "+12399550178",
}


def test_staff_desk_list_has_all_four():
    text = TOOLS.read_text(encoding="utf-8")
    block = re.search(r"var SHANNON_STAFF_DESK_PHONES = \[([^\]]+)\]", text)
    assert block, "SHANNON_STAFF_DESK_PHONES missing"
    found = set(re.findall(r"'\+1\d{10}'", block.group(1)))
    found = {item.strip("'") for item in found}
    assert REQUIRED <= found, found
    assert "+17272952245" not in found
    assert "+12393322245" not in found


def test_human_tools_call_desk_fanout():
    tools = TOOLS.read_text(encoding="utf-8")
    webhook = WEBHOOK.read_text(encoding="utf-8")
    assert "function notifyShannonStaffDesk_" in tools
    assert "notifyShannonStaffDesk_" in tools
    assert "notifyShannonStaffDesk_" in webhook
    assert "skip_staff_text" in tools
    assert "skip_staff_text" in webhook
    assert "LIVE TRANSFER" in webhook
    assert "needs a callback" in tools


def test_never_staff_text_shannon_public():
    text = TOOLS.read_text(encoding="utf-8")
    assert "d === '7272952245'" in text


if __name__ == "__main__":
    test_staff_desk_list_has_all_four()
    test_human_tools_call_desk_fanout()
    test_never_staff_text_shannon_public()
    print("ok")
