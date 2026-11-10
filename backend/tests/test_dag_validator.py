import pytest
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from apps.workflows.dag_validator import (
    validate_graph,
    detect_cycles_and_toposort,
    CyclicDependencyError,
)

def test_empty_graph():
    diagnostics = validate_graph([], [])
    assert diagnostics["is_valid"] is True
    assert diagnostics["has_cycle"] is False
    assert diagnostics["levels"] == []

def test_linear_valid_graph():
    nodes = [{"id": "A"}, {"id": "B"}, {"id": "C"}]
    edges = [
        {"source": "A", "target": "B"},
        {"source": "B", "target": "C"},
    ]
    diagnostics = validate_graph(nodes, edges)
    assert diagnostics["is_valid"] is True
    assert diagnostics["has_cycle"] is False
    assert diagnostics["levels"] == [["A"], ["B"], ["C"]]

def test_branching_dag():
    nodes = [{"id": "trigger"}, {"id": "llm"}, {"id": "branch_true"}, {"id": "branch_false"}]
    edges = [
        {"source": "trigger", "target": "llm"},
        {"source": "llm", "target": "branch_true", "sourceHandle": "true"},
        {"source": "llm", "target": "branch_false", "sourceHandle": "false"},
    ]
    diagnostics = validate_graph(nodes, edges)
    assert diagnostics["is_valid"] is True
    assert diagnostics["has_cycle"] is False
    # trigger -> llm -> [branch_true, branch_false]
    assert len(diagnostics["levels"]) == 3
    assert diagnostics["levels"][0] == ["trigger"]
    assert diagnostics["levels"][1] == ["llm"]
    assert set(diagnostics["levels"][2]) == {"branch_true", "branch_false"}

def test_simple_cycle_detected():
    nodes = [{"id": "A"}, {"id": "B"}]
    edges = [
        {"source": "A", "target": "B"},
        {"source": "B", "target": "A"},
    ]
    with pytest.raises(CyclicDependencyError) as exc_info:
        detect_cycles_and_toposort(nodes, edges)

    assert "Цикл запрещён" in str(exc_info.value)
    assert set(exc_info.value.cycle_nodes) == {"A", "B"}

def test_three_node_loop_cycle():
    nodes = [{"id": "node_1"}, {"id": "node_2"}, {"id": "node_3"}]
    edges = [
        {"source": "node_1", "target": "node_2"},
        {"source": "node_2", "target": "node_3"},
        {"source": "node_3", "target": "node_1"},
    ]
    diagnostics = validate_graph(nodes, edges)
    assert diagnostics["is_valid"] is False
    assert diagnostics["has_cycle"] is True
    assert set(diagnostics["cycle_nodes"]) == {"node_1", "node_2", "node_3"}
