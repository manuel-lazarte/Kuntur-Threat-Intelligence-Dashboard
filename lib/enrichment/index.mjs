// Pipeline de Enriquecimiento de AttackEvents
// Coordina: geolocalización, cálculo de Bolivia, elevación de severidad

import { enrichAttackEvent } from '../geo/maxmind.mjs';

/**
 * Enriquece un array de AttackEvents
 *
 * Pipeline:
 * 1. Geolocalización (IP → lat/lng/país)
 * 2. Cálculo de involves_bolivia
 * 3. Elevación de severidad si aplica
 *
 * @param {Array} events - Array de AttackEvents sin enriquecer
 * @returns {Array} - Array de AttackEvents enriquecidos
 */
export function enrichEvents(events) {
  if (!Array.isArray(events)) {
    return [];
  }

  const enriched = events.map(event => {
    try {
      return enrichAttackEvent(event);
    } catch (error) {
      console.error(`[Enrichment] Error enriching event ${event?.id}:`, error.message);
      // Retornar evento original sin enrichment en caso de error
      return event;
    }
  });

  return enriched;
}

/**
 * Filtra eventos inválidos y los loguea
 *
 * @param {Array} events - Array de eventos a validar
 * @returns {Object} - { valid: [], invalid: [], errors: [] }
 */
export function validateAndFilterEvents(events) {
  const valid = [];
  const invalid = [];
  const errors = [];

  if (!Array.isArray(events)) {
    errors.push('Events input is not an array');
    return { valid: [], invalid: [], errors };
  }

  for (const event of events) {
    const validation = validateEventSchema(event);
    if (validation.valid) {
      valid.push(event);
    } else {
      invalid.push(event);
      errors.push({ eventId: event?.id, errors: validation.errors });
    }
  }

  return { valid, invalid, errors };
}

/**
 * Valida un AttackEvent contra el schema
 * Esta es una validación básica, la completa se hará con el schema JSON
 *
 * @param {Object} event - Evento a validar
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validateEventSchema(event) {
  const errors = [];

  // Campos obligatorios
  const requiredFields = ['id', 'timestamp', 'attack_type', 'severity'];
  for (const field of requiredFields) {
    if (!event[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validación de tipos
  if (event.id && typeof event.id !== 'string') {
    errors.push('id must be a string');
  }

  if (event.timestamp && !Date.parse(event.timestamp)) {
    errors.push('timestamp must be valid ISO 8601');
  }

  if (event.severity && !['low', 'medium', 'high', 'critical'].includes(event.severity)) {
    errors.push(`Invalid severity: ${event.severity}`);
  }

  if (event.attack_type) {
    const validTypes = ['port_scan', 'brute_force', 'malware_c2', 'ddos', 'exploit_attempt', 'recon', 'exfiltration', 'other'];
    if (!validTypes.includes(event.attack_type)) {
      errors.push(`Invalid attack_type: ${event.attack_type}`);
    }
  }

  // Validación de confianza
  if (event.confidence !== undefined) {
    if (typeof event.confidence !== 'number' || event.confidence < 0 || event.confidence > 1) {
      errors.push('confidence must be a number between 0 and 1');
    }
  }

  // Al menos source_ip o source_country debe existir
  if (!event.source_ip && !event.source_country) {
    errors.push('At least source_ip or source_country is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Pipeline completo de procesamiento de eventos
 *
 * @param {Object} rawData - Datos brutos del briefing
 * @returns {Object} - Datos procesados listos para el dashboard
 */
export function processRawSweepData(rawData) {
  const sources = rawData.sources || {};
  const allEvents = [];
  const eventsBySource = {};
  const stats = {
    totalEvents: 0,
    boliviaEvents: 0,
    bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
    byAttackType: {},
    byCountry: {},
  };

  // 1. Extraer eventos de cada fuente
  for (const [sourceName, sourceData] of Object.entries(sources)) {
    if (!sourceData || !sourceData.events || !Array.isArray(sourceData.events)) {
      continue;
    }

    // 2. Validar y filtrar eventos inválidos
    const { valid, invalid, errors } = validateAndFilterEvents(sourceData.events);

    // Loguear errores si hay
    if (invalid.length > 0) {
      console.log(`[Enrichment] Source ${sourceName}: ${invalid.length} invalid events filtered`);
      for (const error of errors.slice(0, 3)) {
        console.log(`[Enrichment]   - ${error.eventId}: ${error.errors.join(', ')}`);
      }
    }

    // 3. Enriquecer eventos válidos
    const enriched = enrichEvents(valid);

    // 4. Añadir nombre de fuente
    enriched.forEach(event => {
      event.source_name = sourceName;
    });

    eventsBySource[sourceName] = enriched;
    allEvents.push(...enriched);

    console.log(`[Enrichment] Source ${sourceName}: ${enriched.length} events enriched`);
  }

  // 5. Calcular estadísticas
  for (const event of allEvents) {
    stats.totalEvents++;

    // Por severidad
    if (stats.bySeverity[event.severity] !== undefined) {
      stats.bySeverity[event.severity]++;
    }

    // Por tipo de ataque
    stats.byAttackType[event.attack_type] = (stats.byAttackType[event.attack_type] || 0) + 1;

    // Por país (origen)
    if (event.source_country) {
      stats.byCountry[event.source_country] = (stats.byCountry[event.source_country] || 0) + 1;
    }

    // Eventos Bolivia
    if (event.involves_bolivia) {
      stats.boliviaEvents++;
    }
  }

  // 6. Separar eventos Bolivia
  const boliviaEvents = allEvents.filter(e => e.involves_bolivia);

  return {
    events: allEvents,
    boliviaEvents,
    eventsBySource,
    stats,
  };
}
