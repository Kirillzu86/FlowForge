import json
import queue
import threading
from typing import Dict, List
from django.conf import settings

# Thread-safe in-memory pubsub broker for local/dev use and tests
_in_memory_subscribers: Dict[str, List[queue.Queue]] = {}
_lock = threading.Lock()

def publish_event(channel: str, event_type: str, data: dict):
    payload = json.dumps({"event": event_type, "data": data})

    # Try publishing to Redis first if configured
    try:
        import redis
        r = redis.Redis.from_url(settings.CELERY_BROKER_URL, socket_timeout=1.0)
        r.publish(channel, payload)
    except Exception:
        pass

    # Always also push to in-memory queues for real-time local SSE
    with _lock:
        if channel in _in_memory_subscribers:
            for q in _in_memory_subscribers[channel]:
                try:
                    q.put_nowait({"event": event_type, "data": data})
                except queue.Full:
                    pass

def subscribe_channel(channel: str) -> queue.Queue:
    q = queue.Queue(maxsize=100)
    with _lock:
        if channel not in _in_memory_subscribers:
            _in_memory_subscribers[channel] = []
        _in_memory_subscribers[channel].append(q)
    return q

def unsubscribe_channel(channel: str, q: queue.Queue):
    with _lock:
        if channel in _in_memory_subscribers:
            try:
                _in_memory_subscribers[channel].remove(q)
                if not _in_memory_subscribers[channel]:
                    del _in_memory_subscribers[channel]
            except ValueError:
                pass
