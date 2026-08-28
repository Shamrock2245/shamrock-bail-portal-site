"""Local checks for Shannon simulated-test specs. No live API calls."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from shannon_simulated_tests import SHANNON_TEST_SPECS


def test_four_required_scenarios_exist():
    names = {spec["name"] for spec in SHANNON_TEST_SPECS}
    assert "Shannon want-a-person offers 239-332-2245" in names
    assert "Shannon Spanish hands off to Sofia" in names
    assert "Shannon missing email does not send paperwork" in names
    assert "Shannon indemnitor happy path starts paperwork" in names


def test_want_a_person_never_loops_to_727():
    spec = next(s for s in SHANNON_TEST_SPECS if "want-a-person" in s["name"])
    assert "239-332-2245" in spec["success_condition"]
    assert "727-295-2245" in spec["success_condition"]
    failures = " ".join(ex["response"] for ex in spec["failure_examples"])
    assert "727-295-2245" in failures


def test_happy_path_is_bounded_simulation():
    spec = next(s for s in SHANNON_TEST_SPECS if "happy path" in s["name"])
    assert spec["type"] == "simulation"
    assert spec["simulation_max_turns"] <= 12
    assert "jail" in spec["success_condition"].lower()
    assert spec["dynamic_variables"]["call_sid"].startswith("SH-TEST")
    assert spec["workflow_node_id"] == "n_intent"


def test_llm_cases_skip_greeting_node():
    for spec in SHANNON_TEST_SPECS:
        assert spec.get("workflow_node_id") not in (None, "n_greet", "start_node")


if __name__ == "__main__":
    test_four_required_scenarios_exist()
    test_want_a_person_never_loops_to_727()
    test_happy_path_is_bounded_simulation()
    test_llm_cases_skip_greeting_node()
    print("ok")
