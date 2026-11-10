from rest_framework import viewsets, permissions
from .models import Workspace, WorkspaceMembership
from .serializers import WorkspaceSerializer, WorkspaceMembershipSerializer

class WorkspaceViewSet(viewsets.ModelViewSet):
    queryset = Workspace.objects.all()
    serializer_class = WorkspaceSerializer
    permission_classes = [permissions.AllowAny]

class WorkspaceMembershipViewSet(viewsets.ModelViewSet):
    queryset = WorkspaceMembership.objects.all()
    serializer_class = WorkspaceMembershipSerializer
    permission_classes = [permissions.AllowAny]
