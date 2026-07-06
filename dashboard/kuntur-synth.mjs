#!/usr/bin/env node
// Kuntur Dashboard Data Synthesizer
// Procesa AttackEvents y los adapta para el globo + HUD
// INTEGRACIÓN CON PIPELINE DE ENRIQUECIMIENTO

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { processRawBriefingData } from '../lib/geo/index.mjs';
import { filterValidEvents } from '../lib/validation.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = dirname(__dirname); // Subir al directorio padre del proyecto

/**
 * Sintetiza datos de threat intelligence para el dashboard
 * AHORA CON ENRIQUECIMIENTO COMPLETO
 */
export async function synthesizeKuntur(rawData) {
  // 1. Procesar datos con el pipeline de enriquecimiento
  const enrichedData = await processRawBriefingData(rawData);

  // 2. Extraer eventos enriquecidos
  const allAttackEvents = enrichedData.events || [];
  const boliviaEvents = enrichedData.boliviaEvents || [];
  const stats = enrichedData.stats || {};

  // 3. Datos reciclados para contexto visual (si existen)
  const sources = rawData.sources || {};
  const recycledData = {
    cisaKev: sources['CISA-KEV'] || null,
    cloudflareRadar: sources['Cloudflare-Radar'] || null,
    who: sources['WHO'] || null,
    noaa: sources['NOAA'] || null,
  };

  // 4. Enriquecer estadísticas si faltan
  if (!stats.total) {
    stats.total = allAttackEvents.length;
    stats.bolivia = boliviaEvents.length;
    stats.bySeverity = {
      critical: allAttackEvents.filter(e => e.severity === 'critical').length,
      high: allAttackEvents.filter(e => e.severity === 'high').length,
      medium: allAttackEvents.filter(e => e.severity === 'medium').length,
      low: allAttackEvents.filter(e => e.severity === 'low').length,
    };
    stats.byAttackType = {};
    stats.byCountry = {};

    allAttackEvents.forEach(e => {
      stats.byAttackType[e.attack_type] = (stats.byAttackType[e.attack_type] || 0) + 1;
      if (e.source_country) {
        stats.byCountry[e.source_country] = (stats.byCountry[e.source_country] || 0) + 1;
      }
    });
  }

  // 5. Construir datos para el globo: arcos de attack source → dest
  const globeArcs = allAttackEvents
    .filter(e => e.source_lat && e.source_lng && e.dest_lat && e.dest_lng)
    .map(e => ({
      startLat: e.source_lat,
      startLng: e.source_lng,
      endLat: e.dest_lat,
      endLng: e.dest_lng,
      color: e.involves_bolivia
        ? ['#ff3333', '#ff3333']  // Rojo intenso para Bolivia
        : ['#4a9eff', '#4a9eff'], // Azul para resto
      stroke: e.severity === 'critical' ? 1.5 :
              e.severity === 'high' ? 1.2 :
              e.severity === 'medium' ? 0.8 : 0.4,
      label: `${e.attack_type} (${e.severity})`,
      severity: e.severity,
      involvesBolivia: e.involves_bolivia,
      dashAnimateTime: e.severity === 'critical' ? 1000 :
                       e.severity === 'high' ? 1500 : 2000,
    }));

  // 6. Health de fuentes
  const health = Object.entries(rawData.sources || {}).map(([name, data]) => ({
    name,
    ok: !data.error,
    configured: data.configured !== false,
    error: data.error,
  }));

  return {
    // Metadata
    meta: rawData.kuntur || {},

    // Estadísticas enriquecidas
    stats: {
      total_events: stats.total,
      bolivia_events: stats.bolivia,
      by_severity: stats.bySeverity,
      by_attack_type: stats.byAttackType,
      by_country: stats.byCountry,
    },

    // Eventos de ataque enriquecidos
    attackEvents: allAttackEvents,
    boliviaEvents,

    // Datos reciclados para contexto
    recycled: recycledData,

    // Para el globo: arcos geolocalizados
    globeArcs,

    // Para el HUD: feeds
    feed_general: allAttackEvents.slice(0, 50),
    feed_bolivia: boliviaEvents.slice(0, 50),

    // Health de fuentes
    health,
  };
}

/**
 * CLI: leer latest.json y sintetizar
 */
async function cliSynthesize() {
  const runsDir = join(ROOT, 'runs');
  const latestPath = join(runsDir, 'latest.json');

  if (!existsSync(latestPath)) {
    console.error('Error: runs/latest.json not found. Run a sweep first.');
    process.exit(1);
  }

  const rawData = JSON.parse(readFileSync(latestPath, 'utf8'));
  const synthesized = await synthesizeKuntur(rawData);

  console.log(JSON.stringify(synthesized, null, 2));
}

// Run CLI if invoked directly
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  await cliSynthesize();
}
