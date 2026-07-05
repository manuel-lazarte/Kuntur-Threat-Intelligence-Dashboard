#!/usr/bin/env node

// Kuntur Master Orchestrator — threat intelligence sources in parallel
// Specialized focus: cyber threats, attack events, Bolivia monitoring
// All sources return AttackEvent format (or compatible for recycled sources)

import './utils/env.mjs'; // Load API keys from .env
import { pathToFileURL } from 'node:url';
import { registerCall } from './utils/api-monitor.mjs';

// === Threat Intel Sources (Core) ===
import { briefing as demoReplay } from './sources/demo-replay.mjs';
import { briefing as tpot } from './sources/tpot.mjs';
import { briefing as abuseipdb } from './sources/abuseipdb.mjs';
import { briefing as greynoise } from './sources/greynoise.mjs';
import { briefing as otx } from './sources/otx.mjs';
import { briefing as shodan } from './sources/shodan.mjs';

// === Context Sources (Recycled) ===
import { briefing as cisaKev } from './sources/cisa-kev.mjs';
import { briefing as cloudflareRadar } from './sources/cloudflare-radar.mjs';
import { briefing as who } from './sources/who.mjs';
import { briefing as noaa } from './sources/noaa.mjs';

const SOURCE_TIMEOUT_MS = 30_000; // 30s max per individual source

/**
 * Mapping de fuentes a IDs de API para registro de llamadas
 */
const SOURCE_TO_API_ID = {
  'AbuseIPDB': 'abuseipdb',
  'GreyNoise': 'greynoise',
  'OTX': 'otx',
  'Shodan': 'shodan',
  'T-Pot': 'tpot',
  'DemoReplay': null,  // Demo no usa API real
  'CISA-KEV': 'cisa',
  'Cloudflare-Radar': null,  // No requiere API key
  'WHO': null,  // No requiere API key
  'NOAA': null,  // No requiere API key
};

/**
 * Ejecuta una fuente individual con timeout y manejo de errores
 * Registra las llamadas a APIs cuando la fuente retorna datos exitosamente
 */
export async function runSource(name, fn, ...args) {
  const start = Date.now();
  let timer;
  try {
    const dataPromise = fn(...args);
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Source ${name} timed out after ${SOURCE_TIMEOUT_MS / 1000}s`)), SOURCE_TIMEOUT_MS);
    });
    const data = await Promise.race([dataPromise, timeoutPromise]);

    // Registrar llamada a API si la fuente está configurada y retornó datos
    const apiId = SOURCE_TO_API_ID[name];
    if (apiId && data && data.configured !== false) {
      try {
        // Estimar número de llamadas basado en la cantidad de eventos retornados
        // Para AbuseIPDB: cada evento es una llamada a la API
        // Para GreyNoise: 1 llamada por solicitud
        // Para OTX: 1 llamada por solicitud
        // Para Shodan: cada evento es una llamada
        let callsCount = 1;
        if (name === 'AbuseIPDB' && data.events) {
          callsCount = data.events.length;
        } else if (name === 'Shodan' && data.events) {
          callsCount = data.events.length;
        }

        // Registrar cada llamada
        for (let i = 0; i < callsCount; i++) {
          registerCall(apiId);
        }
        console.error(`[API Monitor] Registered ${callsCount} call(s) for ${apiId} (${name})`);
      } catch (err) {
        console.error(`[API Monitor] Failed to register call for ${name}:`, err.message);
      }
    }

    return { name, status: 'ok', durationMs: Date.now() - start, data };
  } catch (e) {
    return { name, status: 'error', durationMs: Date.now() - start, error: e.message };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Calcula estadísticas agregadas de todos los eventos de ataque
 */
function calculateAttackEventStats(sources) {
  const allEvents = [];
  const boliviaEvents = [];
  const eventsByType = {};
  const eventsBySeverity = {};
  const sourceStats = {};

  sources.filter(s => s.status === 'ok' && s.data?.events).forEach(s => {
    const events = s.data.events || [];
    sourceStats[s.name] = events.length;

    events.forEach(event => {
      allEvents.push(event);

      // Contar eventos que involucran Bolivia
      if (event.involves_bolivia) {
        boliviaEvents.push(event);
      }

      // Agrupar por tipo de ataque
      const attackType = event.attack_type || 'unknown';
      eventsByType[attackType] = (eventsByType[attackType] || 0) + 1;

      // Agrupar por severidad
      const severity = event.severity || 'unknown';
      eventsBySeverity[severity] = (eventsBySeverity[severity] || 0) + 1;
    });
  });

  return {
    total_events: allEvents.length,
    bolivia_events: boliviaEvents.length,
    by_attack_type: eventsByType,
    by_severity: eventsBySeverity,
    by_source: sourceStats,
  };
}

/**
 * Calcula estadísticas de fuentes contextuales (CISA-KEV, Cloudflare, etc.)
 */
function calculateContextStats(sources) {
  const stats = {};

  sources.filter(s => s.status === 'ok').forEach(s => {
    if (!s.data) return;

    switch (s.name) {
      case 'CISA-KEV':
        stats.cisa_vulnerabilities = s.data.summary?.totalInCatalog || 0;
        stats.cisa_recent_additions = s.data.summary?.recentAdditions || 0;
        break;
      case 'Cloudflare-Radar':
        stats.cloudflare_outages = s.data.outages?.total || 0;
        stats.cloudflare_active_outages = s.data.outages?.active || 0;
        break;
      case 'WHO':
        stats.who_outbreaks = s.data.diseaseOutbreakNews?.length || 0;
        break;
      case 'NOAA/NWS':
        stats.noaa_severe_alerts = s.data.totalSevereAlerts || 0;
        break;
    }
  });

  return stats;
}

/**
 * Genera señales de inteligencia a partir de los datos agregados
 */
function generateIntelligenceSignals(attackStats, contextStats, sources) {
  const signals = [];

  // Señales de amenazas críticas
  if (attackStats.by_severity.critical > 0) {
    signals.push({
      severity: 'critical',
      title: 'Critical Threats Detected',
      description: `${attackStats.by_severity.critical} critical attack events detected across all sources`,
    });
  }

  // Señales de Bolivia
  if (attackStats.bolivia_events > 0) {
    signals.push({
      severity: attackStats.bolivia_events > 5 ? 'high' : 'medium',
      title: 'Bolivia-Related Threat Activity',
      description: `${attackStats.bolivia_events} attack events involving Bolivia detected`,
    });
  }

  // Señales de CISA-KEV
  if (contextStats.cisa_recent_additions > 5) {
    signals.push({
      severity: 'high',
      title: 'Elevated Vulnerability Activity',
      description: `${contextStats.cisa_recent_additions} new actively exploited CVEs added in last 30 days`,
    });
  }

  // Señales de ransomware
  const cisaSource = sources.find(s => s.name === 'CISA-KEV' && s.status === 'ok');
  if (cisaSource?.data?.signals) {
    const ransomwareSignal = cisaSource.data.signals.find(s => s.severity === 'critical');
    if (ransomwareSignal) {
      signals.push({
        severity: 'critical',
        title: 'Active Ransomware Campaigns',
        description: ransomwareSignal.signal,
      });
    }
  }

  // Señales de internet outages
  if (contextStats.cloudflare_active_outages > 0) {
    signals.push({
      severity: 'medium',
      title: 'Active Internet Outages',
      description: `${contextStats.cloudflare_active_outages} active internet outages detected globally`,
    });
  }

  // Señales de brotes de enfermedades
  if (contextStats.who_outbreaks > 3) {
    signals.push({
      severity: 'medium',
      title: 'Elevated Disease Outbreak Activity',
      description: `${contextStats.who_outbreaks} disease outbreak news items in last 30 days`,
    });
  }

  // Señales de clima severo
  if (contextStats.noaa_severe_alerts > 10) {
    signals.push({
      severity: 'high',
      title: 'Severe Weather Events',
      description: `${contextStats.noaa_severe_alerts} severe weather alerts active across US`,
    });
  }

  return signals;
}

/**
 * Briefing completo - ejecuta todas las fuentes en paralelo
 */
export async function fullBriefing() {
  console.error('[Kuntur] Starting threat intelligence sweep — 10 sources...');
  const start = Date.now();

  // DemoReplay reactivado temporalmente mientras AbuseIPDB se renueva
  const allPromises = [
    // === Threat Intel (Priority) ===
    runSource('DemoReplay', demoReplay),  // REACTIVADO - Datos simulados mientras APIs se renuevan
    runSource('T-Pot', tpot),
    runSource('AbuseIPDB', abuseipdb),
    runSource('GreyNoise', greynoise),
    runSource('OTX', otx),
    runSource('Shodan', shodan),

    // === Context Sources (Recycled) ===
    runSource('CISA-KEV', cisaKev),
    runSource('Cloudflare-Radar', cloudflareRadar),
    runSource('WHO', who),
    runSource('NOAA', noaa),
  ];

  const results = await Promise.allSettled(allPromises);

  const sources = results.map(r => r.status === 'fulfilled' ? r.value : { status: 'failed', error: r.reason?.message });
  const totalMs = Date.now() - start;

  // Calcular estadísticas
  const attackStats = calculateAttackEventStats(sources);
  const contextStats = calculateContextStats(sources);
  const signals = generateIntelligenceSignals(attackStats, contextStats, sources);

  // Agrupar eventos de AttackEvents por fuente
  const attackEventsBySource = {};
  sources.filter(s => s.status === 'ok').forEach(s => {
    if (s.data?.events) {
      attackEventsBySource[s.name] = s.data.events;
    }
  });

  // Identificar fuentes configuradas vs no configuradas
  const configuredSources = sources.filter(s => s.status === 'ok' && (!s.data?.configured || s.data.configured !== false));
  const unconfiguredSources = sources.filter(s => s.status === 'ok' && s.data?.configured === false);
  const failedSources = sources.filter(s => s.status !== 'ok');

  const output = {
    kuntur: {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      totalDurationMs: totalMs,
      sourcesQueried: sources.length,
      sourcesOk: sources.filter(s => s.status === 'ok').length,
      sourcesConfigured: configuredSources.length,
      sourcesUnconfigured: unconfiguredSources.length,
      sourcesFailed: failedSources.length,
    },
    intelligence: {
      signals,
      attack_events: attackStats,
      context_data: contextStats,
    },
    attackEvents: attackEventsBySource,
    sources: Object.fromEntries(
      sources.filter(s => s.status === 'ok').map(s => [s.name, s.data])
    ),
    errors: sources.filter(s => s.status !== 'ok').map(s => ({ name: s.name, error: s.error })),
    timing: Object.fromEntries(
      sources.map(s => [s.name, { status: s.status, ms: s.durationMs }])
    ),
  };

  console.error(`[Kuntur] Sweep complete in ${totalMs}ms — ${output.kuntur.sourcesOk}/${sources.length} sources returned data`);
  console.error(`[Kuntur] ${configuredSources.length} configured, ${unconfiguredSources.length} need API keys, ${failedSources.length} failed`);
  return output;
}

/**
 * Ejecuta solo las fuentes principales de threat intelligence
 */
export async function threatIntelBriefing() {
  console.error('[Kuntur] Running threat intelligence only briefing...');
  const start = Date.now();

  const threatPromises = [
    runSource('DemoReplay', demoReplay),
    runSource('T-Pot', tpot),
    runSource('AbuseIPDB', abuseipdb),
    runSource('GreyNoise', greynoise),
    runSource('OTX', otx),
    runSource('Shodan', shodan),
  ];

  const results = await Promise.allSettled(threatPromises);
  const sources = results.map(r => r.status === 'fulfilled' ? r.value : { status: 'failed', error: r.reason?.message });
  const totalMs = Date.now() - start;

  return {
    kuntur: {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      totalDurationMs: totalMs,
      mode: 'threat-intel-only',
      sourcesQueried: sources.length,
      sourcesOk: sources.filter(s => s.status === 'ok').length,
    },
    sources: Object.fromEntries(
      sources.filter(s => s.status === 'ok').map(s => [s.name, s.data])
    ),
    errors: sources.filter(s => s.status !== 'ok').map(s => ({ name: s.name, error: s.error })),
  };
}

/**
 * Ejecuta solo las fuentes contextuales
 */
export async function contextBriefing() {
  console.error('[Kuntur] Running context briefing...');
  const start = Date.now();

  const contextPromises = [
    runSource('CISA-KEV', cisaKev),
    runSource('Cloudflare-Radar', cloudflareRadar),
    runSource('WHO', who),
    runSource('NOAA', noaa),
  ];

  const results = await Promise.allSettled(contextPromises);
  const sources = results.map(r => r.status === 'fulfilled' ? r.value : { status: 'failed', error: r.reason?.message });
  const totalMs = Date.now() - start;

  return {
    kuntur: {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      totalDurationMs: totalMs,
      mode: 'context-only',
      sourcesQueried: sources.length,
      sourcesOk: sources.filter(s => s.status === 'ok').length,
    },
    sources: Object.fromEntries(
      sources.filter(s => s.status === 'ok').map(s => [s.name, s.data])
    ),
    errors: sources.filter(s => s.status !== 'ok').map(s => ({ name: s.name, error: s.error })),
  };
}

// Run and output when executed directly
const entryHref = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;

if (entryHref && import.meta.url === entryHref) {
  const mode = process.argv[2] || 'full';

  let data;
  if (mode === 'threat') {
    data = await threatIntelBriefing();
  } else if (mode === 'context') {
    data = await contextBriefing();
  } else {
    data = await fullBriefing();
  }

  console.log(JSON.stringify(data, null, 2));
}
