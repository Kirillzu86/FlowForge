from django.core.management.base import BaseCommand
from apps.workspaces.models import Workspace
from apps.credentials.models import Credential
from apps.workflows.models import Workflow
from apps.executions.models import WorkflowExecution, NodeExecutionLog
from datetime import datetime, timezone, timedelta

class Command(BaseCommand):
    help = 'Seeds initial FlowForge demo workflows and credentials matching the design specifications'

    def handle(self, *args, **options):
        self.stdout.write("Seeding FlowForge demo data...")

        # 1. Workspace
        workspace, _ = Workspace.objects.get_or_create(
            name="Default Workspace",
            defaults={"description": "Основная рабочая область команды FlowForge"}
        )

        # 2. Credentials
        creds = [
            ("OpenAI Production Key", "OPENAI", "sk-proj-99a8b7c6d5e4f3a2b1c0998877"),
            ("Anthropic Claude Key", "ANTHROPIC", "sk-ant-api03-abcdef1234567890"),
            ("Google Gemini Pro Key", "GEMINI", "AIzaSyD-1234567890abcdef"),
            ("Slack Webhook Authorization", "CUSTOM_HEADER", "Bearer xoxb-slack-token-sample"),
        ]
        for name, provider, val in creds:
            if not Credential.objects.filter(name=name).exists():
                c = Credential(workspace=workspace, name=name, provider=provider)
                c.set_secret(val)
                c.save()

        # 3. Workflows

        # Workflow 1: Оценка лидов (Featured in design editor)
        wf_leads_nodes = [
            {
                "id": "node_webhook",
                "type": "trigger",
                "position": {"x": 20, "y": 70},
                "data": {
                    "title": "Webhook",
                    "triggerType": "webhook",
                    "webhookPath": "/webhook/ab12",
                    "defaultPayload": {
                        "name": "Алексей Иванов",
                        "company": "TechRetail",
                        "budget": 50000,
                        "request": "Ищем AI-платформу для автоматизации обработки обращений в поддержку"
                    }
                }
            },
            {
                "id": "node_llm",
                "type": "llm",
                "position": {"x": 215, "y": 60},
                "data": {
                    "title": "Оценка заявки",
                    "model": "gpt-4o",
                    "temperature": 0.2,
                    "max_tokens": 1024,
                    "prompt": "Оцени заявку от 0 до 100 и верни JSON: {\"score\": number, \"summary\": \"string\"}. Заявка: {{ trigger.payload.request }}"
                }
            },
            {
                "id": "node_condition",
                "type": "condition",
                "position": {"x": 430, "y": 90},
                "data": {
                    "title": "Условие",
                    "expression": "score >= 80"
                }
            },
            {
                "id": "node_action_true",
                "type": "action",
                "position": {"x": 620, "y": 40},
                "data": {
                    "title": "HTTP POST",
                    "method": "POST",
                    "url": "https://api.crm.example.com/v1/leads",
                    "body": "{\"lead\": \"{{ trigger.payload.name }}\", \"score\": {{ nodes.node_llm.output.score }}}"
                }
            },
            {
                "id": "node_action_false",
                "type": "code",
                "position": {"x": 620, "y": 160},
                "data": {
                    "title": "Python",
                    "code": "output = {'status': 'nurture', 'reason': 'Score below threshold'}"
                }
            }
        ]
        wf_leads_edges = [
            {"id": "e1", "source": "node_webhook", "target": "node_llm"},
            {"id": "e2", "source": "node_llm", "target": "node_condition"},
            {"id": "e3", "source": "node_condition", "target": "node_action_true", "sourceHandle": "true"},
            {"id": "e4", "source": "node_condition", "target": "node_action_false", "sourceHandle": "false"},
        ]

        wf_leads, _ = Workflow.objects.update_or_create(
            title="Оценка лидов",
            defaults={
                "workspace": workspace,
                "description": "Claude оценивает заявку, условие score ≥ 80, запись в CRM.",
                "is_active": True,
                "version": 1,
                "nodes": wf_leads_nodes,
                "edges": wf_leads_edges,
                "last_run_status": "SUCCESS",
                "last_run_at": datetime.now(timezone.utc) - timedelta(hours=2)
            }
        )

        # Create sample execution for Оценка лидов
        if not WorkflowExecution.objects.filter(workflow=wf_leads).exists():
            exec_sample = WorkflowExecution.objects.create(
                workflow=wf_leads,
                trigger_type='WEBHOOK',
                status='COMPLETED',
                trigger_payload={"lead": "Алексей Иванов", "request": "Автоматизация поддержки"},
                context_data={
                    "nodes": {
                        "node_llm": {"output": {"score": 87, "summary": "Заявка тёплая: клиент заинтересован в автоматизации"}}
                    }
                },
                duration_ms=854,
                total_tokens=842,
                started_at=datetime.now(timezone.utc) - timedelta(hours=2),
                finished_at=datetime.now(timezone.utc) - timedelta(hours=2) + timedelta(milliseconds=854)
            )
            NodeExecutionLog.objects.create(
                execution=exec_sample,
                node_id="node_webhook",
                node_type="trigger",
                node_title="Webhook",
                status="SUCCESS",
                execution_time_ms=12,
                tokens_used=0,
                output_payload={"lead": "Алексей Иванов"}
            )
            NodeExecutionLog.objects.create(
                execution=exec_sample,
                node_id="node_llm",
                node_type="llm",
                node_title="Оценка заявки",
                status="SUCCESS",
                execution_time_ms=842,
                tokens_used=842,
                output_payload={"score": 87, "summary": "Заявка тёплая"}
            )
            NodeExecutionLog.objects.create(
                execution=exec_sample,
                node_id="node_condition",
                node_type="condition",
                node_title="score ≥ 80",
                status="SUCCESS",
                execution_time_ms=5,
                tokens_used=0,
                output_payload={"result": True, "active_handle": "true"}
            )
            NodeExecutionLog.objects.create(
                execution=exec_sample,
                node_id="node_action_true",
                node_type="action",
                node_title="HTTP POST",
                status="SUCCESS",
                execution_time_ms=65,
                tokens_used=0,
                output_payload={"status_code": 200, "data": {"saved": True}}
            )
            NodeExecutionLog.objects.create(
                execution=exec_sample,
                node_id="node_action_false",
                node_type="code",
                node_title="Python",
                status="SKIPPED",
                execution_time_ms=0,
                tokens_used=0,
                output_payload={}
            )

        # Workflow 2: Суммаризация писем
        Workflow.objects.get_or_create(
            title="Суммаризация писем",
            defaults={
                "workspace": workspace,
                "description": "Webhook → GPT-4o → отправка в Slack.",
                "is_active": True,
                "version": 1,
                "nodes": [
                    {"id": "n1", "type": "trigger", "position": {"x": 50, "y": 100}, "data": {"title": "Webhook"}},
                    {"id": "n2", "type": "llm", "position": {"x": 260, "y": 100}, "data": {"title": "GPT-4o Summary", "model": "gpt-4o"}},
                    {"id": "n3", "type": "action", "position": {"x": 480, "y": 100}, "data": {"title": "Slack Notification", "method": "POST"}}
                ],
                "edges": [
                    {"id": "e1-2", "source": "n1", "target": "n2"},
                    {"id": "e2-3", "source": "n2", "target": "n3"}
                ],
                "last_run_status": "SUCCESS",
                "last_run_at": datetime.now(timezone.utc) - timedelta(days=1)
            }
        )

        # Workflow 3: Ночной отчёт
        Workflow.objects.get_or_create(
            title="Ночной отчёт",
            defaults={
                "workspace": workspace,
                "description": "Cron → HTTP → Python → Gemini.",
                "is_active": True,
                "version": 1,
                "nodes": [
                    {"id": "n1", "type": "trigger", "position": {"x": 50, "y": 100}, "data": {"title": "Cron Schedule"}},
                    {"id": "n2", "type": "action", "position": {"x": 250, "y": 100}, "data": {"title": "Fetch Analytics", "method": "GET"}},
                    {"id": "n3", "type": "code", "position": {"x": 450, "y": 100}, "data": {"title": "Aggregator", "code": "output = {'total': 120}"}},
                    {"id": "n4", "type": "llm", "position": {"x": 650, "y": 100}, "data": {"title": "Gemini Report", "model": "gemini-1.5-pro"}}
                ],
                "edges": [
                    {"id": "e1", "source": "n1", "target": "n2"},
                    {"id": "e2", "source": "n2", "target": "n3"},
                    {"id": "e3", "source": "n3", "target": "n4"}
                ],
                "last_run_status": "SUCCESS",
                "last_run_at": datetime.now(timezone.utc) - timedelta(days=3)
            }
        )

        # Workflow 4: Локальный чат-бот
        Workflow.objects.get_or_create(
            title="Локальный чат-бот",
            defaults={
                "workspace": workspace,
                "description": "Ollama llama3 через host.docker.internal.",
                "is_active": False,
                "version": 1,
                "nodes": [
                    {"id": "n1", "type": "trigger", "position": {"x": 50, "y": 100}, "data": {"title": "Manual / Chat"}},
                    {"id": "n2", "type": "llm", "position": {"x": 300, "y": 100}, "data": {"title": "Ollama Llama3", "model": "ollama/llama3"}}
                ],
                "edges": [
                    {"id": "e1", "source": "n1", "target": "n2"}
                ],
                "last_run_status": "NEVER_RUN"
            }
        )

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully!"))
