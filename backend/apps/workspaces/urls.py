from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkspaceViewSet, WorkspaceMembershipViewSet

router = DefaultRouter()
router.register(r'memberships', WorkspaceMembershipViewSet)
router.register(r'', WorkspaceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
