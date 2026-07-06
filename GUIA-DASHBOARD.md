# 🎯 Kuntur Dashboard - Guía Visual Completa

## 📱 Estructura del Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  🔝 TOPBAR                                                       │
│  KUNTUR THREAT INTEL  |  🌍 Todos 🌎SA 🌎NA 🌍EU 🌏AS 🌍AF      │
│  Total: 150 | Critical: 12 | Fuentes: 4/10                       │
├───────────┬─────────────────────────────────┬────────────────────┤
│  📊       │  🌍 MAPA GLOBAL (GLOBO/PLANO)  │  ⚡ EVENTOS       │
│  LEFT     │                                 │  FEED             │
│  PANEL    │  • Arcos de ataques animados    │  • Cards de       │
│           │  • Puntos de origen            │    eventos        │
│  📈       │  • Botones de filtros          │  • Detalles       │
│  Stats    │  • Indicador DEMO/REAL         │  • Badges de      │
│  🌍       │                                 │    verificación  │
│  Ataques  │                                 │                   │
│  ⚠️       │                                 │                   │
│  Severidad│                                 │                   │
│  🎯       │                                 │                   │
│  Tipos    │                                 │                   │
│  📊       │                                 │                   │
│  Países   │                                 │                   │
│  🇧🇴       │                                 │                   │
│  Bolivia  │                                 │                   │
│  📡       │                                 │                   │
│  Fuentes  │                                 │                   │
└───────────┴─────────────────────────────────┴────────────────────┘
```

## 🎨 Sistema de Validación de Datos

### 🔴 vs 🟢 Indicadores Visuales

| Indicador | Significado | Apariencia |
|-----------|-------------|------------|
| **⚠️ DEMO** | Datos simulados | Banner naranja arriba |
| **✓ DATOS REALES** | Threat intel verificado | Banner verde arriba |
| **✓ VERIFICADO [Fuente]** | Evento con datos reales | Badge verde en card |
| **⚠️ SIMULADO** | Evento generado | Badge naranja en card |

### 🏷️ Badges de Verificación por Fuente

```
┌─────────────────────────────────────────────────────────────┐
│  ✓ VERIFICADO AbuseIPDB    ✓ VERIFICADO OTX               │
│  ✓ VERIFICADO GreyNoise    ⚠️ SIMULADO                    │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Componentes del Dashboard

### 1. 🔝 TOPBAR

```
KUNTUR THREAT INTEL
├─ Filtros continentales: 🌍 Todos | 🌎 Sudamérica | 🌎 Norteamérica | ...
├─ Estadísticas rápidas:
│  ├─ Total eventos: 150
│  ├─ Critical: 12
│  └─ Fuentes: 4/10
```

### 2. 📊 LEFT PANEL - Estadísticas

#### 🌍 ATAQUES GLOBALES
```
┌─────────────────────────┐
│ Total Eventos: 150      │
│ ████████████░░ 100%     │
│ Todos los eventos del   │
│ último sweep            │
└─────────────────────────┘
```

#### ⚠️ POR SEVERIDAD
```
┌─────────────────────────┐
│ 🔴 Critical: 12         │
│ ████████░░░░  60%       │
│ Requieren respuesta     │
│ inmediata               │
├─────────────────────────┤
│ 🟠 High: 35             │
│ ██████████░░  80%       │
│ Monitoreo prioritario   │
├─────────────────────────┤
│ 🟡 Medium: 45           │
│ ████████████  75%       │
│ Investigación rec.      │
├─────────────────────────┤
│ 🟢 Low: 58              │
│ ████████████  90%       │
│ Monitoreo routine       │
└─────────────────────────┘
```

#### 🎯 TIPOS DE ATAQUE
```
┌─────────────────────────┐
│ Port Scan: 45           │
│ ████████████░░  80%     │
├─────────────────────────┤
│ Brute Force: 32         │
│ ████████░░░░  60%       │
├─────────────────────────┤
│ DDoS: 18                │
│ ██████░░░░░  50%        │
└─────────────────────────┘
```

#### 📊 ORIGEN DE ATAQUES
```
┌─────────────────────────┐
| Rusia (RU): 28         │
| ████████████  85%       │
├─────────────────────────┤
| China (CN): 24         │
| ████████░░░  70%       │
├─────────────────────────┤
| Bolivia (BO): 15 🇧🇴   │
| ██████░░░░░  55%       │
└─────────────────────────┘
```

#### 🇧🇴 PRIORIDADES BOLIVIA
```
┌─────────────────────────┐
│ Eventos Bolivia: 15    │
│ Click en "Ver solo     │
│ prioridades" para      │
│ filtrar                │
└─────────────────────────┘
```

#### 📡 FUENTES DE DATOS
```
┌─────────────────────────┐
│ CISA-KEV         ✓ OK  │
│ AbuseIPDB        ✓ OK  │
│ GreyNoise        ✓ OK  │
│ OTX              ✓ OK  │
│ DemoReplay       ✓ OK  │
│ Shodan           ✗ Err │
└─────────────────────────┘
```

### 3. 🌍 MAPA GLOBAL

#### Modo Globo (3D)
```
        🌍
       ╱  ╲
   🌏  │  │  🌎
      │ 🇧🇴│
     ╱    ╲
    🌎     🌏

Arcos animados:
━ 🔴 Critical (grosor 1.5px)
━ 🟠 High (grosor 1.2px)
━ 🔵 Medium/Low (grosor 0.8px)

Puntos de origen:
● 🔴 Ataques críticos
● 🟠 Ataques alta severidad
● 🔵 Bolivia (rojo brillante)
```

#### Modo Plano (2D)
```
┌──────────────────────────────┐
│                              │
│   🌎🌏🌍 Mapa mundial       │
│                              │
│   Arcos animados             │
│   Markers de origen          │
│   Filtros por continente     │
│                              │
└──────────────────────────────┘
```

#### Botones de Control
```
┌────────────────┐
│ MUNDO          │ ← Vista global
│ BOLIVIA        │ ← Centrar en Bolivia
│ CRIT           │ ← Toggle critical
│ ALTA           │ ← Toggle high
└────────────────┘
```

#### Indicador de Datos
```
┌──────────────────────┐
│ ⚠️ DEMO             │ ← Datos simulados
│ ✓ DATOS REALES      │ ← Threat intel verificado
└──────────────────────┘
```

### 4. ⚡ RIGHT PANEL - Event Feed

#### 📝 Event Card (Completo)

```
┌───────────────────────────────────────────────┐
│ PORT SCAN            15:32:10 • NUEVO         │
├───────────────────────────────────────────────┤
│ Ataque desde 185.220.101.1                   │
│ 📍 Origen: Rusia (RU) → Destino: Bolivia (BO)│
│                                               │
│ 🎯 Severidad: HIGH  📊 Confianza: 85%        │
│ 📡 Fuente: AbuseIPDB                         │
│ ✓ VERIFICADO AbuseIPDB  📋 Reportes: 127      │
│                                               │
│ ⚠️ Prioridad Bolivia - VERIFICADO             │
│ 🛡️ MITRE: T1595                              │
└───────────────────────────────────────────────┘
```

#### 🏷️ Badges de Validación

```
✓ VERIFICADO AbuseIPDB     → Datos reales verified
✓ VERIFICADO OTX           → Threat intel comunitario
✓ VERIFICADO GreyNoise     → IP escaneando internet
⚠️ SIMULADO                → Datos de demo
```

## 🔍 Modal de Detalles

### 📋 Panel de Información Completa

```
┌─────────────────────────────────────────────────────────────┐
│ 🔴 CRITICAL  PORT SCAN                                [×]    │
├───────────┬───────────────────┬─────────────────────────────┤
│           │  ⚔️ Detalles       │  🔍 Verificación            │
│  🌍      │  ─────────────     │  ────────────               │
│ Ubicación │  Tipo: Port Scan   │  🔗 Verificar en             │
│           │  Severidad: High   │  AbuseIPDB                   │
│ ORIGEN   │  Confianza: 85%    │                             │
│ 185.220  │  ███████████ 85%   │  🕐 Timestamp                │
│ Rusia    │  Fuente: AbuseIPDB │  2026-07-05 15:32:10        │
│    ➜     │  MITRE: T1595      │  Hace 2 minutos             │
│ DESTINO  │                   │                             │
│ Bolivia  │  📂 Categorías:    │  📋 Datos Crudos            │
│           │  • Port Scan      │  {                          │
│           │  • Recon          │   "ip": "185.220.101.1",    │
│           │                   │   "reports": 127,           │
│ ⚠️ Bolivia│                  │   "country": "RU",           │
│           │                   │   ...                        │
└───────────┴───────────────────┴─────────────────────────────┘
```

## 🎨 Códigos de Colores

### Severidad
```
🔴 Critical - #ff3333
🟠 High     - #ffb84c
🟡 Medium   - #64f0c8
🟢 Low      - #4a9eff
```

### Validación
```
✓ Real        - Verde brillante #64f0c8
⚠️ Simulado   - Naranja #ffb84c
```

### Bolivia
```
🇧🇴 Prioridad - Rojo brillante #ff3333
```

## 📡 Fuentes de Datos y Qué Representan

| Fuente | Qué representa | Validación |
|--------|---------------|------------|
| **CISA-KEV** | Vulnerabilidades explotadas oficialmente | ✓ Gobierno USA |
| **AbuseIPDB** | IPs reportadas por comunidad | ✓ 127+ reportes |
| **GreyNoise** | IPs escaneando internet activamente | ✓ noise=true |
| **OTX** | Threat intelligence comunitario | ✓ 50+ pulses |
| **DemoReplay** | Datos simulados para demo | ⚠️ Simulado |

## 🚀 Cómo Usar el Dashboard

### 1. **Verificar Autenticidad de Datos**
- Mira el **banner superior**:
  - ⚠️ DEMO = Todo simulado
  - ✓ DATOS REALES = Hay threat intel verificado

### 2. **Identificar Eventos Reales**
- Busca badges **"✓ VERIFICADO"** en las cards
- Click en el evento para ver detalles completos

### 3. **Verificar IP Individual**
- Click en evento → Modal de detalles
- Botón **"🔗 Verificar en AbuseIPDB"** abre link oficial

### 4. **Filtrar por Prioridad**
- Click en **"🇧🇴 Prioridades Bolivia"** para ver ataques relacionados
- Usa filtros continentales para foco regional

### 5. **Analizar Patrones**
- Observa **arcos animados** en mapa
- **Puntos rojos** = ataques críticos
- **Arco hacia Bolivia** = prioridad automática

## 💡 Tips para Tu Presentación Universitaria

1. **Muestra primero datos simulados** - Explica que es para demo
2. **Cambia a datos reales** - Muestra la diferencia visual
3. **Click en un evento AbuseIPDB** - Muestra el link de verificación
4. **Enfócate en Bolivia** - Muestra el feature de priorización
5. **Explica cada fuente** - Qué representa y cómo se valida

---

**Este dashboard te permite:**
✓ Verificar autenticidad de cada dato
✓ Distinguir entre real y simulado visualmente
✓ Validar IP contra fuentes oficiales
✓ Priorizar amenazas hacia Bolivia
✓ Analizar patrones geográficos
