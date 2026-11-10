import time
from datetime import datetime, timezone
from typing import Dict, Any, Set, List
from apps.workflows.dag_validator import validate_graph, CyclicDependencyError
from apps.workflows.models import Workflow
from .models import WorkflowExecution, NodeExecutionLog
from .handlers import get_handler_for_type
from .pubsub import publish_event

class WorkflowEngine:
    def __init__(self, execution: WorkflowExecution):
        self.execution = execution
        self.workflow: Workflow = execution.workflow
        self.channel = f"execution:{execution.id}"

    def run(self):
        execution = self.execution
        execution.status = 'RUNNING'
        execution.started_at = datetime.now(timezone.utc)
        execution.save(update_fields=['status', 'started_at'])

        publish_event(self.channel, 'execution_started', {
            'execution_id': str(execution.id),
            'workflow_id': str(self.workflow.id),
            'timestamp': execution.started_at.isoformat()
        })

        nodes = self.workflow.nodes or []
        edges = self.workflow.edges or []
        diagnostics = validate_graph(nodes, edges)

        if diagnostics.get("has_cycle"):
            error_msg = diagnostics.get("error", "Граф содержит запрещенные циклы")
            execution.status = 'FAILED'
            execution.error_message = error_msg
            execution.finished_at = datetime.now(timezone.utc)
            execution.duration_ms = int((execution.finished_at - execution.started_at).total_seconds() * 1000)
            execution.save()

            self.workflow.last_run_status = 'FAILED'
            self.workflow.last_run_at = execution.finished_at
            self.workflow.save(update_fields=['last_run_status', 'last_run_at'])

            publish_event(self.channel, 'execution_failed', {
                'execution_id': str(execution.id),
                'error': error_msg,
                'cycle_nodes': diagnostics.get("cycle_nodes", [])
            })
            return

        # Prepare adjacency and handles
        nodes_map = {n["id"]: n for n in nodes}
        adj_edges: Dict[str, List[Dict[str, Any]]] = {}
        for edge in edges:
            src = edge.get("source")
            if src not in adj_edges:
                adj_edges[src] = []
            adj_edges[src].append(edge)

        # Context setup
        context = {
            "workflow": {
                "id": str(self.workflow.id),
                "title": self.workflow.title
            },
            "trigger": {
                "payload": execution.trigger_payload or {}
            },
            "nodes": {},
            "variables": self.workflow.variables or {}
        }

        # Create pending log entries for all nodes
        logs_map: Dict[str, NodeExecutionLog] = {}
        for n in nodes:
            log = NodeExecutionLog.objects.create(
                execution=execution,
                node_id=n["id"],
                node_type=n.get("type", "unknown"),
                node_title=n.get("data", {}).get("title") or n.get("data", {}).get("label") or n.get("id"),
                status='PENDING'
            )
            logs_map[n["id"]] = log

        skipped_nodes: Set[str] = set()
        total_tokens = 0
        has_node_failure = False

        levels = diagnostics.get("levels", [])

        for level in levels:
            for node_id in level:
                node = nodes_map.get(node_id)
                log = logs_map[node_id]

                if node_id in skipped_nodes:
                    log.status = 'SKIPPED'
                    log.save(update_fields=['status'])
                    publish_event(self.channel, 'node_skipped', {
                        'node_id': node_id,
                        'status': 'SKIPPED'
                    })
                    # Propagate skipped status down
                    for e in adj_edges.get(node_id, []):
                        skipped_nodes.add(e.get("target"))
                    continue

                # Run node
                log.status = 'RUNNING'
                log.started_at = datetime.now(timezone.utc)
                log.save(update_fields=['status', 'started_at'])

                publish_event(self.channel, 'node_started', {
                    'node_id': node_id,
                    'node_title': log.node_title,
                    'status': 'RUNNING',
                    'timestamp': log.started_at.isoformat()
                })

                # Small delay to allow SSE clients to witness state transitions
                time.sleep(0.3)

                start_perf = time.perf_counter()
                handler = get_handler_for_type(node.get("type", "trigger"))
                result = handler.execute(node, context)
                elapsed_ms = int((time.perf_counter() - start_perf) * 1000)

                log.finished_at = datetime.now(timezone.utc)
                log.execution_time_ms = elapsed_ms
                log.tokens_used = result.tokens_used
                total_tokens += result.tokens_used
                log.output_payload = result.output

                if result.error:
                    log.status = 'FAILED'
                    log.error_trace = result.error
                    log.save()
                    has_node_failure = True

                    publish_event(self.channel, 'node_finished', {
                        'node_id': node_id,
                        'status': 'FAILED',
                        'error': result.error,
                        'output': result.output,
                        'execution_time_ms': elapsed_ms,
                        'tokens_used': result.tokens_used
                    })
                    # Stop further execution or continue? Usually halt current branch
                    for e in adj_edges.get(node_id, []):
                        skipped_nodes.add(e.get("target"))
                else:
                    log.status = 'SUCCESS'
                    log.save()
                    context["nodes"][node_id] = {"output": result.output}

                    publish_event(self.channel, 'node_finished', {
                        'node_id': node_id,
                        'status': 'SUCCESS',
                        'output': result.output,
                        'execution_time_ms': elapsed_ms,
                        'tokens_used': result.tokens_used
                    })

                    # Handle condition branching
                    if result.active_handle:
                        # Find outgoing edges and mark non-active branches for skipping
                        for e in adj_edges.get(node_id, []):
                            handle = str(e.get("sourceHandle", "")).lower()
                            if handle and handle != str(result.active_handle).lower():
                                skipped_nodes.add(e.get("target"))

        # Finalize Execution
        execution.finished_at = datetime.now(timezone.utc)
        execution.duration_ms = int((execution.finished_at - execution.started_at).total_seconds() * 1000)
        execution.total_tokens = total_tokens
        execution.context_data = context

        if has_node_failure:
            execution.status = 'FAILED'
            execution.error_message = "Ошибка при выполнении одного или нескольких узлов воркфлоу"
            self.workflow.last_run_status = 'FAILED'
        else:
            execution.status = 'COMPLETED'
            self.workflow.last_run_status = 'SUCCESS'

        execution.save()
        self.workflow.last_run_at = execution.finished_at
        self.workflow.save(update_fields=['last_run_status', 'last_run_at'])

        publish_event(self.channel, 'execution_completed', {
            'execution_id': str(execution.id),
            'status': execution.status,
            'duration_ms': execution.duration_ms,
            'total_tokens': execution.total_tokens,
            'error': execution.error_message
        })
