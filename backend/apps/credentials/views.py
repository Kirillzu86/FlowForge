from rest_framework import viewsets, permissions
from .models import Credential
from .serializers import CredentialSerializer

class CredentialViewSet(viewsets.ModelViewSet):
    queryset = Credential.objects.all()
    serializer_class = CredentialSerializer
    permission_classes = [permissions.AllowAny]
