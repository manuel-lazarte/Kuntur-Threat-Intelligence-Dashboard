// AlienVault OTX — Open Threat Exchange
// API: https://otx.alienvault.com/api
// Requiere: OTX_API_KEY

import { safeFetch } from '../utils/fetch.mjs';
import '../utils/env.mjs';

const OTX_API_KEY = process.env.OTX_API_KEY || null;
const OTX_API_URL = 'https://otx.alienvault.com/api/v1';

/**
 * Mapea un pulso OTX a AttackEvent
 */
function mapOtxToAttackEvent(pulse, confidence = 0.75) {
  // Inferir tipo de ataque desde indicadores OTX
  const attackTypeMap = {
    'IPv4': 'recon',
    'domain': 'recon',
    'url': 'exploit_attempt',
    'hostname': 'recon',
    'MD5': 'malware_c2',
    'SHA256': 'malware_c2',
    'CVE': 'exploit_attempt',
  };

  const indicators = pulse.indicators || [];
  const firstIndicator = indicators[0] || {};
  const indicatorType = firstIndicator.type || 'unknown';
  const attackType = attackTypeMap[indicatorType] || 'other';

  return {
    id: `otx-${pulse.id}-${Date.now()}`,
    timestamp: pulse.created || new Date().toISOString(),
    source_ip: indicatorType === 'IPv4' ? firstIndicator.indicator : null,
    dest_ip: null,
    source_country: null, // Se resolverá en enriquecimiento
    dest_country: null,
    source_lat: null,
    source_lng: null,
    dest_lat: null,
    dest_lng: null,
    attack_type: attackType,
    mitre_technique_id: null,
    severity: pulse.is_malicious === true ? 'high' : 'medium',
    confidence,
    source_feed: 'otx',
    involves_bolivia: false, // Se calculará en enriquecimiento
    raw_pulse: {
      name: pulse.name,
      description: pulse.description,
      tags: pulse.tags,
      malware_families: pulse.malware_families,
      attack_ids: pulse.attack_ids,
    },
  };
}

/**
 * Obtiene pulsos recientes de OTX
 */
async function fetchRecentPulses(limit = 20) {
  if (!OTX_API_KEY) {
    return { error: 'OTX_API_KEY not configured' };
  }

  try {
    const response = await safeFetch(`${OTX_API_URL}/pulses/subscribed`, {
      headers: {
        'X-OTX-API-KEY': OTX_API_KEY,
      },
      timeout: 15000,
    });

    if (response.error) {
      return { error: response.error };
    }

    const pulses = response.results || [];
    const events = pulses
      .filter(p => p.indicators && p.indicators.length > 0)
      .slice(0, limit)
      .map(p => mapOtxToAttackEvent(p, 0.75));

    return { events, total: events.length };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Función principal briefing()
 */
export async function briefing() {
  if (!OTX_API_KEY) {
    return {
      source: 'OTX',
      timestamp: new Date().toISOString(),
      configured: false,
      events: [],
      note: 'Configure OTX_API_KEY to enable AlienVault OTX integration',
    };
  }

  const result = await fetchRecentPulses();

  return {
    source: 'OTX',
    timestamp: new Date().toISOString(),
    configured: true,
    events: result.events || [],
    total_events: result.total || 0,
    error: result.error || null,
  };
}

// Ejecutable standalone
if (process.argv[1]?.endsWith('otx.mjs')) {
  const data = await briefing();
  console.log(JSON.stringify(data, null, 2));
}
