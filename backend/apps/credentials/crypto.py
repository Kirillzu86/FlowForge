from cryptography.fernet import Fernet
from django.conf import settings

def get_cipher():
    key = settings.FERNET_KEY
    if isinstance(key, str):
        key = key.encode()
    return Fernet(key)

def encrypt_value(value: str) -> bytes:
    if not value:
        return b''
    cipher = get_cipher()
    return cipher.encrypt(value.encode('utf-8'))

def decrypt_value(encrypted: bytes) -> str:
    if not encrypted:
        return ''
    cipher = get_cipher()
    if isinstance(encrypted, memoryview):
        encrypted = bytes(encrypted)
    decrypted = cipher.decrypt(encrypted)
    return decrypted.decode('utf-8')
