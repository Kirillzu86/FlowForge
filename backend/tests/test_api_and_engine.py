import pytest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from apps.workspaces.models import Workspace
from apps.credentials.models import Credential
from apps.workflows.models import Workflow
from apps.executions.models import WorkflowExecution, NodeExecutionLog
from apps.executions.engine import WorkflowEngine

@pytest.mark.django_db
def test_credential_encryption():
    ws = Workspace.objects.create(name="Test Workspace")
    secret_text = "sk-proj-super-secret-key-12345"
    
    cred = Credential(workspace=ws, name="Test Key", provider="OPENAI")
    cred.set_secret(secret_text)
    cred.save()

    # Re-fetch from DB
    reloaded = Credential.objects.get(id=cred.id)
    assert reloaded.get_secret() == secret_text
    assert "sk-" in reloaded.masked_value
    assert "••••" in reloaded.masked_value

@pytest.mark.django_db
def test_workflow_engine_execution_success():
    ws = Workspace.objects.create(name="Engine WS")
    wf = Workflow.objects.create(
        workspace=ws,
        title="Test DAG Workflow",
        nodes=[
            {
                "id": "node_trigger",
                "type": "trigger",
                "position": {"x": 50, "y": 50},
                "data": {"title": "Webhook", "defaultPayload": {"score": 95, "name": "Test Lead"}}
            },
            {
                "id": "node_condition",
                "type": "condition",
                "position": {"x": 250, "y": 50},
                "data": {"title": "Check Score", "expression": "score >= 80"}
            },
            {
                "id": "node_true",
                "type": "code",
                "position": {"x": 450, "y": 20},
                "data": {"title": "Accepted", "code": "output = {'status': 'accepted'}"}
            },
            {
                "id": "node_false",
                "type": "code",
                "position": {"x": 450, "y": 120},
                "data": {"title": "Rejected", "code": "output = {'status': 'rejected'}"}
            }
        ],
        edges=[
            {"id": "e1", "source": "node_trigger", "target": "node_condition"},
            {"id": "e2", "source": "node_condition", "target": "node_true", "sourceHandle": "true"},
            {"id": "e3", "source": "node_condition", "target": "node_false", "sourceHandle": "false"},
        ]
    )

    execution = WorkflowExecution.objects.create(
        workflow=wf,
        trigger_type='MANUAL',
        trigger_payload={"score": 95, "name": "Test Lead"}
    )

    engine = WorkflowEngine(execution)
    engine.run()

    execution.refresh_from_db()
    assert execution.status == 'COMPLETED'
    assert execution.duration_ms >= 0

    # Verify node logs
    logs = list(execution.logs.all())
    log_map = {l.node_id: l for l in logs}

    assert log_map["node_trigger"].status == 'SUCCESS'
    assert log_map["node_condition"].status == 'SUCCESS'
    assert log_map["node_true"].status == 'SUCCESS'
    # Since condition score >= 80 was TRUE, node_false must be SKIPPED!
    assert log_map["node_false"].status == 'SKIPPED'

@pytest.mark.django_db
def test_workflow_engine_cycle_fails_gracefully():
    ws = Workspace.objects.create(name="Cycle WS")
    wf_cycle = Workflow.objects.create(
        workspace=ws,
        title="Cyclic Workflow",
        nodes=[{"id": "A"}, {"id": "B"}],
        edges=[
            {"source": "A", "target": "B"},
            {"source": "B", "target": "A"},
        ]
    )

    execution = WorkflowExecution.objects.create(workflow=wf_cycle)
    engine = WorkflowEngine(execution)
    engine.run()

    execution.refresh_from_db()
    assert execution.status == 'FAILED'
    assert "Цикл запрещён" in execution.error_message
