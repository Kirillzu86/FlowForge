from rest_framework import serializers
from .models import Credential

class CredentialSerializer(serializers.ModelSerializer):
    value = serializers.CharField(write_only=True, required=False, allow_blank=True)
    masked_value = serializers.ReadOnlyField()

    class Meta:
        model = Credential
        fields = ['id', 'workspace', 'name', 'provider', 'value', 'masked_value', 'created_at', 'updated_at']

    def create(self, validated_data):
        value = validated_data.pop('value', '')
        instance = Credential(**validated_data)
        if value:
            instance.set_secret(value)
        else:
            instance.set_secret('')
        instance.save()
        return instance

    def update(self, instance, validated_data):
        value = validated_data.pop('value', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        if value is not None and value != '':
            instance.set_secret(value)
        instance.save()
        return instance
