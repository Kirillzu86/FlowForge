from rest_framework import serializers
from .models import Workflow
from .dag_validator import validate_graph

class WorkflowSerializer(serializers.ModelSerializer):
    graph_diagnostics = serializers.SerializerMethodField()

    class Meta:
        model = Workflow
        fields = [
            'id', 'workspace', 'title', 'description', 'is_active', 'version',
            'nodes', 'edges', 'variables', 'webhook_token', 'last_run_status',
            'last_run_at', 'created_at', 'updated_at', 'graph_diagnostics'
        ]
        read_only_fields = ['id', 'webhook_token', 'created_at', 'updated_at', 'last_run_status', 'last_run_at']

    def get_graph_diagnostics(self, obj):
        nodes = obj.nodes or []
        edges = obj.edges or []
        return validate_graph(nodes, edges)

class WorkflowValidationSerializer(serializers.Serializer):
    nodes = serializers.ListField(child=serializers.DictField(), required=True)
    edges = serializers.ListField(child=serializers.DictField(), required=True)
