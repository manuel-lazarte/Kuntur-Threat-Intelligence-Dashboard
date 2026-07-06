# Kuntur Threat Intelligence - Implementación Completa

## 🎯 Descripción del Proyecto

Kuntur es un sistema de **Cyber Threat Intelligence** que monitorea amenazas cibernéticas en tiempo real, con enfoque especial en Bolivia. Integra múltiples fuentes de threat intelligence para proporcionar una visión completa del panorama de amenazas.

## 📊 Fuentes de Threat Intelligence

### ✅ Fuentes Implementadas y Funcionando

| Fuente | Descripción | API Key | Estado |
|--------|-------------|---------|--------|
| **CISA-KEV** | Vulnerabilidades explotadas activamente | No necesita | ✅ Funcionando |
| **AbuseIPDB** | IPs reportadas como maliciosas | Configurada | ✅ Funcionando |
| **GreyNoise** | IPs que escanean internet | Configurada | ⚠️ Límite agotado |
| **OTX** | Threat intelligence comunitario | Configurada | ✅ Funcionando |
| **DemoReplay** | Datos simulados para demos | No necesita | ✅ Funcionando |

### ❌ Fuentes Requieren Configuración

| Fuente | Descripción | API Key | Estado |
|--------|-------------|---------|--------|
| **Shodan** | Dispositivos expuestos en internet | Necesita key | ❌ Pendiente |

## 🚀 Uso Rápido

```bash
# Ejecutar briefing completo (todas las fuentes)
node apis/briefing.mjs

# Ejecutar fuente específica
node apis/sources/cisa-kev.mjs
node apis/sources/abuseipdb.mjs
node apis/sources/greynoise.mjs
```

## 🔧 Configuración de API Keys

Las API keys se configuran en el archivo `.env`:

```bash
# AbuseIPDB (ya configurado)
ABUSEIPDB_API_KEY=8b0f21e2a1fe8aa87eb552f647274d33b040abd270fc802c994ddad263fe23a33b4dc8b7565ebcef

# GreyNoise (ya configurado - límite agotado hasta semana próxima)
GREYNOISE_API_KEY=estoeslakeydegreynoise

# Shodan (pendiente)
# SHODAN_API_KEY=tu_key_aqui

# OTX (pendiente)
# OTX_API_KEY=tu_key_aqui
```

## 📁 Estructura del Proyecto

```
kuntur/
├── apis/
│   ├── briefing.mjs           # Orquestador principal
│   ├── sources/
│   │   ├── demo-replay.mjs    # Datos simulados
│   │   ├── cisa-kev.mjs       # CISA Vulnerabilidades
│   │   ├── abuseipdb.mjs      # IPs maliciosas
│   │   ├── greynoise.mjs      # IPs escaneando internet
│   │   ├── shodan.mjs         # Dispositivos expuestos
│   │   └── otx.mjs            # Threat exchange
│   └── utils/
│       ├── fetch.mjs          # Utilidades HTTP
│       └── env.mjs            # Variables de entorno
├── .env                       # API keys
└── README-IMPLEMENTACION.md   # Este archivo
```

## 🧪 Pruebas Realizadas

### CISA-KEV
```bash
curl "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
# Resultado: 1,631 CVEs activos
```

### AbuseIPDB
```bash
curl -G https://api.abuseipdb.com/api/v2/check \
  --data-urlencode "ipAddress=8.8.8.8" \
  -H "Key: TU_API_KEY"
# Resultado: Datos de IP obtenidos correctamente
```

### GreyNoise
```bash
curl -H "key: estoeslakeydegreynoise" \
  https://api.greynoise.io/v3/community/185.220.101.1
# Resultado: IP maliciosa detectada (noise=true)
# Nota: Límite semanal agotado (25/week)
```

### OTX AlienVault
```bash
curl -H "X-OTX-API-KEY: ae2f8458c4b138473ac7f8e3bc9aef2431c31247dce29f366c0f267137f81e0b" \
  https://otx.alienvault.com/api/v1/indicator/IPv4/185.220.101.1/general
# Resultado: 50 pulses asociados (webscanners, anonymization)
```

## 📈 Salida del Briefing

El briefing genera un JSON con:

```json
{
  "kuntur": {
    "version": "1.0.0",
    "timestamp": "2026-07-05T12:00:00Z",
    "totalDurationMs": 5000,
    "sourcesQueried": 10,
    "sourcesOk": 7,
    "sourcesFailed": 3
  },
  "attackEvents": {
    "CISA-KEV": [...],
    "AbuseIPDB": [...],
    "GreyNoise": [...],
    "OTX": [...]
  },
  "sources": {
    "CISA-KEV": { "summary": {...}, "vulnerabilities": [...] },
    "AbuseIPDB": { "events": [...], "metrics": {...} },
    "GreyNoise": { "events": [...], "rate_limit_hit": true },
    "OTX": { "pulses": [...], "reputation_data": {...} }
  }
}
```

## 🎓 Para Tu Proyecto Universitario

### Presentación
1. **Mostrar CISA-KEV**: Vulnerabilidades activas del gobierno USA
2. **Mostrar AbuseIPDB**: IPs maliciosas reportadas
3. **Explicar GreyNoise**: IPs que escanean internet
4. **Demo**: Usar DemoReplay si fallan las APIs

### Casos de Uso
- **SOC**: Monitorear amenazas en tiempo real
- **CSIRT**: Investigar IPs sospechosas
- **Blue Team**: Correlacionar threat intel
- **Académico**: Investigación de ciberamenazas

## 🔗 Referencias

- [CISA KEV Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)
- [AbuseIPDB API](https://abuseipdb.com/api)
- [GreyNoise API](https://docs.greynoise.io/docs/using-the-greynoise-community-api)
- [Shodan API](https://developer.shodan.io/api)
- [AlienVault OTX](https://otx.alienvault.com/api)

## 📝 Notas Importantes

1. **GreyNoise**: Límite de 25 consultas/semana (plan Community)
2. **AbuseIPDB**: Funciona perfectamente con la key configurada
3. **CISA-KEV**: No requiere autenticación, datos oficiales
4. **DemoReplay**: Siempre disponible para demos sin APIs

---

**Generado:** 2026-07-05
**Versión:** 1.0.0
**Estado:** Listo para uso académico
