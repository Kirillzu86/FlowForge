import threading
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Workflow
from .serializers import WorkflowSerializer, WorkflowValidationSerializer
from .dag_validator import validate_graph
from apps.executions.models import WorkflowExecution
from apps.executions.engine import WorkflowEngine

class WorkflowViewSet(viewsets.ModelViewSet):
    queryset = Workflow.objects.all()
    serializer_class = WorkflowSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'], url_path='validate-graph')
    def validate_graph_action(self, request):
        serializer = WorkflowValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        nodes = serializer.validated_data.get("nodes", [])
        edges = serializer.validated_data.get("edges", [])
        diagnostics = validate_graph(nodes, edges)
        return Response(diagnostics)

    @action(detail=True, methods=['post'])
    def run(self, request, pk=None):
        workflow = self.get_object()
        trigger_payload = request.data.get('payload', {})

        execution = WorkflowExecution.objects.create(
            workflow=workflow,
            trigger_type='MANUAL',
            trigger_payload=trigger_payload,
            status='PENDING'
        )

        # Check if Redis/Celery is actually reachable before attempting .delay()
        # to prevent socket timeout hanging the HTTP request
        queued = False
        try:
            import redis
            from django.conf import settings
            r = redis.from_url(getattr(settings, 'CELERY_BROKER_URL', 'redis://localhost:6379/0'), socket_connect_timeout=0.2)
            r.ping()
            from apps.executions.tasks import run_workflow_execution_task
            run_workflow_execution_task.delay(str(execution.id))
            queued = True
        except Exception:
            # Redis unavailable — run immediately in local background daemon thread
            thread = threading.Thread(target=self._run_locally, args=(execution.id,))
            thread.daemon = True
            thread.start()

        return Response({
            "execution_id": str(execution.id),
            "status": "PENDING",
            "queued": queued
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post', 'get'], url_path='webhook')
    def webhook_trigger(self, request, pk=None):
        workflow = self.get_object()
        if not workflow.is_active:
            return Response({"error": "Workflow is inactive"}, status=status.HTTP_400_BAD_REQUEST)

        payload = request.data if request.method == 'POST' else dict(request.GET)
        execution = WorkflowExecution.objects.create(
            workflow=workflow,
            trigger_type='WEBHOOK',
            trigger_payload=payload,
            status='PENDING'
        )

        try:
            import redis
            from django.conf import settings
            r = redis.from_url(getattr(settings, 'CELERY_BROKER_URL', 'redis://localhost:6379/0'), socket_connect_timeout=0.2)
            r.ping()
            from apps.executions.tasks import run_workflow_execution_task
            run_workflow_execution_task.delay(str(execution.id))
        except Exception:
            thread = threading.Thread(target=self._run_locally, args=(execution.id,))
            thread.daemon = True
            thread.start()

        return Response({
            "status": "accepted",
            "execution_id": str(execution.id)
        }, status=status.HTTP_202_ACCEPTED)

    def _run_locally(self, execution_id):
        try:
            execution = WorkflowExecution.objects.get(id=execution_id)
            engine = WorkflowEngine(execution)
            engine.run()
        except Exception as e:
            print(f"Local run error: {e}")
