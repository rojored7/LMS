# Laboratorio 04: Aplicación Full-Stack con ANKASecure

## Objetivos

1. Desarrollar una aplicación web completa con cifrado E2E
2. Integrar ANKASecure en backend (Python/Node.js)
3. Implementar autenticación segura con JWT firmados
4. Cifrar datos sensibles antes de almacenar en DB
5. Desplegar aplicación en Docker con secrets management

## Duración: 4-5 horas

---

## Arquitectura de la Aplicación

```
┌─────────────────┐
│   FRONTEND      │
│   (React/Vue)   │
│                 │
│ - Login con MFA │
│ - Dashboard     │
│ - File Upload   │
└────────┬────────┘
         │ HTTPS
         │
┌────────┴────────┐
│  API GATEWAY    │
│  (Express.js)   │
│                 │
│ - Auth Middleware│
│ - Rate Limiting │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───┴───┐ ┌──┴──────┐
│Backend│ │ANKASecure│
│Service│◄─┤  API    │
│       │  │         │
│Flask  │  │- KMS    │
│FastAPI│  │- Crypto │
└───┬───┘  └─────────┘
    │
┌───┴────┐
│Database│
│Postgres│
│(encrypted)
└────────┘
```

---

## Parte 1: Backend con Flask + ANKASecure

```python
#!/usr/bin/env python3
"""
API Backend con cifrado de PII usando ANKASecure
"""

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from dotenv import load_dotenv
import requests
from base64 import b64encode, b64decode
from datetime import datetime, timedelta
import jwt
import uuid

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///secure_app.db'
app.config['SECRET_KEY'] = os.getenv('APP_SECRET_KEY')
CORS(app)

db = SQLAlchemy(app)

# Configuración ANKASecure
ANKA_API_URL = os.getenv('ANKASECURE_API_URL')
ANKA_API_KEY = os.getenv('ANKASECURE_API_KEY')
ENCRYPTION_KEY_ID = os.getenv('ENCRYPTION_KEY_ID')

# === MODELOS ===

class User(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100))
    ssn_encrypted = db.Column(db.Text)  # Cifrado con ANKASecure
    phone_encrypted = db.Column(db.Text)
    password_hash = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self, include_sensitive=False):
        data = {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "created_at": self.created_at.isoformat()
        }

        if include_sensitive:
            # Descifrar PII solo cuando es necesario
            data["ssn"] = decrypt_with_anka(self.ssn_encrypted)
            data["phone"] = decrypt_with_anka(self.phone_encrypted)

        return data

# === FUNCIONES CRIPTOGRÁFICAS ===

def encrypt_with_anka(plaintext):
    """
    Cifra datos usando ANKASecure
    """
    headers = {
        "Authorization": f"Bearer {ANKA_API_KEY}",
        "Content-Type": "application/json"
    }

    response = requests.post(
        f"{ANKA_API_URL}/crypto/encrypt",
        headers=headers,
        json={
            "key_id": ENCRYPTION_KEY_ID,
            "plaintext": b64encode(plaintext.encode()).decode()
        },
        timeout=10
    )

    if response.status_code != 200:
        raise Exception(f"Encryption failed: {response.text}")

    return response.json()["ciphertext"]

def decrypt_with_anka(ciphertext):
    """
    Descifra datos usando ANKASecure
    """
    headers = {
        "Authorization": f"Bearer {ANKA_API_KEY}",
        "Content-Type": "application/json"
    }

    response = requests.post(
        f"{ANKA_API_URL}/crypto/decrypt",
        headers=headers,
        json={
            "key_id": ENCRYPTION_KEY_ID,
            "ciphertext": ciphertext
        },
        timeout=10
    )

    if response.status_code != 200:
        raise Exception(f"Decryption failed: {response.text}")

    plaintext_b64 = response.json()["plaintext"]
    return b64decode(plaintext_b64).decode()

# === AUTENTICACIÓN ===

def generate_jwt(user_id):
    """
    Genera JWT firmado
    """
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }

    token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm="HS256")
    return token

def verify_jwt(token):
    """
    Verifica JWT
    """
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        return payload["user_id"]
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# Middleware de autenticación
from functools import wraps

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')

        if not token:
            return jsonify({"error": "Token requerido"}), 401

        # Extraer token (formato: "Bearer <token>")
        try:
            token = token.split(" ")[1]
        except IndexError:
            return jsonify({"error": "Formato de token inválido"}), 401

        user_id = verify_jwt(token)

        if not user_id:
            return jsonify({"error": "Token inválido o expirado"}), 401

        # Pasar user_id a la función
        return f(user_id, *args, **kwargs)

    return decorated_function

# === ENDPOINTS ===

@app.route('/api/auth/register', methods=['POST'])
def register():
    """
    Registro de usuario con cifrado de PII
    """
    try:
        data = request.json

        # Validar datos requeridos
        if not data.get('email') or not data.get('password'):
            return jsonify({"error": "Email y password requeridos"}), 400

        # Verificar si usuario ya existe
        if User.query.filter_by(email=data['email']).first():
            return jsonify({"error": "Usuario ya existe"}), 409

        # Cifrar datos sensibles con ANKASecure
        ssn_encrypted = encrypt_with_anka(data.get('ssn', ''))
        phone_encrypted = encrypt_with_anka(data.get('phone', ''))

        # Hash de password (en producción usar bcrypt)
        from hashlib import sha256
        password_hash = sha256(data['password'].encode()).hexdigest()

        # Crear usuario
        user = User(
            id=str(uuid.uuid4()),
            email=data['email'],
            name=data.get('name'),
            ssn_encrypted=ssn_encrypted,
            phone_encrypted=phone_encrypted,
            password_hash=password_hash
        )

        db.session.add(user)
        db.session.commit()

        # Generar JWT
        token = generate_jwt(user.id)

        return jsonify({
            "message": "Usuario creado exitosamente",
            "user_id": user.id,
            "token": token
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """
    Login de usuario
    """
    data = request.json

    user = User.query.filter_by(email=data['email']).first()

    if not user:
        return jsonify({"error": "Credenciales inválidas"}), 401

    # Verificar password
    from hashlib import sha256
    password_hash = sha256(data['password'].encode()).hexdigest()

    if user.password_hash != password_hash:
        return jsonify({"error": "Credenciales inválidas"}), 401

    # Generar JWT
    token = generate_jwt(user.id)

    return jsonify({
        "message": "Login exitoso",
        "token": token,
        "user": user.to_dict()
    }), 200

@app.route('/api/users/me', methods=['GET'])
@require_auth
def get_current_user(user_id):
    """
    Obtiene datos del usuario autenticado
    """
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    # Incluir datos sensibles descifrados (solo para el propio usuario)
    return jsonify(user.to_dict(include_sensitive=True)), 200

@app.route('/api/users/<user_id>', methods=['GET'])
@require_auth
def get_user(current_user_id, user_id):
    """
    Obtiene datos de otro usuario (sin PII si no es admin)
    """
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    # Solo incluir PII si es el mismo usuario o es admin
    include_sensitive = (current_user_id == user_id)

    return jsonify(user.to_dict(include_sensitive=include_sensitive)), 200

@app.route('/api/health', methods=['GET'])
def health():
    """
    Health check
    """
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "anka_connected": True  # En producción, verificar conexión real
    }), 200

# === INICIALIZACIÓN ===

@app.before_first_request
def create_tables():
    """
    Crear tablas de BD
    """
    db.create_all()
    print("✓ Tablas de base de datos creadas")

if __name__ == '__main__':
    print("\n" + "=" * 70)
    print("API BACKEND CON ANKASECURE INICIADA")
    print("=" * 70)
    print("\nEndpoints:")
    print("  POST /api/auth/register - Registro")
    print("  POST /api/auth/login - Login")
    print("  GET /api/users/me - Datos del usuario autenticado")
    print("  GET /api/users/<id> - Datos de usuario")
    print("  GET /api/health - Health check")
    print("\n" + "=" * 70 + "\n")

    app.run(debug=True, port=5000)
```

**Ejecutar:**
```bash
pip install flask flask-sqlalchemy flask-cors pyjwt python-dotenv requests

python3 app.py
```

---

## Parte 2: Frontend (React)

```javascript
// src/services/apiService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

class APIService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': this.token ? `Bearer ${this.token}` : ''
    };
  }

  async register(userData) {
    const response = await axios.post(`${API_URL}/auth/register`, userData);

    if (response.data.token) {
      this.setToken(response.data.token);
    }

    return response.data;
  }

  async login(email, password) {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });

    if (response.data.token) {
      this.setToken(response.data.token);
    }

    return response.data;
  }

  async getCurrentUser() {
    const response = await axios.get(`${API_URL}/users/me`, {
      headers: this.getHeaders()
    });

    return response.data;
  }

  async getUser(userId) {
    const response = await axios.get(`${API_URL}/users/${userId}`, {
      headers: this.getHeaders()
    });

    return response.data;
  }
}

export default new APIService();
```

```javascript
// src/components/Register.jsx
import React, { useState } from 'react';
import apiService from '../services/apiService';

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    ssn: '',
    phone: ''
  });

  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const result = await apiService.register(formData);
      setMessage(`Usuario creado: ${result.user_id}`);

      // Redirigir a dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="register-container">
      <h2>Registro Seguro con ANKASecure</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />

        <input
          type="text"
          placeholder="Nombre completo"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
        />

        <input
          type="text"
          placeholder="SSN (será cifrado)"
          value={formData.ssn}
          onChange={(e) => setFormData({...formData, ssn: e.target.value})}
        />

        <input
          type="tel"
          placeholder="Teléfono (será cifrado)"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
        />

        <button type="submit">Registrar</button>
      </form>

      {message && <div className="message">{message}</div>}

      <div className="security-badge">
        🔐 Tus datos sensibles se cifran con ANKASecure antes de almacenarse
      </div>
    </div>
  );
}

export default Register;
```

---

## Parte 3: Despliegue con Docker

```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Variables de entorno (se sobrescriben en docker-compose)
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - ANKASECURE_API_URL=${ANKASECURE_API_URL}
      - ANKASECURE_API_KEY=${ANKASECURE_API_KEY}
      - ENCRYPTION_KEY_ID=${ENCRYPTION_KEY_ID}
      - APP_SECRET_KEY=${APP_SECRET_KEY}
      - DATABASE_URL=postgresql://user:pass@db:5432/secure_app
    depends_on:
      - db
    networks:
      - secure_network
    secrets:
      - anka_api_key

  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=secure_app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - secure_network

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    networks:
      - secure_network

networks:
  secure_network:
    driver: bridge

volumes:
  postgres_data:

secrets:
  anka_api_key:
    file: ./secrets/anka_api_key.txt
```

**Desplegar:**
```bash
docker-compose up -d
```

---

## Parte 4: Tests de Integración

```python
#!/usr/bin/env python3
"""
Tests de integración para la aplicación
"""

import pytest
import requests

BASE_URL = "http://localhost:5000/api"

def test_register_user():
    """
    Test de registro de usuario
    """
    data = {
        "email": "test@example.com",
        "password": "SecurePass123!",
        "name": "Test User",
        "ssn": "123-45-6789",
        "phone": "+1234567890"
    }

    response = requests.post(f"{BASE_URL}/auth/register", json=data)

    assert response.status_code == 201
    assert "token" in response.json()
    assert "user_id" in response.json()

    return response.json()["token"]

def test_login_user():
    """
    Test de login
    """
    data = {
        "email": "test@example.com",
        "password": "SecurePass123!"
    }

    response = requests.post(f"{BASE_URL}/auth/login", json=data)

    assert response.status_code == 200
    assert "token" in response.json()

    return response.json()["token"]

def test_get_current_user():
    """
    Test de obtención de usuario autenticado
    """
    token = test_login_user()

    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/users/me", headers=headers)

    assert response.status_code == 200
    user_data = response.json()

    # Verificar que PII está descifrado
    assert "ssn" in user_data
    assert user_data["ssn"] == "123-45-6789"  # Descifrado correctamente

if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("EJECUTANDO TESTS DE INTEGRACIÓN")
    print("=" * 70 + "\n")

    test_register_user()
    print("✓ Test de registro: PASÓ")

    token = test_login_user()
    print("✓ Test de login: PASÓ")

    test_get_current_user()
    print("✓ Test de datos de usuario: PASÓ")

    print("\n" + "=" * 70)
    print("TODOS LOS TESTS PASARON ✓✓")
    print("=" * 70)
```

---

## Evidencias

1. **Screenshots** de la aplicación funcionando
2. **Postman collection** con todos los endpoints
3. **Logs** de operaciones criptográficas
4. **Métricas** de performance (latencia, throughput)

## Recursos

- Flask Documentation: https://flask.palletsprojects.com/
- React Security Best Practices
- Docker Secrets Management
- OWASP API Security Top 10

🚀 **Una aplicación full-stack segura es la culminación de todos los conocimientos del curso!**
