#!/usr/bin/env node
// Kuntur API Rate Limit Monitor
// Monitorea límites de API y previene desperdicio de cuota
// Para proyecto universitario - control preciso de llamadas API

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// === CONFIGURACIÓN DE LÍMITES DE API ===
const API_LIMITS = {
  abuseipdb: {
    name: 'AbuseIPDB',
    limit: 1000,           // 1,000 requests/día (plan gratuito)
    period: 'daily',        // Renueva cada 24h
    key: 'ABUSEIPDB_API_KEY',
    endpoint: 'https://api.abuseipdb.com/api/v2/check'
  },
  greynoise: {
    name: 'GreyNoise',
    limit: 25,             // 25 requests/semana (plan Community)
    period: 'weekly',       // Renueva cada 7 días
    key: 'GREYNOISE_API_KEY',
    endpoint: 'https://api.greynoise.io/v3/community'
  },
  otx: {
    name: 'OTX AlienVault',
    limit: 1200,           // 20/minuto = 1,200/hora
    period: 'hourly',       // Renueva cada hora
    key: 'OTX_API_KEY',
    endpoint: 'https://otx.alienvault.com/api/v1'
  },
  shodan: {
    name: 'Shodan',
    limit: 100,            // 100 requests/mes (plan gratuito)
    period: 'monthly',      // Renueva cada 30 días
    key: 'SHODAN_API_KEY',
    endpoint: 'https://api.shodan.io'
  }
};

// === ARCHIVO DE ESTADO ===
const STATE_FILE = join(process.cwd(), '.api-state.json');

// === Cargar estado previo ===
function loadState() {
  if (existsSync(STATE_FILE)) {
    try {
      return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
    } catch (e) {
      console.error('Error loading API state:', e);
    }
  }
  return {
    lastUpdated: Date.now(),
    apis: {}
  };
}

// === Guardar estado ===
function saveState(state) {
  state.lastUpdated = Date.now();
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// === Calcular tiempo restante en el periodo ===
function getTimeRemaining(period) {
  const now = new Date();
  switch (period) {
    case 'daily':
      // Renueva a medianoche
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow - now;
    case 'weekly':
      // Renueva cada 7 días desde el último reset
      return 7 * 24 * 60 * 60 * 1000; // 7 días en ms
    case 'hourly':
      // Renueva cada hora
      const nextHour = new Date(now);
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      return nextHour - now;
    case 'monthly':
      // Renueva cada 30 días
      return 30 * 24 * 60 * 60 * 1000; // 30 días en ms
    default:
      return Infinity;
  }
}

// === Formatear tiempo restante ===
function formatTimeRemaining(ms) {
  if (ms <= 0) return 'Renovado';

  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// === Analizar uso de APIs ===
function analyzeUsage() {
  const state = loadState();
  const analysis = [];

  for (const [apiId, config] of Object.entries(API_LIMITS)) {
    // Si no existe el estado para esta API, crear uno nuevo
    if (!state.apis[apiId]) {
      state.apis[apiId] = { calls: 0, lastReset: Date.now() };
    }

    const apiState = state.apis[apiId];

    // Verificar si el periodo ha expirado
    const timeSinceReset = Date.now() - apiState.lastReset;
    const periodMs = config.period === 'daily' ? 24 * 60 * 60 * 1000 :
                     config.period === 'weekly' ? 7 * 24 * 60 * 60 * 1000 :
                     config.period === 'hourly' ? 60 * 60 * 1000 :
                     config.period === 'monthly' ? 30 * 24 * 60 * 60 * 1000 : Infinity;

    const needsReset = timeSinceReset > periodMs;

    if (needsReset) {
      apiState.calls = 0;
      apiState.lastReset = Date.now();
    }

    const remaining = config.limit - apiState.calls;
    const percentage = (remaining / config.limit) * 100;
    const timeRemaining = getTimeRemaining(config.period);

    let status = '✅ OK';
    if (percentage < 20) status = '⚠️ LOW';
    if (percentage <= 0) status = '❌ EXHAUSTED';
    // Solo mostrar FULL si hay llamadas registradas y no se han usado
    if (remaining === config.limit && apiState.calls === 0) status = '🆕 NO USADO';

    analysis.push({
      api: config.name,
      id: apiId,
      limit: config.limit,
      used: apiState.calls,
      remaining,
      percentage: percentage.toFixed(1),
      timeRemaining: formatTimeRemaining(timeRemaining),
      status,
      period: config.period,
      advice: getAdvice(remaining, config.limit)
    });

    // Actualizar estado
    state.apis[apiId] = apiState;
  }

  saveState(state);
  return analysis;
}

// === Consejos basados en uso ===
function getAdvice(remaining, limit) {
  const percentage = (remaining / limit) * 100;

  if (percentage <= 0) {
    return '❌ LÍMITE AGOTADO - Espera renovación del periodo';
  } else if (percentage < 10) {
    return '⚠️ CRÍTICO - Solo para emergencias, evitar uso';
  } else if (percentage < 25) {
    return '⚠️ BAJO - Usar solo para casos prioritarios';
  } else if (percentage < 50) {
    return '✅ MODERADO - Uso normal con precaución';
  } else {
    return '✅ SALUDABLE - Uso normal permitido';
  }
}

// === Registrar una llamada API ===
function registerCall(apiId) {
  const state = loadState();

  if (!state.apis[apiId]) {
    state.apis[apiId] = { calls: 0, lastReset: Date.now() };
  }

  state.apis[apiId].calls++;
  state.apis[apiId].lastCall = Date.now();

  saveState(state);

  return {
    api: API_LIMITS[apiId]?.name || apiId,
    calls: state.apis[apiId].calls,
    remaining: API_LIMITS[apiId]?.limit - state.apis[apiId].calls || 0
  };
}

// === Verificar si se puede hacer una llamada ===
function canMakeCall(apiId) {
  const state = loadState();
  const apiState = state.apis[apiId] || { calls: 0 };
  const limit = API_LIMITS[apiId]?.limit || 0;

  return apiState.calls < limit;
}

// === CLI Output ===
function printReport() {
  const analysis = analyzeUsage();

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║         🛡️  KUNTUR - API RATE LIMIT MONITOR 🛡️                       ║');
  console.log('║         Control de Cuota para Proyecto Universitario                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('┌────────────────────┬──────────┬──────────┬──────────┬────────────┐');
  console.log('│ API                │ Límite   │ Usadas   │ Restan   │ Tiempo     │');
  console.log('├────────────────────┼──────────┼──────────┼──────────┼────────────┤');

  for (const api of analysis) {
    const name = api.api.padEnd(18);
    const limit = String(api.limit).padStart(8);
    const used = String(api.used).padStart(8);
    const remaining = String(api.remaining).padStart(8);
    const time = api.timeRemaining.padStart(10);

    console.log(`│ ${name} │ ${limit} │ ${used} │ ${remaining} │ ${time} │`);
    console.log(`│ Status: ${api.status} ${api.advice.padEnd(55)} │`);
    console.log('├────────────────────┼──────────┼──────────┼──────────┼────────────┤');
  }

  console.log('└────────────────────┴──────────┴──────────┴──────────┴────────────┘\n');

  console.log('📊 RECOMENDACIONES:\n');

  for (const api of analysis) {
    const rec = getRecommendation(api);
    console.log(`  ${api.api}: ${rec}`);
  }

  console.log('\n💡 TIP: Usa "npm run kuntur:demo" para pruebas sin gastar cuota\n');
}

// === Recomendaciones por API ===
function getRecommendation(api) {
  if (api.remaining <= 0) {
    return `❌ ESPERA ${api.timeRemaining} para renovación`;
  } else if (api.remaining < 10) {
    return `⚠️ MÁXIMO ${api.remaining} llamadas - Prioridad absoluta`;
  } else if (api.percentage < 25) {
    return `⚠️ BAJA cuota (${api.percentage}% restante) - Usar con moderación`;
  } else {
    return `✅ Cuota saludable (${api.percentage}% restante) - Uso normal`;
  }
}

// === Exportar funciones ===
export { analyzeUsage, registerCall, canMakeCall, printReport };

// === Ejecutar como CLI ===
if (process.argv[1]?.endsWith('api-monitor.mjs')) {
  const command = process.argv[2] || 'report';

  switch (command) {
    case 'report':
      printReport();
      break;
    case 'check':
      const api = process.argv[3];
      if (api) {
        const canCall = canMakeCall(api);
        console.log(`Can make ${api} call: ${canCall ? 'YES' : 'NO'}`);
        if (canCall) {
          const result = registerCall(api);
          console.log(`Registered: ${result.calls}/${result.limit} calls made`);
        }
      } else {
        console.log('Usage: node api-monitor.mjs check <api-id>');
      }
      break;
    default:
      console.log('Usage: node api-monitor.mjs [report|check]');
  }
}