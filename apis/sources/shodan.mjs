// Shodan — Buscador de dispositivos conectados a internet
// API: https://developer.shodan.io/api
// Requiere: SHODAN_API_KEY

import { safeFetch } from '../utils/fetch.mjs';
import '../utils/env.mjs';

const SHODAN_API_KEY = process.env.SHODAN_API_KEY || null;
const SHODAN_API_URL = 'https://api.shodan.io';

/**
 * Mapea un resultado de Shodan a AttackEvent
 */
function mapShodanToAttackEvent(shodanHost, confidence = 0.65) {
  // Inferir tipo de ataque desde el tipo de dispositivo
  const attackTypeMap = {
    'router': 'exploit_attempt',
    'firewall': 'recon',
    'server': 'recon',
    'ics': 'exploit_attempt',
    'scada': 'exploit_attempt',
    ' webcam': 'other',
    'iot': 'exploit_attempt',
    'database': 'brute_force',
  };

  const product = (shodanHost.product || '').toLowerCase();
  const deviceType = (shodanHost.devicetype || '').toLowerCase();
  const combined = `${product} ${deviceType}`;

  let attackType = 'other';
  for (const [key, value] of Object.entries(attackTypeMap)) {
    if (combined.includes(key)) {
      attackType = value;
      break;
    }
  }

  // Severidad basada en vulnerabilidades abiertas
  const vulnCount = shodanHost.vulns?.length || 0;
  const severity = vulnCount > 5 ? 'critical' :
                   vulnCount > 2 ? 'high' :
                   vulnCount > 0 ? 'medium' : 'low';

  return {
    id: `shodan-${shodanHost.ip_str}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    source_ip: shodanHost.ip_str || '0.0.0.0',
    dest_ip: null, // Shodan reporta dispositivo expuesto, no destino
    source_country: shodanHost.country_name || null,
    dest_country: null,
    source_lat: shodanHost.latitude || null,
    source_lng: shodanHost.longitude || null,
    dest_lat: null,
    dest_lng: null,
    attack_type: attackType,
    mitre_technique_id: null,
    severity,
    confidence,
    source_feed: 'shodan',
    involves_bolivia: shodanHost.country_code === 'BO',
    raw_host: {
      port: shodanHost.port,
      protocol: shodanHost.transport,
      product: shodanHost.product,
      version: shodanHost.version,
      vulns: vulnCount,
      tags: shodanHost.tags,
    },
  };
}

/**
 * Obtiene hosts vulnerables recientes de Shodan
 */
async function fetchVulnerableHosts(query = 'vuln:', limit = 20) {
  if (!SHODAN_API_KEY) {
    return { error: 'SHODAN_API_KEY not configured' };
  }

  try {
    const response = await safeFetch(`${SHODAN_API_URL}/shodan/host/search?key=${SHODAN_API_KEY}&query=${encodeURIComponent(query)}&limit=${limit}`, {
      timeout: 15000,
    });

    if (response.error) {
      return { error: response.error };
    }

    const hosts = response.matches || [];
    const events = hosts.slice(0, limit).map(h => mapShodanToAttackEvent(h, 0.65));

    return { events, total: events.length };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Función principal briefing()
 */
export async function briefing() {
  if (!SHODAN_API_KEY) {
    return {
      source: 'Shodan',
      timestamp: new Date().toISOString(),
      configured: false,
      events: [],
      note: 'Configure SHODAN_API_KEY to enable Shodan integration',
    };
  }

  const result = await fetchVulnerableHosts();

  return {
    source: 'Shodan',
    timestamp: new Date().toISOString(),
    configured: true,
    events: result.events || [],
    total_events: result.total || 0,
    error: result.error || null,
  };
}

// Ejecutable standalone
if (process.argv[1]?.endsWith('shodan.mjs')) {
  const data = await briefing();
  console.log(JSON.stringify(data, null, 2));
}
