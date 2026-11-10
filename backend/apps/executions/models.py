import uuid
from django.db import models
from apps.workflows.models import Workflow

class WorkflowExecution(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('RUNNING', 'Running'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
    ]

    TRIGGER_CHOICES = [
        ('MANUAL', 'Manual'),
        ('WEBHOOK', 'Webhook'),
        ('CRON', 'Cron Schedule'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name='executions')
    trigger_type = models.CharField(max_length=20, choices=TRIGGER_CHOICES, default='MANUAL')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    context_data = models.JSONField(default=dict, blank=True)
    trigger_payload = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    duration_ms = models.IntegerField(default=0)
    total_tokens = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.workflow.title} - {self.id} ({self.status})"

class NodeExecutionLog(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('RUNNING', 'Running'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('SKIPPED', 'Skipped'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    execution = models.ForeignKey(WorkflowExecution, on_delete=models.CASCADE, related_name='logs')
    node_id = models.CharField(max_length=100)
    node_type = models.CharField(max_length=50)
    node_title = models.CharField(max_length=150, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    input_payload = models.JSONField(default=dict, blank=True)
    output_payload = models.JSONField(default=dict, blank=True)
    execution_time_ms = models.IntegerField(default=0)
    tokens_used = models.IntegerField(default=0)
    error_trace = models.TextField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Node {self.node_id} ({self.status})"
