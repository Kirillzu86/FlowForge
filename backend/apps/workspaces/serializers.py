from rest_framework import serializers
from .models import Workspace, WorkspaceMembership

class WorkspaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workspace
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']

class WorkspaceMembershipSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = WorkspaceMembership
        fields = ['id', 'workspace', 'user', 'username', 'email', 'role', 'created_at']
