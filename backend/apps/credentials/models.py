import uuid
from django.db import models
from apps.workspaces.models import Workspace
from .crypto import encrypt_value, decrypt_value

class Credential(models.Model):
    PROVIDER_CHOICES = [
        ('OPENAI', 'OpenAI'),
        ('ANTHROPIC', 'Anthropic'),
        ('GEMINI', 'Google Gemini'),
        ('DEEPSEEK', 'DeepSeek'),
        ('CUSTOM_HEADER', 'Custom HTTP Header'),
        ('BEARER_TOKEN', 'Bearer Token'),
        ('OTHER', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, null=True, blank=True, related_name='credentials')
    name = models.CharField(max_length=150)
    provider = models.CharField(max_length=50, choices=PROVIDER_CHOICES, default='OPENAI')
    encrypted_value = models.BinaryField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.provider})"

    def set_secret(self, secret: str):
        self.encrypted_value = encrypt_value(secret)

    def get_secret(self) -> str:
        return decrypt_value(self.encrypted_value)

    @property
    def masked_value(self) -> str:
        try:
            val = self.get_secret()
            if not val:
                return '••••••••'
            if len(val) <= 8:
                return '••••' + val[-2:]
            return val[:3] + '••••••••' + val[-4:]
        except Exception:
            return '••••••••'
