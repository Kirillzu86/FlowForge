from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkflowExecutionViewSet, NodeExecutionLogViewSet

router = DefaultRouter()
router.register(r'logs', NodeExecutionLogViewSet)
router.register(r'', WorkflowExecutionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
