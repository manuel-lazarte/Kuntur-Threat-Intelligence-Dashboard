// Demo Replay — Genera eventos sintéticos de threat intelligence para demo
// PRIORIDAD: Este módulo permite ejecutar Kuntur sin API keys externas
// Simula tráfico de ataque realista con distribución geográfica variada
// Incluye eventos marcados como involves_bolivia para demostrar el feature

/**
 * Genera un UUID v4
 */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/**
 * Datos de muestra IPs geolocalizadas
 */
const SAMPLE_IPS = [
  // Bolivia (para demo involves_bolivia)
  { ip: '186.2.8.0', country: 'BO', city: 'La Paz', lat: -16.5, lng: -68.15 },
  { ip: '200.87.0.0', country: 'BO', city: 'Santa Cruz', lat: -17.8, lng: -63.2 },
  { ip: '190.129.0.0', country: 'BO', city: 'Cochabamba', lat: -17.4, lng: -66.2 },
  { ip: '181.114.0.0', country: 'BO', city: 'Sucre', lat: -19.0, lng: -65.3 },

  // Países vecinos
  { ip: '200.0.0.0', country: 'BR', city: 'São Paulo', lat: -23.5, lng: -46.6 },
  { ip: '190.0.0.0', country: 'AR', city: 'Buenos Aires', lat: -34.6, lng: -58.4 },
  { ip: '190.0.0.0', country: 'CL', city: 'Santiago', lat: -33.4, lng: -70.7 },
  { ip: '190.0.0.0', country: 'PE', city: 'Lima', lat: -12.0, lng: -77.0 },

  // América del Norte
  { ip: '8.8.8.8', country: 'US', city: 'Mountain View', lat: 37.4, lng: -122.1 },
  { ip: '1.1.1.1', country: 'US', city: 'Los Angeles', lat: 34.0, lng: -118.2 },
  { ip: '208.67.0.0', country: 'US', city: 'San Francisco', lat: 37.8, lng: -122.4 },

  // Europa
  { ip: '5.0.0.0', country: 'DE', city: 'Frankfurt', lat: 50.1, lng: 8.7 },
  { ip: '80.0.0.0', country: 'GB', city: 'London', lat: 51.5, lng: -0.1 },
  { ip: '90.0.0.0', country: 'FR', city: 'Paris', lat: 48.9, lng: 2.3 },
  { ip: '85.0.0.0', country: 'NL', city: 'Amsterdam', lat: 52.4, lng: 4.9 },

  // Asia
  { ip: '120.0.0.0', country: 'CN', city: 'Beijing', lat: 39.9, lng: 116.4 },
  { ip: '125.0.0.0', country: 'JP', city: 'Tokyo', lat: 35.7, lng: 139.7 },
  { ip: '140.0.0.0', country: 'RU', city: 'Moscow', lat: 55.7, lng: 37.6 },

  // Otros
  { ip: '196.0.0.0', country: 'ZA', city: 'Johannesburg', lat: -26.2, lng: 28.0 },
  { ip: '49.0.0.0', country: 'AU', city: 'Sydney', lat: -33.9, lng: 151.2 },
];

/**
 * Tipos de ataque con su severidad base
 */
const ATTACK_TYPES = [
  { type: 'port_scan', severity: 'low', mitre: 'T1595' },
  { type: 'brute_force', severity: 'medium', mitre: 'T1110' },
  { type: 'malware_c2', severity: 'critical', mitre: 'T1071' },
  { type: 'ddos', severity: 'high', mitre: 'T1498' },
  { type: 'exploit_attempt', severity: 'high', mitre: 'T1190' },
  { type: 'recon', severity: 'low', mitre: 'T1590' },
  { type: 'exfiltration', severity: 'critical', mitre: 'T1041' },
  { type: 'other', severity: 'low', mitre: null },
];

/**
 * Genera un evento de ataque sintético
 */
function generateAttackEvent(forcedBolivia = false) {
  // Seleccionar IP de origen
  let sourceIdx;
  if (forcedBolivia || Math.random() < 0.15) {
    // 15% de probabilidad de ser Bolivia (o si se fuerza)
    sourceIdx = Math.floor(Math.random() * 4); // Primeras 4 IPs son de Bolivia
  } else {
    sourceIdx = 4 + Math.floor(Math.random() * (SAMPLE_IPS.length - 4));
  }
  const source = SAMPLE_IPS[sourceIdx];

  // Seleccionar IP de destino (diferente al origen)
  let destIdx;
  do {
    destIdx = Math.floor(Math.random() * SAMPLE_IPS.length);
  } while (destIdx === sourceIdx);
  const dest = SAMPLE_IPS[destIdx];

  // Seleccionar tipo de ataque
  const attackInfo = ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)];

  // Calcular involves_bolivia
  const involvesBolivia = source.country === 'BO' || dest.country === 'BO';

  // Aumentar severidad si involucra Bolivia
  let severity = attackInfo.severity;
  if (involvesBolivia) {
    if (severity === 'low') severity = 'medium';
    else if (severity === 'medium') severity = 'high';
    else if (severity === 'high') severity = 'critical';
  }

  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    source_ip: source.ip,
    dest_ip: dest.ip,
    source_country: source.country,
    dest_country: dest.country,
    source_lat: source.lat,
    source_lng: source.lng,
    dest_lat: dest.lat,
    dest_lng: dest.lng,
    attack_type: attackInfo.type,
    mitre_technique_id: attackInfo.mitre,
    severity,
    confidence: 0.7 + Math.random() * 0.3, // 0.7-1.0
    source_feed: 'demo',
    involves_bolivia: involvesBolivia,
  };
}

/**
 * Función principal briefing() — genera array de eventos
 * @param {number} count — número de eventos a generar (default: 15-25)
 */
export async function briefing(count = null) {
  const eventCount = count || (15 + Math.floor(Math.random() * 11)); // 15-25 eventos

  const events = [];
  const boliviaEvents = [];

  for (let i = 0; i < eventCount; i++) {
    // Generar 2-3 eventos marcados como involves_bolivia
    const forceBolivia = i < (2 + Math.floor(Math.random() * 2));
    const event = generateAttackEvent(forceBolivia);
    events.push(event);
    if (event.involves_bolivia) {
      boliviaEvents.push(event);
    }
  }

  return {
    source: 'DemoReplay',
    timestamp: new Date().toISOString(),
    total_events: events.length,
    bolivia_events: boliviaEvents.length,
    events,
    // Estadísticas para el dashboard
    stats: {
      by_severity: {
        critical: events.filter(e => e.severity === 'critical').length,
        high: events.filter(e => e.severity === 'high').length,
        medium: events.filter(e => e.severity === 'medium').length,
        low: events.filter(e => e.severity === 'low').length,
      },
      by_attack_type: {
        port_scan: events.filter(e => e.attack_type === 'port_scan').length,
        brute_force: events.filter(e => e.attack_type === 'brute_force').length,
        malware_c2: events.filter(e => e.attack_type === 'malware_c2').length,
        ddos: events.filter(e => e.attack_type === 'ddos').length,
        exploit_attempt: events.filter(e => e.attack_type === 'exploit_attempt').length,
        recon: events.filter(e => e.attack_type === 'recon').length,
        exfiltration: events.filter(e => e.attack_type === 'exfiltration').length,
        other: events.filter(e => e.attack_type === 'other').length,
      },
      by_country: {},
    },
  };
}

// Ejecutable standalone para debug
if (process.argv[1]?.endsWith('demo-replay.mjs')) {
  const data = await briefing();
  console.log(JSON.stringify(data, null, 2));
}
