from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({"status": "healthy", "service": "flowforge-api", "version": "1.0.0"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health-check'),
    path('api/v1/workspaces/', include('apps.workspaces.urls')),
    path('api/v1/credentials/', include('apps.credentials.urls')),
    path('api/v1/workflows/', include('apps.workflows.urls')),
    path('api/v1/executions/', include('apps.executions.urls')),
]
