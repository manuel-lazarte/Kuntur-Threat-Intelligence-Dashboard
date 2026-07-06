# Kuntur Threat Intelligence

> Your own cyber threat intelligence terminal. 10 sources. One command. Zero cloud.

Kuntur es un sistema de **Cyber Threat Intelligence** que monitorea amenazas cibernéticas en tiempo real, con enfoque especial en Bolivia. Integra múltiples fuentes de threat intelligence para proporcionar una visión completa del panorama de amenazas.

## Características

- **10 fuentes de inteligencia** - Threat intelligence y contextuales
- **Ejecución paralela** - Todas las fuentes se consultan simultáneamente
- **Manejo robusto de errores** - Una fuente fallida no detiene el briefing
- **Enfoque Bolivia** - Detección de amenazas que involucren Bolivia
- **Cero dependencias cloud** - Todo corre localmente
- **Salida JSON estructurada** - Fácil de integrar con otros sistemas

## Quick Start

```bash
# 1. Clonar el repositorio
git clone https://github.com/yourusername/kuntur.git
cd kuntur

# 2. Instalar dependencias
npm install

# 3. Configurar API keys (opcional)
cp .env.example .env
# Editar .env con tus API keys

# 4. Ejecutar briefing completo
npm run kuntur

# O ejecutar solo threat intel
npm run kuntur:threat
```

## Fuentes de Inteligencia

### Fuentes de Threat Intelligence (6)

| Fuente | Descripción | API Key | Estado |
|--------|-------------|---------|--------|
| **DemoReplay** | Datos simulados para demostraciones | No necesita | ✅ Siempre disponible |
| **T-Pot** | Honeypot T-Pot (local) | Opcional | ⚠️ Requiere instalación |
| **AbuseIPDB** | IPs reportadas como maliciosas | Gratis | ✅ Requiere key |
| **GreyNoise** | IPs que escanean internet | Gratis | ✅ Requiere key |
| **OTX** | Threat intelligence comunitario | Gratis | ✅ Requiere key |
| **Shodan** | Dispositivos expuestos en internet | Gratis | ✅ Requiere key |

### Fuentes Contextuales (4)

| Fuente | Descripción | API Key | Estado |
|--------|-------------|---------|--------|
| **CISA-KEV** | Vulnerabilidades explotadas activamente | No | ✅ Siempre disponible |
| **Cloudflare-Radar** | Outages de internet y anomalías | Gratis | ⚠️ Requiere key |
| **WHO** | Brotes de enfermedades | No | ✅ Siempre disponible |
| **NOAA/NWS** | Alertas climáticas severas (US) | No | ✅ Siempre disponible |

## Comandos Disponibles

### Briefing Completo

```bash
npm run kuntur                    # Ejecuta todas las fuentes (10)
npm run kuntur:threat             # Solo threat intel (6 fuentes)
npm run kuntur:context            # Solo contextuales (4 fuentes)
```

### Fuentes Individuales

```bash
npm run kuntur:demo               # DemoReplay (datos simulados)
npm run kuntur:cisa               # CISA-KEV (vulnerabilidades)
npm run kuntur:abuseipdb          # AbuseIPDB (IPs maliciosas)
npm run kuntur:greynoise          # GreyNoise (escaneo internet)
npm run kuntur:otx                # OTX (threat exchange)
npm run kuntur:shodan             # Shodan (dispositivos expuestos)
npm run kuntur:tpot               # T-Pot (honeypot)
```

## Configuración de API Keys

Crea un archivo `.env` en la raíz del proyecto:

```bash
# AbuseIPDB - Obtén tu key en: https://abuseipdb.com/account/api
ABUSEIPDB_API_KEY=tu_key_aqui

# GreyNoise - Obtén tu key en: https://greynoise.io/account
GREYNOISE_API_KEY=tu_key_aqui

# OTX AlienVault - Obtén tu key en: https://otx.alienvault.com/api
OTX_API_KEY=tu_key_aqui

# Shodan - Obtén tu key en: https://shodan.io/member/api
SHODAN_API_KEY=tu_key_aqui

# Cloudflare Radar - Opcional
CLOUDFLARE_API_TOKEN=tu_token_aqui

# T-Pot Honeypot - Opcional (URL local)
TPOT_API_URL=http://localhost:64242
TPOT_API_KEY=tu_key_aqui
```

## Formato de Salida

### Estructura del JSON

```json
{
  "kuntur": {
    "version": "2.0.0",
    "timestamp": "2026-07-05T12:00:00Z",
    "totalDurationMs": 5000,
    "sourcesQueried": 10,
    "sourcesOk": 7,
    "sourcesConfigured": 5,
    "sourcesUnconfigured": 2,
    "sourcesFailed": 0
  },
  "intelligence": {
    "signals": [
      {
        "severity": "critical",
        "title": "Critical Threats Detected",
        "description": "3 critical attack events detected"
      }
    ],
    "attack_events": {
      "total_events": 45,
      "bolivia_events": 3,
      "by_attack_type": {
        "brute_force": 12,
        "port_scan": 8,
        "malware_c2": 5
      },
      "by_severity": {
        "critical": 3,
        "high": 15,
        "medium": 20,
        "low": 7
      }
    },
    "context_data": {
      "cisa_vulnerabilities": 1631,
      "cisa_recent_additions": 23,
      "who_outbreaks": 5,
      "noaa_severe_alerts": 12
    }
  },
  "attackEvents": {
    "DemoReplay": [...],
    "AbuseIPDB": [...],
    "GreyNoise": [...],
    "OTX": [...]
  },
  "sources": {
    "CISA-KEV": {...},
    "Cloudflare-Radar": {...},
    "WHO": {...},
    "NOAA": {...}
  },
  "errors": [],
  "timing": {
    "DemoReplay": { "status": "ok", "ms": 150 },
    "AbuseIPDB": { "status": "ok", "ms": 1200 },
    ...
  }
}
```

## Tipos de Atque Detectados

| Tipo | Descripción | MITRE ID |
|------|-------------|----------|
| `port_scan` | Escaneo de puertos | T1595 |
| `brute_force` | Ataque de fuerza bruta | T1110 |
| `malware_c2` | Malware/C2 | T1071 |
| `ddos` | Ataque DDoS | T1498 |
| `exploit_attempt` | Intento de exploit | T1190 |
| `recon` | Reconocimiento | T1590 |
| `exfiltration` | Exfiltración de datos | T1041 |
| `sql_injection` | Inyección SQL | T1190 |
| `web_attack` | Ataque web | T1190 |
| `impersonation` | Impersonación | T1596 |

## Ejemplos de Uso

### 1. Ejecutar briefing completo y guardar resultado

```bash
npm run kuntur > kuntur-briefing-$(date +%Y%m%d-%H%M%S).json
```

### 2. Filtrar eventos críticos de Bolivia

```bash
npm run kuntur | jq '.intelligence.attack_events.bolivia_events'
```

### 3. Ver solo señales de inteligencia

```bash
npm run kuntur | jq '.intelligence.signals[]'
```

### 4. Obtener estadísticas de fuentes

```bash
npm run kuntur | jq '.kuntur | {sourcesQueried, sourcesOk, sourcesFailed}'
```

### 5. Ejecutar solo threat intelligence

```bash
npm run kuntur:threat | jq '.sources | keys'
```

## Integración con Otros Sistemas

### Python

```python
import json
import subprocess

# Ejecutar briefing
result = subprocess.run(['npm', 'run', 'kuntur'], capture_output=True, text=True)
data = json.loads(result.stdout)

# Acceder a eventos de ataque
for source, events in data['attackEvents'].items():
    for event in events:
        print(f"{source}: {event['attack_type']} - {event['severity']}")
```

### JavaScript/Node.js

```javascript
import { fullBriefing } from './apis/briefing.mjs';

const briefing = await fullBriefing();

// Filtrar eventos críticos
const criticalEvents = briefing.intelligence.attack_events.by_severity.critical;

console.log(`Eventos críticos detectados: ${criticalEvents}`);
```

### Shell Script

```bash
#!/bin/bash
# Monitor de amenazas de Bolivia

while true; do
  bolivia_events=$(npm run kuntur --silent | \
    jq '.intelligence.attack_events.bolivia_events')

  if [ "$bolivia_events" -gt 0 ]; then
    echo "⚠️  Alerta: $bolivia_events eventos involucran Bolivia"
    # Enviar notificación...
  fi

  sleep 900  # Cada 15 minutos
done
```

## Métricas y Monitoreo

### Tiempos de Ejecución

Cada fuente incluye su tiempo de ejecución en `timing`:

```json
"timing": {
  "DemoReplay": { "status": "ok", "ms": 150 },
  "AbuseIPDB": { "status": "ok", "ms": 1200 },
  "GreyNoise": { "status": "ok", "ms": 800 }
}
```

### Estados de Fuente

- `ok` - Fuente ejecutada correctamente
- `error` - Error en la ejecución
- `configured: false` - Falta API key

### Señales de Inteligencia

El sistema genera automáticamente señales cuando detecta:
- Amenazas críticas
- Actividad relacionada con Bolivia
- Nuevas vulnerabilidades CISA
- Outages de internet activos
- Brotes de enfermedades
- Clima severo

## Limitaciones de APIs Gratuitas

| API | Límite Gratis | Plan Enterprise |
|-----|---------------|----------------|
| AbuseIPDB | 1,000 requests/día | 100,000/día |
| GreyNoise | 50/week | 500,000/día |
| OTX | 20/minute | Custom |
| Shodan | 100/month | Unlimited |

## Troubleshooting

### Una fuente falla pero otras funcionan

Es comportamiento normal. Kuntur está diseñado para continuar incluso si algunas fuentes fallan.

### GreyNoise retorna rate limit

El plan gratuito de GreyNoise tiene límite de 50 consultas/semana. Espera a que se renueve o actualiza a Enterprise.

### Shodan no retorna datos

Verifica que tu API key sea válida y no haya excedido el límite mensual.

### CISA-KEV timeout

El feed de CISA puede tardar más de 30 segundos. Aumenta `SOURCE_TIMEOUT_MS` en `briefing.mjs` si es necesario.

## Estructura del Proyecto

```
kuntur/
├── apis/
│   ├── briefing.mjs           # Orquestador principal
│   ├── sources/
│   │   ├── demo-replay.mjs    # Datos simulados
│   │   ├── cisa-kev.mjs       # CISA Vulnerabilidades
│   │   ├── abuseipdb.mjs      # IPs maliciosas
│   │   ├── greynoise.mjs      # IPs escaneando internet
│   │   ├── otx.mjs            # Threat exchange
│   │   ├── shodan.mjs         # Dispositivos expuestos
│   │   ├── tpot.mjs           # Honeypot
│   │   ├── cloudflare-radar.mjs
│   │   ├── who.mjs
│   │   └── noaa.mjs
│   └── utils/
│       ├── fetch.mjs          # Utilidades HTTP
│       └── env.mjs            # Variables de entorno
├── .env                       # API keys
├── package.json
└── README-KUNTUR.md
```

## Licencia

AGPL-3.0

## Contribuir

Found a bug? Want to add a source? PRs welcome. Each source is a standalone module in `apis/sources/` — just export a `briefing()` function that returns structured data and add it to the orchestrator in `apis/briefing.mjs`.

## Contacto

For partnerships, integrations, or other inquiries, open an issue on GitHub.
