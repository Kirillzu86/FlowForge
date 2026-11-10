import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from apps.executions.context import SafeContextResolver

def test_template_interpolation():
    context = {
        "trigger": {"payload": {"name": "Алексей Иванов", "budget": 50000}},
        "nodes": {
            "node_llm": {"output": {"score": 87, "summary": "Заявка тёплая"}}
        },
        "variables": {"environment": "production"}
    }
    resolver = SafeContextResolver(context)

    # Standard template
    res1 = resolver.render_template("Заявка от {{ trigger.payload.name }}: {{ nodes.node_llm.output.summary }}")
    assert res1 == "Заявка от Алексей Иванов: Заявка тёплая"

    # Numeric interpolation
    res2 = resolver.render_template("Score: {{ nodes.node_llm.output.score }}")
    assert res2 == "Score: 87"

def test_condition_evaluation():
    context = {
        "trigger": {"payload": {"country": "RU"}},
        "nodes": {
            "node_llm": {"output": {"score": 87}}
        }
    }
    resolver = SafeContextResolver(context)

    assert resolver.evaluate_condition("score >= 80") is True
    assert resolver.evaluate_condition("score < 50") is False
    assert resolver.evaluate_condition("country == 'RU'") is True
    assert resolver.evaluate_condition("country == 'US'") is False
