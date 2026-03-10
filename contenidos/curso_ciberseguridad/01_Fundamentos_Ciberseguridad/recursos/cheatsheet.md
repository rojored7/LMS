# CHEATSHEET: FUNDAMENTOS DE CIBERSEGURIDAD

## Tríada CIA

```
C - Confidencialidad: Solo acceso autorizado
I - Integridad: Protección contra modificación
A - Disponibilidad: Acceso cuando se necesita
```

## Amenazas vs Vulnerabilidades vs Riesgos

| Concepto | Ejemplo |
|----------|---------|
| Amenaza | Hacker, malware, inundación |
| Vulnerabilidad | Software sin patch, puerto abierto |
| Riesgo | Probabilidad × Impacto |

## Tipos de Malware

- **Virus**: Se replica en archivos
- **Ransomware**: Cifra y exige rescate
- **Troyano**: Aparenta ser legítimo
- **Spyware**: Roba información
- **Rootkit**: Oculta presencia

## NIST CSF - 5 Funciones

1. **IDENTIFICAR**: Conocer activos y riesgos
2. **PROTEGER**: Implementar salvaguardas
3. **DETECTAR**: Monitorear eventos
4. **RESPONDER**: Actuar ante incidentes
5. **RECUPERAR**: Restaurar servicios

## OWASP Top 10 (2021)

1. Broken Access Control
2. Cryptographic Failures
3. Injection
4. Insecure Design
5. Security Misconfiguration
6. Vulnerable Components
7. Auth Failures
8. Integrity Failures
9. Logging Failures
10. SSRF

## Cyber Kill Chain

```
Reconocimiento → Armamento → Entrega → Explotación →
Instalación → C2 → Acciones
```

## Comandos Nmap Esenciales

```bash
# Ping scan
nmap -sn 192.168.1.0/24

# Puerto scan completo
nmap -p- <IP>

# Detección de servicios
nmap -sV <IP>

# Scan agresivo
nmap -A <IP>

# Scripts de vulnerabilidad
nmap --script vuln <IP>
```

## Indicadores de Phishing

- ❌ Sentido de urgencia
- ❌ Amenazas
- ❌ Solicitud de credenciales
- ❌ Remitente sospechoso
- ❌ URLs con typos
- ❌ Errores gramaticales

## Gestión de Riesgos

**Estrategias**:
- **Mitigar**: Reducir riesgo
- **Transferir**: Seguros, terceros
- **Evitar**: Eliminar actividad
- **Aceptar**: Reconocer sin actuar

## CVSS Scoring

- 0.0: Ninguna
- 0.1-3.9: Baja
- 4.0-6.9: Media
- 7.0-8.9: Alta
- 9.0-10.0: Crítica

## Puertos Comunes

```
20/21: FTP
22: SSH
23: Telnet
25: SMTP
53: DNS
80: HTTP
443: HTTPS
3306: MySQL
3389: RDP
```

## Mejores Prácticas

✅ Principio de mínimo privilegio
✅ Defensa en profundidad
✅ Parches regulares
✅ MFA siempre que sea posible
✅ Backups offline
✅ Monitoreo continuo
✅ Educación de usuarios
✅ Documentación de incidentes
