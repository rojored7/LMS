# Laboratorio 05: Migración de Sistemas Legacy a ANKASecure

## Objetivos

1. Planificar migración de sistema legacy con cifrado local
2. Implementar estrategia de migración gradual sin downtime
3. Migrar claves existentes a ANKASecure KMS
4. Actualizar aplicaciones para usar ANKASecure
5. Validar integridad de datos después de migración
6. Implementar rollback en caso de problemas

## Duración: 4-5 horas

---

## Escenario: Sistema Legacy

**Sistema actual:**
- Aplicación PHP + MySQL
- Cifrado AES-256-CBC con claves hard-coded
- Claves almacenadas en archivos .env
- Sin rotación de claves
- Sin auditoría de acceso a claves
- ~1 millón de registros cifrados

**Objetivo:**
- Migrar a ANKASecure KMS
- Cero downtime
- Re-cifrar datos gradualmente
- Implementar rotación automática
- Habilitar auditoría completa

---

## Parte 1: Planificación de Migración

### 1.1 Estrategia de Migración

```
FASE 1: PREPARACIÓN (Semana 1-2)
├── Inventario de claves actuales
├── Análisis de impacto
├── Creación de claves en ANKASecure
├── Setup de entorno de staging
└── Desarrollo de herramientas de migración

FASE 2: MIGRACIÓN DUAL-WRITE (Semana 3-4)
├── Aplicación escribe en ambos sistemas
├── Datos nuevos cifrados con ANKASecure
├── Datos legacy siguen con claves locales
├── Monitoreo de performance
└── Validación de integridad

FASE 3: RE-CIFRADO EN BACKGROUND (Semana 5-8)
├── Script de re-cifrado batch
├── Proceso incremental (1000 registros/hora)
├── Validación de cada registro
├── Logs detallados de progreso
└── Checkpoint para rollback

FASE 4: CUTOVER (Semana 9)
├── Migración de lectura a ANKASecure
├── Monitoreo intensivo
├── Desactivación de claves locales
├── Limpieza de código legacy
└── Documentación final

FASE 5: POST-MIGRACIÓN (Semana 10+)
├── Rotación de claves
├── Optimización de performance
├── Auditoría de cumplimiento
└── Training del equipo
```

---

## Parte 2: Inventario de Claves Legacy

```python
#!/usr/bin/env python3
"""
Análisis de claves y datos cifrados en sistema legacy
"""

import os
import mysql.connector
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from base64 import b64decode
import json

class LegacySystemAnalyzer:
    def __init__(self):
        self.db = mysql.connector.connect(
            host="localhost",
            user="root",
            password="legacy_pass",
            database="legacy_app"
        )

    def inventory_encrypted_columns(self):
        """
        Identifica todas las columnas cifradas
        """
        print("\n" + "=" * 70)
        print("INVENTARIO DE DATOS CIFRADOS")
        print("=" * 70)

        cursor = self.db.cursor()

        # Identificar columnas con sufijo _encrypted
        cursor.execute("""
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'legacy_app'
            AND COLUMN_NAME LIKE '%_encrypted'
        """)

        encrypted_columns = []

        for (table, column, data_type) in cursor:
            # Contar registros cifrados
            cursor.execute(f"""
                SELECT COUNT(*) FROM {table}
                WHERE {column} IS NOT NULL AND {column} != ''
            """)

            count = cursor.fetchone()[0]

            encrypted_columns.append({
                "table": table,
                "column": column,
                "data_type": data_type,
                "records": count
            })

        cursor.close()

        print(f"\n✓ {len(encrypted_columns)} columnas cifradas encontradas\n")
        print(f"{'Tabla':<20} | {'Columna':<30} | {'Tipo':<15} | {'Registros':<10}")
        print("-" * 85)

        total_records = 0

        for col in encrypted_columns:
            print(f"{col['table']:<20} | {col['column']:<30} | {col['data_type']:<15} | {col['records']:<10}")
            total_records += col['records']

        print("-" * 85)
        print(f"TOTAL: {total_records:,} registros cifrados")

        return encrypted_columns

    def analyze_encryption_keys(self):
        """
        Identifica todas las claves en uso
        """
        print("\n" + "=" * 70)
        print("ANÁLISIS DE CLAVES LEGACY")
        print("=" * 70)

        # Leer claves del .env
        keys_found = []

        with open('.env.legacy', 'r') as f:
            for line in f:
                if 'ENCRYPTION_KEY' in line:
                    key_name, key_value = line.strip().split('=')
                    keys_found.append({
                        "name": key_name,
                        "value": key_value,
                        "length": len(b64decode(key_value))
                    })

        print(f"\n✓ {len(keys_found)} claves encontradas\n")
        print(f"{'Nombre':<30} | {'Longitud':<10} | {'Algoritmo':<15}")
        print("-" * 60)

        for key in keys_found:
            algo = "AES-256" if key['length'] == 32 else f"AES-{key['length']*8}"
            print(f"{key['name']:<30} | {key['length']} bytes | {algo:<15}")

        return keys_found

# Ejecutar análisis
if __name__ == "__main__":
    analyzer = LegacySystemAnalyzer()

    encrypted_cols = analyzer.inventory_encrypted_columns()
    keys = analyzer.analyze_encryption_keys()

    # Guardar inventario
    inventory = {
        "encrypted_columns": encrypted_cols,
        "encryption_keys": keys,
        "analysis_date": "2026-02-22"
    }

    with open("legacy_inventory.json", 'w') as f:
        json.dump(inventory, f, indent=2)

    print(f"\n✓ Inventario guardado en legacy_inventory.json")
```

---

## Parte 3: Creación de Claves en ANKASecure

```python
#!/usr/bin/env python3
"""
Crea claves equivalentes en ANKASecure para migración
"""

import requests
import json

ANKA_API_URL = "https://api.ankasecure.com/v1"
ANKA_API_KEY = "your_api_key"

def create_migration_keys():
    """
    Crea claves en ANKASecure para cada clave legacy
    """
    print("\n" + "=" * 70)
    print("CREANDO CLAVES EN ANKASECURE")
    print("=" * 70)

    headers = {
        "Authorization": f"Bearer {ANKA_API_KEY}",
        "Content-Type": "application/json"
    }

    # Leer inventario
    with open("legacy_inventory.json", 'r') as f:
        inventory = json.load(f)

    migration_mapping = {}

    for legacy_key in inventory["encryption_keys"]:
        # Crear clave equivalente en ANKASecure
        response = requests.post(
            f"{ANKA_API_URL}/kms/keys",
            headers=headers,
            json={
                "key_type": "SYMMETRIC",
                "algorithm": "AES_256",
                "purpose": "ENCRYPT_DECRYPT",
                "rotation_period_days": 90,
                "tags": {
                    "migration_source": legacy_key["name"],
                    "legacy_migration": "true"
                }
            },
            timeout=10
        )

        if response.status_code == 201:
            anka_key_id = response.json()["key_id"]

            migration_mapping[legacy_key["name"]] = {
                "legacy_key": legacy_key["value"],
                "anka_key_id": anka_key_id,
                "created_at": response.json()["created_at"]
            }

            print(f"✓ Clave creada: {legacy_key['name']} → {anka_key_id}")

    # Guardar mapeo
    with open("key_migration_mapping.json", 'w') as f:
        json.dump(migration_mapping, f, indent=2)

    print(f"\n✓ {len(migration_mapping)} claves creadas en ANKASecure")
    print(f"✓ Mapeo guardado en key_migration_mapping.json")

if __name__ == "__main__":
    create_migration_keys()
```

---

## Parte 4: Script de Re-Cifrado Incremental

```python
#!/usr/bin/env python3
"""
Re-cifra datos legacy usando ANKASecure
Proceso incremental con checkpoints
"""

import mysql.connector
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from base64 import b64encode, b64decode
import requests
import json
import time
from datetime import datetime

class DataMigrator:
    def __init__(self):
        self.db = mysql.connector.connect(
            host="localhost",
            user="root",
            password="legacy_pass",
            database="legacy_app"
        )

        # Cargar mapeo de claves
        with open("key_migration_mapping.json", 'r') as f:
            self.key_mapping = json.load(f)

        self.anka_api_url = "https://api.ankasecure.com/v1"
        self.anka_api_key = "your_api_key"

        # Cargar checkpoint (si existe)
        try:
            with open("migration_checkpoint.json", 'r') as f:
                self.checkpoint = json.load(f)
        except FileNotFoundError:
            self.checkpoint = {}

    def decrypt_legacy(self, ciphertext, legacy_key):
        """
        Descifra datos con clave legacy (AES-256-CBC)
        """
        ciphertext_bytes = b64decode(ciphertext)

        # Extraer IV (primeros 16 bytes)
        iv = ciphertext_bytes[:16]
        encrypted_data = ciphertext_bytes[16:]

        # Descifrar
        cipher = Cipher(
            algorithms.AES(b64decode(legacy_key)),
            modes.CBC(iv),
            backend=default_backend()
        )
        decryptor = cipher.decryptor()
        plaintext_padded = decryptor.update(encrypted_data) + decryptor.finalize()

        # Remover padding PKCS7
        padding_length = plaintext_padded[-1]
        plaintext = plaintext_padded[:-padding_length]

        return plaintext.decode('utf-8')

    def encrypt_with_anka(self, plaintext, anka_key_id):
        """
        Cifra datos con ANKASecure
        """
        headers = {
            "Authorization": f"Bearer {self.anka_api_key}",
            "Content-Type": "application/json"
        }

        response = requests.post(
            f"{self.anka_api_url}/crypto/encrypt",
            headers=headers,
            json={
                "key_id": anka_key_id,
                "plaintext": b64encode(plaintext.encode()).decode()
            },
            timeout=10
        )

        if response.status_code != 200:
            raise Exception(f"Encryption failed: {response.text}")

        return response.json()["ciphertext"]

    def migrate_table(self, table_name, column_name, batch_size=1000):
        """
        Migra una tabla completa
        """
        print(f"\n{'=' * 70}")
        print(f"MIGRANDO: {table_name}.{column_name}")
        print(f"{'=' * 70}")

        cursor = self.db.cursor()

        # Obtener total de registros
        cursor.execute(f"""
            SELECT COUNT(*) FROM {table_name}
            WHERE {column_name} IS NOT NULL AND {column_name} != ''
        """)

        total_records = cursor.fetchone()[0]

        # Obtener ID de la clave ANKA correspondiente
        legacy_key_name = "ENCRYPTION_KEY_MAIN"  # Mapear según tabla
        anka_key_id = self.key_mapping[legacy_key_name]["anka_key_id"]
        legacy_key = self.key_mapping[legacy_key_name]["legacy_key"]

        # Checkpoint: ¿dónde nos quedamos?
        checkpoint_key = f"{table_name}.{column_name}"
        start_offset = self.checkpoint.get(checkpoint_key, 0)

        print(f"\nTotal de registros: {total_records:,}")
        print(f"Ya migrados: {start_offset:,}")
        print(f"Pendientes: {total_records - start_offset:,}")

        migrated = 0
        errors = 0

        for offset in range(start_offset, total_records, batch_size):
            # Leer batch
            cursor.execute(f"""
                SELECT id, {column_name}
                FROM {table_name}
                WHERE {column_name} IS NOT NULL AND {column_name} != ''
                LIMIT {batch_size} OFFSET {offset}
            """)

            batch = cursor.fetchall()

            for (record_id, ciphertext_legacy) in batch:
                try:
                    # Descifrar con clave legacy
                    plaintext = self.decrypt_legacy(ciphertext_legacy, legacy_key)

                    # Re-cifrar con ANKASecure
                    ciphertext_anka = self.encrypt_with_anka(plaintext, anka_key_id)

                    # Actualizar registro
                    update_cursor = self.db.cursor()
                    update_cursor.execute(f"""
                        UPDATE {table_name}
                        SET {column_name} = %s,
                            {column_name}_anka_key = %s,
                            migrated_at = NOW()
                        WHERE id = %s
                    """, (ciphertext_anka, anka_key_id, record_id))

                    self.db.commit()
                    update_cursor.close()

                    migrated += 1

                except Exception as e:
                    print(f"✗ Error en registro {record_id}: {e}")
                    errors += 1

            # Actualizar checkpoint
            self.checkpoint[checkpoint_key] = offset + len(batch)

            with open("migration_checkpoint.json", 'w') as f:
                json.dump(self.checkpoint, f, indent=2)

            # Log de progreso
            progress = ((offset + len(batch)) / total_records) * 100
            print(f"  Progreso: {progress:.1f}% | Migrados: {migrated:,} | Errores: {errors}")

            # Throttling (evitar sobrecarga)
            time.sleep(0.1)

        cursor.close()

        print(f"\n✓ Migración completada:")
        print(f"  Total: {total_records:,}")
        print(f"  Exitosos: {migrated:,}")
        print(f"  Errores: {errors}")

        return migrated, errors

# Ejecutar migración
if __name__ == "__main__":
    migrator = DataMigrator()

    # Migrar tablas una por una
    tables_to_migrate = [
        ("users", "ssn_encrypted"),
        ("users", "credit_card_encrypted"),
        ("documents", "content_encrypted")
    ]

    total_migrated = 0
    total_errors = 0

    for table, column in tables_to_migrate:
        migrated, errors = migrator.migrate_table(table, column, batch_size=500)
        total_migrated += migrated
        total_errors += errors

    print(f"\n{'=' * 70}")
    print("MIGRACIÓN COMPLETA")
    print(f"{'=' * 70}")
    print(f"Total migrado: {total_migrated:,}")
    print(f"Total errores: {total_errors}")
    print(f"{'=' * 70}")
```

---

## Parte 5: Validación Post-Migración

```python
#!/usr/bin/env python3
"""
Valida integridad de datos después de migración
"""

import mysql.connector
import requests
from base64 import b64encode, b64decode
import random

def validate_migration(sample_size=100):
    """
    Valida muestra aleatoria de registros migrados
    """
    print("\n" + "=" * 70)
    print("VALIDACIÓN DE MIGRACIÓN")
    print("=" * 70)

    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="legacy_pass",
        database="legacy_app"
    )

    cursor = db.cursor()

    # Seleccionar muestra aleatoria
    cursor.execute("""
        SELECT id, ssn_encrypted, ssn_encrypted_anka_key
        FROM users
        WHERE migrated_at IS NOT NULL
        ORDER BY RAND()
        LIMIT %s
    """, (sample_size,))

    sample = cursor.fetchall()

    valid = 0
    invalid = 0

    for (record_id, ciphertext, anka_key_id) in sample:
        try:
            # Descifrar con ANKASecure
            decrypted = decrypt_with_anka(ciphertext, anka_key_id)

            # Validar formato (ejemplo: SSN debe ser XXX-XX-XXXX)
            if len(decrypted) == 11 and decrypted[3] == '-' and decrypted[6] == '-':
                valid += 1
            else:
                print(f"✗ Formato inválido en registro {record_id}: {decrypted}")
                invalid += 1

        except Exception as e:
            print(f"✗ Error descifrando registro {record_id}: {e}")
            invalid += 1

    cursor.close()
    db.close()

    print(f"\n{'=' * 70}")
    print("RESULTADOS DE VALIDACIÓN")
    print(f"{'=' * 70}")
    print(f"Muestra: {sample_size}")
    print(f"Válidos: {valid} ({(valid/sample_size)*100:.1f}%)")
    print(f"Inválidos: {invalid} ({(invalid/sample_size)*100:.1f}%)")

    if invalid == 0:
        print(f"\n✓✓ MIGRACIÓN EXITOSA - 100% de integridad ✓✓")
    else:
        print(f"\n⚠️  ATENCIÓN: {invalid} registros con problemas")

def decrypt_with_anka(ciphertext, key_id):
    """Helper para descifrar con ANKASecure"""
    # Implementación similar a ejemplos anteriores
    pass

if __name__ == "__main__":
    validate_migration(sample_size=500)
```

---

## Evidencias

1. **Plan de migración** detallado con timelines
2. **Inventario** de claves y datos cifrados
3. **Logs** del proceso de re-cifrado
4. **Reportes** de validación de integridad
5. **Documentación** de rollback procedures

## Recursos

- AWS Database Migration Service: Strategies
- Zero-Downtime Migration Patterns
- Data Validation Techniques
- Rollback Strategies for Production

🚀 **Migrar sistemas legacy es complejo, pero con planificación adecuada es posible sin downtime!** 🔐
