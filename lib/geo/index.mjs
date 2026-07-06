// Pipeline de Enriquecimiento de AttackEvents
// Coordina: geolocalización, cálculo de Bolivia, elevación de severidad
//
// Este módulo es el corazón del procesamiento de eventos en Kuntur.
// Toma eventos crudos de las fuentes y los enriquece con:
// 1. Geolocalización (IP → lat/lng/país)
// 2. Cálculo de involves_bolivia
// 3. Elevación de severidad si involucra Bolivia

import { enrichAttackEvents as enrichWithMaxMind } from './maxmind.mjs';

/**
 * Enriquece un array de AttackEvents (async)
 *
 * Pipeline:
 * 1. Geolocalización (IP → lat/lng/país)
 * 2. Cálculo de involves_bolivia
 * 3. Elevación de severidad si aplica
 *
 * @param {Array} events - Array de AttackEvents sin enriquecer
 * @returns {Promise<Array>} - Array de AttackEvents enriquecidos
 */
export async function enrichEvents(events) {
  if (!Array.isArray(events)) {
    return [];
  }

  try {
    // Usar MaxMind para enriquecer
    const enriched = await enrichWithMaxMind(events);

    // Asegurar campos requeridos
    enriched.forEach(event => {
      if (event) ensureRequiredFields(event);
    });

    // Filtrar nulls
    return enriched.filter(e => e !== null);
  } catch (error) {
    console.error('[Enrichment] Error in enrichEvents:', error.message);
    return events; // Retornar original en caso de error
  }
}

/**
 * Asegura que un evento tenga los campos requeridos
 * Si faltan, les asigna valores por defecto
 */
function ensureRequiredFields(event) {
  // Timestamp
  if (!event.timestamp) {
    event.timestamp = new Date().toISOString();
  }

  // ID
  if (!event.id) {
    event.id = generateEventId();
  }

  // Severity
  if (!event.severity) {
    event.severity = 'medium';
  }

  // Confidence
  if (event.confidence === undefined || event.confidence === null) {
    event.confidence = 0.5;
  }

  // Attack type
  if (!event.attack_type) {
    event.attack_type = 'other';
  }

  // Coordenadas por defecto (si no existen)
  if (event.source_lat === undefined || event.source_lat === null) {
    event.source_lat = 0;
    event.source_lng = 0;
  }

  if (event.dest_lat === undefined || event.dest_lat === null) {
    event.dest_lat = 0;
    event.dest_lng = 0;
  }

  // involves_bolivia por defecto
  if (event.involves_bolivia === undefined || event.involves_bolivia === null) {
    event.involves_bolivia = false;
  }

  return event;
}

/**
 * Genera un ID único para un evento
 */
function generateEventId() {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calcula estadísticas de un array de eventos enriquecidos
 */
export function calculateStats(events) {
  if (!Array.isArray(events)) {
    return { total: 0, bolivia: 0, bySeverity: {}, byAttackType: {}, byCountry: {} };
  }

  const stats = {
    total: events.length,
    bolivia: 0,
    bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
    byAttackType: {},
    byCountry: {},
  };

  for (const event of events) {
    // Bolivia
    if (event.involves_bolivia) {
      stats.bolivia++;
    }

    // Por severidad
    if (stats.bySeverity[event.severity] !== undefined) {
      stats.bySeverity[event.severity]++;
    }

    // Por tipo de ataque
    stats.byAttackType[event.attack_type] = (stats.byAttackType[event.attack_type] || 0) + 1;

    // Por país origen
    if (event.source_country) {
      stats.byCountry[event.source_country] = (stats.byCountry[event.source_country] || 0) + 1;
    }
  }

  return stats;
}

/**
 * Separa eventos en generales y específicos de Bolivia
 */
export function separateBoliviaEvents(events) {
  if (!Array.isArray(events)) {
    return { general: [], bolivia: [] };
  }

  const bolivia = [];
  const general = [];

  for (const event of events) {
    if (event.involves_bolivia) {
      bolivia.push(event);
    } else {
      general.push(event);
    }
  }

  return { general, bolivia };
}

/**
 * Pipeline completo: toma datos crudos del briefing y retorna datos enriquecidos
 */
export async function processRawBriefingData(rawData) {
  const sources = rawData.sources || {};
  const allEvents = [];
  const eventsBySource = {};

  // 1. Extraer eventos de cada fuente
  for (const [sourceName, sourceData] of Object.entries(sources)) {
    if (!sourceData || !sourceData.events || !Array.isArray(sourceData.events)) {
      continue;
    }

    // 2. Enriquecer eventos
    const enriched = await enrichEvents(sourceData.events);

    // 3. Añadir nombre de fuente
    enriched.forEach(event => {
      event.source_name = sourceName;
      event.source_feed = event.source_feed || deriveSourceFeed(sourceName);
    });

    eventsBySource[sourceName] = enriched;
    allEvents.push(...enriched);
  }

  // 4. Calcular estadísticas
  const stats = calculateStats(allEvents);

  // 5. Separar eventos Bolivia
  const { general, bolivia } = separateBoliviaEvents(allEvents);

  return {
    events: allEvents,
    boliviaEvents: bolivia,
    generalEvents: general,
    eventsBySource,
    stats,
  };
}

/**
 * Deriva source_feed del nombre de fuente
 */
function deriveSourceFeed(sourceName) {
  const feedMap = {
    'Demo-Replay': 'demo',
    'Tpot': 'tpot',
    'AbuseIPDB': 'abuseipdb',
    'GreyNoise': 'greynoise',
    'OTX': 'otx',
    'Shodan': 'shodan',
    'CISA-KEV': 'cisa-kev',
    'Cloudflare-Radar': 'cloudflare-radar',
  };

  return feedMap[sourceName] || sourceName.toLowerCase();
}
