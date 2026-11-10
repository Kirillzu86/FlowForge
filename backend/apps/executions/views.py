import json
import time
import queue
from django.http import StreamingHttpResponse, Http404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import WorkflowExecution, NodeExecutionLog
from .serializers import WorkflowExecutionSerializer, NodeExecutionLogSerializer
from .pubsub import subscribe_channel, unsubscribe_channel

class WorkflowExecutionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkflowExecution.objects.all().prefetch_related('logs')
    serializer_class = WorkflowExecutionSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=True, methods=['get'])
    def stream(self, request, pk=None):
        try:
            execution = self.get_object()
        except Exception:
            raise Http404("Execution not found")

        channel = f"execution:{execution.id}"
        event_queue = subscribe_channel(channel)

        def event_stream():
            try:
                # 1. Yield initial state with existing logs
                initial_data = {
                    "event": "initial_state",
                    "execution_id": str(execution.id),
                    "status": execution.status,
                    "logs": [
                        {
                            "node_id": log.node_id,
                            "node_title": log.node_title,
                            "status": log.status,
                            "output": log.output_payload,
                            "execution_time_ms": log.execution_time_ms,
                            "tokens_used": log.tokens_used,
                            "error": log.error_trace
                        }
                        for log in execution.logs.all()
                    ]
                }
                yield f"event: initial_state\ndata: {json.dumps(initial_data)}\n\n"

                # If already completed or failed, terminate stream
                if execution.status in ['COMPLETED', 'FAILED', 'CANCELLED']:
                    yield f"event: execution_completed\ndata: {json.dumps({'status': execution.status})}\n\n"
                    return

                # 2. Stream live updates from queue
                last_ping = time.time()
                while True:
                    try:
                        msg = event_queue.get(timeout=2.0)
                        event_name = msg.get("event", "message")
                        data_str = json.dumps(msg.get("data", {}))
                        yield f"event: {event_name}\ndata: {data_str}\n\n"

                        if event_name in ['execution_completed', 'execution_failed']:
                            break
                    except queue.Empty:
                        # Send heartbeat ping every 15 seconds
                        now = time.time()
                        if now - last_ping > 15.0:
                            yield ": ping\n\n"
                            last_ping = now

                        # Re-check db execution status in case worker finished without pubsub delivery
                        exec_refresh = WorkflowExecution.objects.filter(id=execution.id).values('status').first()
                        if exec_refresh and exec_refresh['status'] in ['COMPLETED', 'FAILED', 'CANCELLED']:
                            yield f"event: execution_completed\ndata: {json.dumps({'status': exec_refresh['status']})}\n\n"
                            break

            finally:
                unsubscribe_channel(channel, event_queue)

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache, no-transform'
        response['X-Accel-Buffering'] = 'no'
        response['Connection'] = 'keep-alive'
        return response

class NodeExecutionLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = NodeExecutionLog.objects.all()
    serializer_class = NodeExecutionLogSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['execution', 'node_id', 'status']
