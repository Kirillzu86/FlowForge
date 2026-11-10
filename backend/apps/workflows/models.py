import uuid
from django.db import models
from apps.workspaces.models import Workspace

class Workflow(models.Model):
    STATUS_CHOICES = [
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('RUNNING', 'Running'),
        ('NEVER_RUN', 'Never run'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, null=True, blank=True, related_name='workflows')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    version = models.IntegerField(default=1)
    nodes = models.JSONField(default=list)
    edges = models.JSONField(default=list)
    variables = models.JSONField(default=dict, blank=True)
    webhook_token = models.CharField(max_length=64, unique=True, default=uuid.uuid4, editable=False)
    last_run_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEVER_RUN')
    last_run_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.title
