from rest_framework import serializers
from .models import WorkflowExecution, NodeExecutionLog

class NodeExecutionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NodeExecutionLog
        fields = [
            'id', 'node_id', 'node_type', 'node_title', 'status',
            'input_payload', 'output_payload', 'execution_time_ms',
            'tokens_used', 'error_trace', 'started_at', 'finished_at', 'created_at'
        ]

class WorkflowExecutionSerializer(serializers.ModelSerializer):
    workflow_title = serializers.ReadOnlyField(source='workflow.title')
    logs = NodeExecutionLogSerializer(many=True, read_only=True)

    class Meta:
        model = WorkflowExecution
        fields = [
            'id', 'workflow', 'workflow_title', 'trigger_type', 'status',
            'context_data', 'trigger_payload', 'error_message',
            'started_at', 'finished_at', 'duration_ms', 'total_tokens',
            'created_at', 'logs'
        ]
        read_only_fields = [
            'id', 'status', 'context_data', 'error_message',
            'started_at', 'finished_at', 'duration_ms', 'total_tokens', 'created_at'
        ]
