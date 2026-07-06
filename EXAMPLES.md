# Kuntur Threat Intelligence - Ejemplos de Consultas

Esta guía proporciona ejemplos prácticos de cómo consultar cada fuente de inteligencia de Kuntur.

## Índice

- [Comandos Básicos](#comandos-básicos)
- [Fuentes de Threat Intelligence](#fuentes-de-threat-intelligence)
- [Fuentes Contextuales](#fuentes-contextuales)
- [Consultas Avanzadas](#consultas-avanzadas)
- [Integraciones](#integraciones)

---

## Comandos Básicos

### Ejecutar briefing completo

```bash
npm run kuntur
```

### Ejecutar solo threat intelligence

```bash
npm run kuntur:threat
```

### Ejecutar solo fuentes contextuales

```bash
npm run kuntur:context
```

### Guardar resultado con timestamp

```bash
npm run kuntur > briefings/kuntur-$(date +%Y%m%d-%H%M%S).json
```

---

## Fuentes de Threat Intelligence

### DemoReplay

Genera eventos de ataque sintéticos para demostraciones.

```bash
# Ejecutar fuente
npm run kuntur:demo

# Obtener solo eventos de Bolivia
npm run kuntur:demo | jq '.events[] | select(.involves_bolivia == true)'

# Contar eventos por severidad
npm run kuntur:demo | jq '.stats.by_severity'

# Obtener eventos críticos
npm run kuntur:demo | jq '.events[] | select(.severity == "critical")'
```

### AbuseIPDB

Consulta IPs reportadas como maliciosas.

```bash
# Ejecutar fuente
npm run kuntur:abuseipdb

# Ver métricas agregadas
npm run kuntur:abuseipdb | jq '.metrics'

# Obtener IPs con confidence score alto
npm run kuntur:abuseipdb | jq '.events[] | select(.confidence > 0.8)'

# Ver top IPs maliciosas
npm run kuntur:abuseipdb | jq '.metrics.topIPs[:5]'

# Contar por país
npm run kuntur:abuseipdb | jq '.metrics.byCountry | to_entries | sort_by(.value) | reverse | .[:10]'
```

#### Consulta de IP específica (manual)

```bash
# Requiere modificar la fuente o usar curl directo
curl -G https://api.abuseipdb.com/api/v2/check \
  --data-urlencode "ipAddress=8.8.8.8" \
  --data-urlencode "maxAgeInDays=90" \
  -H "Key: TU_API_KEY" | jq
```

### GreyNoise

Detecta IPs que escanean internet.

```bash
# Ejecutar fuente
npm run kuntur:greynoise

# Ver si hitió rate limit
npm run kuntur:greynoise | jq '.rate_limit_hit'

# Obtener solo eventos maliciosos
npm run kuntur:greynoise | jq '.events[] | select(.severity == "high")'

# Ver metadata de la API
npm run kuntur:greynoise | jq '.metadata'
```

#### Consulta de IP específica (manual)

```bash
# Community API (sin auth, 10/día)
curl https://api.greynoise.io/v3/community/185.220.101.1 | jq

# Con API key (50/week)
curl -H "key: TU_API_KEY" \
  https://api.greynoise.io/v3/community/185.220.101.1 | jq
```

### OTX (AlienVault)

Threat intelligence comunitario.

```bash
# Ejecutar fuente
npm run kuntur:otx

# Ver pulsos maliciosos
npm run kuntur:otx | jq '.events[] | select(.severity == "high")'

# Obtener tags de amenazas
npm run kuntur:otx | jq '.events[].raw_pulse.tags'

# Ver families de malware
npm run kuntur:otx | jq '.events[].raw_pulse.malware_families'
```

#### Consulta de indicador específico (manual)

```bash
# Consultar IP
curl -H "X-OTX-API-KEY: TU_API_KEY" \
  https://otx.alienvault.com/api/v1/indicator/IPv4/185.220.101.1/general | jq

# Consultar dominio
curl -H "X-OTX-API-KEY: TU_API_KEY" \
  https://otx.alienvault.com/api/v1/indicator/domain/example.com/general | jq

# Consultar URL
curl -H "X-OTX-API-KEY: TU_API_KEY" \
  https://otx.alienvault.com/api/v1/indicator/URL/http://example.com/general | jq
```

### Shodan

Dispositivos expuestos en internet.

```bash
# Ejecutar fuente
npm run kuntur:shodan

# Ver dispositivos con vulnerabilidades
npm run kuntur:shodan | jq '.events[] | select(.severity == "critical")'

# Obtener tipos de dispositivos
npm run kuntur:shodan | jq '.events[].raw_host.product'

# Filtrar por país
npm run kuntur:shodan | jq '.events[] | select(.source_country == "BO")'
```

#### Consulta de búsqueda específica (manual)

```bash
# Buscar dispositivos vulnerables
curl "https://api.shodan.io/shodan/host/search?key=TU_API_KEY&query=vuln:&limit=20" | jq

# Buscar dispositivos en Bolivia
curl "https://api.shodan.io/shodan/host/search?key=TU_API_KEY&query=country:BO&limit=20" | jq

# Consultar IP específica
curl "https://api.shodan.io/shodan/host/TARGET_IP?key=TU_API_KEY" | jq

# Búsqueda por puerto
curl "https://api.shodan.io/shodan/host/search?key=TU_API_KEY&query=port:22&limit=20" | jq
```

### T-Pot

Datos de honeypot local.

```bash
# Ejecutar fuente (requiere T-Pot corriendo)
npm run kuntur:tpot

# Ver si está configurado
npm run kuntur:tpot | jq '.configured'

# Ver eventos por tipo de ataque
npm run kuntur:tpot | jq '.events[] | .attack_type' | sort | uniq -c
```

---

## Fuentes Contextuales

### CISA-KEV

Vulnerabilidades explotadas activamente.

```bash
# Ejecutar fuente
npm run kuntur:cisa

# Ver resumen ejecutivo
npm run kuntur:cisa | jq '.summary'

# Ver señales generadas
npm run kuntur:cisa | jq '.signals[]'

# Obtener CVEs recientes (últimos 30 días)
npm run kuntur:cisa | jq '.vulnerabilities[] | {cveID, dateAdded, product}'

# Ver CVEs relacionados con ransomware
npm run kuntur:cisa | jq '.vulnerabilities[] | select(.knownRansomwareCampaignUse == "Known")'

# Top vendors vulnerables
npm run kuntur:cisa | jq '.summary.topVendors[:10]'

# Productos "calientes" (múltiples CVEs recientes)
npm run kuntur:cisa | jq '.summary.hotProducts'
```

#### Consulta directa (sin Kuntur)

```bash
# Feed completo de CISA KEV
curl https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json | jq

# Contar CVEs en el catálogo
curl https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json | jq '.vulnerabilities | length'

# CVEs agregados en los últimos 30 días
curl https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json | \
  jq '.vulnerabilities[] | select(.dateAdded > "2025-06-05")'
```

### Cloudflare-Radar

Outages de internet y anomalías de tráfico.

```bash
# Ejecutar fuente
npm run kuntur:cloudflare-radar  # (via full briefing)

# Ver outages activos
npm run kuntur:cloudflare-radar | jq '.outages.active'

# Top ubicaciones afectadas
npm run kuntur:cloudflare-radar | jq '.outages.topAffectedLocations[:10]'

# Ver anomalías de tráfico
npm run kuntur:cloudflare-radar | jq '.anomalies.events'

# Ver señales generadas
npm run kuntur:cloudflare-radar | jq '.signals'
```

#### Consulta directa (con API token)

```bash
# Outages recientes (30 días)
curl -H "Authorization: Bearer TU_TOKEN" \
  "https://api.cloudflare.com/client/v4/radar/annotations/outages?dateRange=30d&format=json" | jq

# Anomalías de tráfico (7 días)
curl -H "Authorization: Bearer TU_TOKEN" \
  "https://api.cloudflare.com/client/v4/radar/traffic_anomalies?dateRange=7d&format=json&limit=50" | jq

# Resumen de ataques DDoS por protocolo
curl -H "Authorization: Bearer TU_TOKEN" \
  "https://api.cloudflare.com/client/v4/radar/attacks/layer3/summary/protocol?dateRange=7d&format=json" | jq
```

### WHO

Brotes de enfermedades.

```bash
# Ejecutar fuente
npm run kuntur:who  # (via full briefing)

# Ver brotes recientes
npm run kuntur:who | jq '.diseaseOutbreakNews[] | {title, date}'

# Filtrar por palabras clave
npm run kuntur:who | jq '.diseaseOutbreakNews[] | select(.summary | test("measles"; "i"))'
```

#### Consulta directa

```bash
# Feed JSON de Disease Outbreak News
curl "https://www.who.int/api/news/diseaseoutbreaknews" | \
  jq '.value[] | {Title, PublicationDate, Summary}'
```

### NOAA/NWS

Alertas climáticas severas (US).

```bash
# Ejecutar fuente
npm run kuntur:noaa  # (via full briefing)

# Ver resumen por tipo
npm run kuntur:noaa | jq '.summary'

# Ver alertas top
npm run kuntur:noaa | jq '.topAlerts[] | {event, severity, areas}'

# Filtrar por tipo específico
npm run kuntur:noaa | jq '.topAlerts[] | select(.event | test("tornado"; "i"))'
```

#### Consulta directa

```bash
# Alertas activas (todas)
curl "https://api.weather.gov/alerts/active?status=actual" | \
  jq '.features[] | .properties'

# Solo severas/extremas
curl "https://api.weather.gov/alerts/active?status=actual&severity=Severe,Extreme" | \
  jq '.features[] | .properties'

# Alertas de tornado
curl "https://api.weather.gov/alerts/active?status=actual&event=Tornado%20Warning" | \
  jq '.features[] | .properties'
```

---

## Consultas Avanzadas

### Análisis de amenazas de Bolivia

```bash
# Conteo de eventos que involucran Bolivia
npm run kuntur | jq '[.attackEvents[][] | select(.involves_bolivia == true)] | length'

# Detalle de eventos de Bolivia
npm run kuntur | jq '[.attackEvents[][] | select(.involves_bolivia == true)]'

# Eventos críticos de Bolivia
npm run kuntur | jq '[.attackEvents[][] | select(.involves_bolivia == true and .severity == "critical")]'

# Por tipo de ataque en Bolivia
npm run kuntur | jq '[.attackEvents[][] | select(.involves_bolivia == true)] | group_by(.attack_type) | map({type: .[0].attack_type, count: length})'
```

### Análisis de severidad

```bash
# Distribución de severidad (todas las fuentes)
npm run kuntur | jq '.intelligence.attack_events.by_severity'

# Eventos críticos por fuente
npm run kuntur | jq '[.attackEvents[][] | select(.severity == "critical")] | group_by(.source_feed) | map({source: .[0].source_feed, count: length})'

# Top 10 eventos más confiables
npm run kuntur | jq '[.attackEvents[][]] | sort_by(.confidence) | reverse | .[:10]'
```

### Análisis temporal

```bash
# Eventos de última hora
npm run kuntur | jq '[.attackEvents[][] | select(.timestamp > "'$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)'")]'

# Eventos de última hora por tipo
npm run kuntur | jq '[.attackEvents[][] | select(.timestamp > "'$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)'")] | group_by(.attack_type) | map({type: .[0].attack_type, count: length})'
```

### Correlación entre fuentes

```bash
# IPs que aparecen en múltiples fuentes
npm run kuntur | jq '.attackEvents | to_entries | .[].value | .[].source_ip' | sort | uniq -c | sort -rn | awk '$1 > 1'

# Patrones de ataque similares
npm run kuntur | jq '[.attackEvents[][]] | group_by(.attack_type, .severity) | map({type: .[0].attack_type, severity: .[0].severity, count: length}) | sort_by(.count) | reverse'
```

### Comparación de timings

```bash
# Tiempo de ejecución por fuente
npm run kuntur | jq '.timing | to_entries | map({source: .key, ms: .value.ms, status: .value.status}) | sort_by(.ms)'

# Fuentes más lentas
npm run kuntur | jq '.timing | to_entries | sort_by(.value.ms) | reverse | .[:3]'
```

---

## Integraciones

### Con Splunk

```bash
# Enviar briefing a Splunk via HEC
npm run kuntur | curl -X POST "https://your-splunk:8088/services/collector/event" \
  -H "Authorization: Splunk YOUR_HEC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sourcetype": "_json", "event": '"$(cat)"'}'
```

### Con Elasticsearch

```bash
# Indexar briefing en Elasticsearch
npm run kuntur | curl -X POST "localhost:9200/kuntur-briefings/_doc" \
  -H "Content-Type: application/json" \
  -d @-
```

### Con Discord Webhook

```bash
# Alerta de eventos de Bolivia
bolivia_count=$(npm run kuntur --silent | jq '.intelligence.attack_events.bolivia_events')
if [ "$bolivia_count" -gt 0 ]; then
  curl -X POST "$DISCORD_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "{\"content\": \"⚠️ $bolivia_count eventos de amenaza involucran Bolivia\"}"
fi
```

### Con Telegram Bot

```bash
# Enviar resumen a Telegram
npm run kuntur | jq -r '.intelligence.signals[] | "\(.severity): \(.title)"' | \
  curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -d chat_id="$TELEGRAM_CHAT_ID" \
  -d text="$(cat /dev/stdin)"
```

---

## Scripts de Monitoreo

### Monitoreo continuo

```bash
#!/bin/bash
# kuntur-monitor.sh

while true; do
  timestamp=$(date +%Y%m%d-%H%M%S)
  output="briefings/kuntur-$timestamp.json"

  echo "[$(date)] Ejecutando briefing..."
  npm run kuntur --silent > "$output"

  # Extraer métricas clave
  total_events=$(jq '.intelligence.attack_events.total_events' "$output")
  bolivia_events=$(jq '.intelligence.attack_events.bolivia_events' "$output")
  critical_count=$(jq '.intelligence.attack_events.by_severity.critical' "$output")

  echo "[$(date)] Total: $total_events | Bolivia: $bolivia_events | Critical: $critical_count"

  # Alerta si hay críticos
  if [ "$critical_count" -gt 0 ]; then
    echo "[$(date)] ⚠️  ALERTA: $critical_count eventos críticos detectados"
  fi

  sleep 900  # 15 minutos
done
```

### Dashboard simple

```bash
#!/bin/bash
# kuntur-dashboard.sh

clear
while true; do
  data=$(npm run kuntur --silent 2>/dev/null)

  clear
  echo "=== KUNTUR THREAT INTELLIGENCE ==="
  echo "Actualizado: $(date +%H:%M:%S)"
  echo ""

  echo "📊 ESTADÍSTICAS"
  echo "  Total Eventos: $(echo "$data" | jq '.intelligence.attack_events.total_events')"
  echo "  Bolivia:       $(echo "$data" | jq '.intelligence.attack_events.bolivia_events')"
  echo ""

  echo "⚠️  POR SEVERIDAD"
  echo "  Critical: $(echo "$data" | jq '.intelligence.attack_events.by_severity.critical // 0')"
  echo "  High:     $(echo "$data" | jq '.intelligence.attack_events.by_severity.high // 0')"
  echo "  Medium:   $(echo "$data" | jq '.intelligence.attack_events.by_severity.medium // 0')"
  echo "  Low:      $(echo "$data" | jq '.intelligence.attack_events.by_severity.low // 0')"
  echo ""

  echo "🔍 SEÑALES"
  echo "$data" | jq -r '.intelligence.signals[]? | "  \(.severity): \(.title)"'

  sleep 60
done
```

---

## Tips y Trucos

### Reducir salida

```bash
# Solo señales de inteligencia
npm run kuntur --silent | jq '.intelligence.signals'

# Solo métricas
npm run kuntur --silent | jq '.intelligence.attack_events'

# Solo errores
npm run kuntur --silent | jq '.errors'
```

### Formato customizado

```bash
# Tabla de eventos
npm run kuntur --silent | \
  jq -r '.attackEvents[][] | [.timestamp, .attack_type, .severity, .source_country] | @tsv'

# Lista de IPs maliciosas
npm run kuntur --silent | \
  jq -r '.attackEvents.AbuseIPDB[]?.source_ip' | sort -u
```

### Comparación temporal

```bash
# Comparar dos briefings
diff <(jq . briefings/kuntur-before.json) \
     <(jq . briefings/kuntur-after.json)
```

---

## Referencias

- [AbuseIPDB API Docs](https://abuseipdb.com/api)
- [GreyNoise API Docs](https://docs.greynoise.io/)
- [AlienVault OTX API](https://otx.alienvault.com/api)
- [Shodan API Docs](https://developer.shodan.io/api)
- [CISA KEV Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)
- [Cloudflare Radar API](https://developers.cloudflare.com/radar/)
- [WHO API](https://www.who.int/api)
- [NOAA/NWS API](https://www.weather.gov/documentation/services-web-api)
