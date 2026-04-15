"""Centralized validation functions."""
import re


def validate_password_strength(password: str) -> str:
    """Validate password meets security requirements. Returns password if valid, raises ValueError otherwise."""
    if len(password) < 8:
        raise ValueError("La contrasena debe tener al menos 8 caracteres")
    if len(password) > 128:
        raise ValueError("La contrasena no debe exceder 128 caracteres")
    if not re.search(r"[A-Z]", password):
        raise ValueError("La contrasena debe tener al menos una mayuscula")
    if not re.search(r"[a-z]", password):
        raise ValueError("La contrasena debe tener al menos una minuscula")
    if not re.search(r"[0-9]", password):
        raise ValueError("La contrasena debe tener al menos un numero")
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?~`]", password):
        raise ValueError("La contrasena debe tener al menos un caracter especial")
    return password
