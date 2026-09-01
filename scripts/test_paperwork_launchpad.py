"""Guards: retired /portal-start is not used as a live navigation target."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
CONFIG = (ROOT / "src" / "public" / "portal-config.js").read_text(encoding="utf-8")
TOOLS = (ROOT / "backend-gas" / "Shannon_PaperworkTools.js").read_text(encoding="utf-8")

NAV_RE = re.compile(r"""wixLocation\.to\(\s*[`'"]/portal-start""")
HANDOFF_RE = re.compile(r"""handoffUrl\s*=\s*[`'"]/portal-start""")


def test_canonical_launchpad_url():
    assert "https://paperwork.shamrockbailbonds.biz/" in CONFIG
    assert "function buildPaperworkLaunchpadUrl" in CONFIG
    assert "shamrockbailbonds.biz/portal-start" not in CONFIG


def test_shannon_id_fallback_is_launchpad():
    assert "https://paperwork.shamrockbailbonds.biz/" in TOOLS
    assert "www.shamrockbailbonds.biz/portal-start" not in TOOLS


def test_src_does_not_navigate_to_portal_start():
    hits = []
    for path in SRC.rglob("*"):
        if path.suffix not in {".js", ".jsw"}:
            continue
        text = path.read_text(encoding="utf-8")
        if NAV_RE.search(text) or HANDOFF_RE.search(text):
            hits.append(str(path.relative_to(ROOT)))
    assert hits == [], hits


def test_router_start_goes_to_launchpad():
    routers = (SRC / "backend" / "routers.js").read_text(encoding="utf-8")
    assert "buildPaperworkLaunchpadUrl" in routers
    assert "redirectWithQuery('/portal-start')" not in routers


if __name__ == "__main__":
    test_canonical_launchpad_url()
    test_shannon_id_fallback_is_launchpad()
    test_src_does_not_navigate_to_portal_start()
    test_router_start_goes_to_launchpad()
    print("ok")
