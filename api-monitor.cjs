#!/usr/bin/env node
// Kuntur API Monitor - Versión Simplificada (sin Node.js problemático)
// Muestra límites de API y estado de cuota

const fs = require('fs');
const path = require('path');

// === LÍMITES DE API ===
const API_LIMITS = {
  abuseipdb: {
    name: 'AbuseIPDB',
    limit: 1000,
    period: 'diario',
    renew: 'medianoche'
  },
  greynoise: {
    name: 'GreyNoise',
    limit: 25,
    period: 'semanal',
    renew: 'cada 7 días'
  },
  otx: {
    name: 'OTX',
    limit: 1200,
    period: 'por hora',
    renew: 'cada hora'
  },
  shodan: {
    name: 'Shodan',
    limit: 100,
    period: 'mensual',
    renew: 'cada 30 días'
  }
};

// === Leer estado actual ===
function readState() {
  const stateFile = path.join(process.cwd(), '.api-state.json');
  try {
    if (fs.existsSync(stateFile)) {
      return JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading state:', e.message);
  }

  // Estado inicial (sin datos simulados - el registro real ocurre en briefing.mjs)
  return {
    lastUpdated: new Date().toISOString(),
    apis: {
      abuseipdb: { calls: 0, lastReset: Date.now() },
      greynoise: { calls: 0, lastReset: Date.now() },
      otx: { calls: 0, lastReset: Date.now() },
      shodan: { calls: 0, lastReset: Date.now() }
    }
  };
}

// === Calcular estado actual ===
function calculateStatus() {
  const state = readState();
  const results = [];

  for (const [id, config] of Object.entries(API_LIMITS)) {
    const apiState = state.apis[id] || { calls: 0 };
    const remaining = config.limit - apiState.calls;
    const percentage = ((remaining / config.limit) * 100).toFixed(1);

    let status = '✅';
    if (percentage < 20) status = '⚠️';
    if (percentage <= 0) status = '❌';
    if (remaining === config.limit) status = '🆕';

    results.push({
      api: config.name.padEnd(12),
      limit: config.limit.toString().padStart(6),
      used: apiState.calls.toString().padStart(6),
      remaining: remaining.toString().padStart(7),
      percent: percentage.padStart(6),
      status,
      period: config.period,
      renew: config.renew
    });
  }

  return results;
}

// === Mostrar reporte ===
function printReport() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║     🛡️ KUNTUR - MONITOR DE LÍMITES DE API 🛡️                       ║');
  console.log('║     Control de Cuota para Proyecto Universitario                     ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  const results = calculateStatus();

  console.log('┌────────────────────┬────────┬────────┬─────────┬─────────┐');
  console.log('│ API                │ Límite │ Usadas │ Restan  │ %       │');
  console.log('├────────────────────┼────────┼────────┼─────────┼─────────┤');

  for (const r of results) {
    console.log(`│ ${r.api} │ ${r.limit} │ ${r.used} │ ${r.remaining} │ ${r.percent}% │`);
    console.log(`│ Status: ${r.status} │ Período: ${r.period} | Renueva: ${r.renew}`);
    console.log('├────────────────────┼────────┼────────┼─────────┼─────────┤');
  }

  console.log('└────────────────────┴────────┴────────┴─────────┴─────────┘\n');

  console.log('💡 RECOMENDACIONES:\n');

  for (const r of results) {
    const remaining = parseInt(r.remaining);
    if (remaining <= 0) {
      console.log(`  ❌ ${r.api.trim()}: ESPERA renovación (${r.renew})`);
    } else if (remaining < 10) {
      console.log(`  ⚠️ ${r.api.trim()}: SOLO ${remaining} llamadas - MÁXIMA PRIORIDAD`);
    } else if (parseFloat(r.percent) < 25) {
      console.log(`  ⚠️ ${r.api.trim()}: Cuota baja (${r.percent}%) - Usar moderadamente`);
    } else {
      console.log(`  ✅ ${r.api.trim()}: Cuota saludable - Uso normal`);
    }
  }

  console.log('\n📋 COMANDOS:\n');
  console.log('  node apis/briefing.mjs           → Ejecutar briefing (usa APIs)');
  console.log('  node apis/sources/demo-replay.mjs → Demo sin gastar cuota');
  console.log('  node api-monitor.js              → Ver este reporte\n');
}

// Ejecutar
printReport();