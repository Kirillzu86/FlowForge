import logging
from celery import shared_task
from .models import WorkflowExecution
from .engine import WorkflowEngine

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=1, time_limit=180, soft_time_limit=120)
def run_workflow_execution_task(self, execution_id: str):
    logger.info(f"Starting execution task for execution_id: {execution_id}")
    try:
        execution = WorkflowExecution.objects.get(id=execution_id)
        engine = WorkflowEngine(execution)
        engine.run()
        return {"status": execution.status, "duration_ms": execution.duration_ms}
    except WorkflowExecution.DoesNotExist:
        logger.error(f"Execution {execution_id} not found.")
        return {"error": "Execution not found"}
    except Exception as exc:
        logger.exception(f"Unhandled error in execution {execution_id}: {exc}")
        try:
            execution = WorkflowExecution.objects.get(id=execution_id)
            execution.status = 'FAILED'
            execution.error_message = str(exc)
            execution.save(update_fields=['status', 'error_message'])
        except Exception:
            pass
        raise
