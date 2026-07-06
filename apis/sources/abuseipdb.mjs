// AbuseIPDB — Base de datos de IPs maliciosas reportadas
// API: https://abuseipdb.com/api
// Requiere: ABUSEIPDB_API_KEY
//
// NOTA: AbuseIPDB no tiene endpoint de "feed global". Todos los endpoints
// requieren una IP específica. Esta implementación usa IPs conocidas para
// generar datos de amenazas.

import { safeFetch } from '../utils/fetch.mjs';
import '../utils/env.mjs';

const ABUSEIPDB_API_KEY = process.env.ABUSEIPDB_API_KEY || null;
const ABUSEIPDB_API_URL = 'https://api.abuseipdb.com/api/v2';

// Cache para evitar llamadas repetidas
let cache = null;
let cacheTime = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Mapa de códigos de categorías de AbuseIPDB a nombres
 * Fuente: https://abuseipdb.com/categories
 */
const ABUSEIPDB_CATEGORIES = {
  3: 'Fraud Orders',
  4: 'DDOS Attack',
  5: 'FTP Brute-Force',
  6: 'Email Brute-Force',
  7: 'SSH Brute-Force',
  8: 'Port Scan',
  9: 'Brute-Force',
  10: 'Web Attack',
  11: 'Web Application Attack',
  12: 'SQL Injection',
  13: 'Spoofing',
  14: 'Brute-Force',
  15: 'Hacking',
  16: 'SMTP Brute-Force',
  17: 'Open Proxy',
  18: 'Port Scan',
  19: 'Web Script Attack',
  20: 'Web Application Attack',
  21: 'Access Control Abuse',
  22: 'Cyber Attack',
  23: 'Database Attack',
};

/**
 * Mapea categorías de AbuseIPDB (números) a tipos de ataque
 */
function mapCategoryToAttackType(categories) {
  const attackTypeMap = {
    'SSH Brute-Force': 'brute_force',
    'FTP Brute-Force': 'brute_force',
    'SMTP Brute-Force': 'brute_force',
    'Email Brute-Force': 'brute_force',
    'Brute-Force': 'brute_force',
    'DDOS Attack': 'ddos',
    'Web Attack': 'web_attack',
    'Web Application Attack': 'web_attack',
    'Web Script Attack': 'web_attack',
    'SQL Injection': 'sql_injection',
    'Port Scan': 'recon',
    'Scanning': 'recon',
    'Access Control Abuse': 'exploit_attempt',
    'Cyber Attack': 'exploit_attempt',
    'Database Attack': 'sql_injection',
    'Spoofing': 'impersonation',
    'Fraud Orders': 'fraud',
    'Open Proxy': 'proxy_abuse',
    'Hacking': 'exploit_attempt',
  };

  if (!categories || categories.length === 0) return 'other';

  // Convertir códigos numéricos a nombres
  const categoryNames = categories.map(cat => {
    const catNum = parseInt(cat);
    return ABUSEIPDB_CATEGORIES[catNum] || `Unknown (${catNum})`;
  });

  // Buscar matching con el mapa de tipos de ataque
  const firstCat = categoryNames[0];
  for (const [key, value] of Object.entries(attackTypeMap)) {
    if (firstCat.includes(key)) return value;
  }

  // Si no hay match exacto, buscar por palabras clave
  const lowerCat = firstCat.toLowerCase();
  if (lowerCat.includes('brute')) return 'brute_force';
  if (lowerCat.includes('ddos')) return 'ddos';
  if (lowerCat.includes('web')) return 'web_attack';
  if (lowerCat.includes('sql')) return 'sql_injection';
  if (lowerCat.includes('scan')) return 'recon';
  if (lowerCat.includes('exploit') || lowerCat.includes('hack')) return 'exploit_attempt';

  return 'other';
}

/**
 * Determina severidad basado en confidence score
 */
function mapSeverity(abuseConfidenceScore) {
  if (abuseConfidenceScore >= 75) return 'critical';
  if (abuseConfidenceScore >= 50) return 'high';
  if (abuseConfidenceScore >= 25) return 'medium';
  return 'low';
}

/**
 * Coordenadas aproximadas de países para destinos ficticios
 * (AbuseIPDB no reporta destino real)
 */
const COUNTRY_COORDS = {
  'US': { lat: 37.0, lng: -95.7 },
  'BO': { lat: -16.5, lng: -68.15 },
  'BR': { lat: -14.2, lng: -51.9 },
  'AR': { lat: -34.6, lng: -58.4 },
  'CL': { lat: -33.4, lng: -70.7 },
  'PE': { lat: -12, lng: -77 },
  'DE': { lat: 51.2, lng: 10.4 },
  'GB': { lat: 55.4, lng: -3.4 },
  'FR': { lat: 46.2, lng: 2.2 },
  'ES': { lat: 40.5, lng: -3.7 },
  'CN': { lat: 35.9, lng: 104.2 },
  'JP': { lat: 36.2, lng: 138.3 },
  'RU': { lat: 61.5, lng: 105.3 },
  'IN': { lat: 20.6, lng: 79.0 },
  'AU': { lat: -25.3, lng: 133.8 },
  'CA': { lat: 56.1, lng: -106.3 },
  'MX': { lat: 23.6, lng: -102.6 },
  'CO': { lat: 4.6, lng: -74.1 },
  'EC': { lat: -1.8, lng: -78.5 },
  'UY': { lat: -32.5, lng: -55.8 },
  'PY': { lat: -23.4, lng: -58.4 },
  'UNKNOWN': { lat: 0, lng: 0 },
};

/**
 * Obtiene coordenadas de un país
 */
function getCountryCoords(countryCode) {
  return COUNTRY_COORDS[countryCode] || COUNTRY_COORDS['UNKNOWN'];
}

/**
 * Mapea datos de AbuseIPDB a AttackEvent
 */
function mapAbuseIPDBToAttackEvent(ipData, reportData = null) {
  const confidence = ipData.abuseConfidenceScore || 0;
  const categories = ipData.categories || [];

  // Si hay reportes específicos, usar la fecha del más reciente
  const timestamp = reportData?.lastReportedAt
    || ipData.lastReportedAt
    || new Date().toISOString();

  // Obtener coordenadas de origen
  const sourceCoords = getCountryCoords(ipData.countryCode);

  // Para AbuseIPDB, simulamos un destino hacia Bolivia o un país random
  // (ya que AbuseIPDB no reporta destino real)
  const destCountries = ['BO', 'US', 'BR', 'AR', 'CL', 'PE', 'DE', 'GB', 'FR'];
  const randomDestCountry = destCountries[Math.floor(Math.random() * destCountries.length)];
  const destCoords = getCountryCoords(randomDestCountry);

  // Convertir códigos de categorías a nombres legibles
  const categoryNames = categories.map(cat => {
    const catNum = parseInt(cat);
    return ABUSEIPDB_CATEGORIES[catNum] || `Unknown (${catNum})`;
  });

  return {
    id: `abuseipdb-${ipData.ipAddress}-${Date.now()}`,
    timestamp,
    source_ip: ipData.ipAddress || '0.0.0.0',
    dest_ip: null, // AbuseIPDB no reporta destino real
    source_country: ipData.countryCode || null,
    dest_country: randomDestCountry,
    dest_country_simulated: true, // Indicador de que el destino es simulado
    source_lat: sourceCoords.lat,
    source_lng: sourceCoords.lng,
    dest_lat: destCoords.lat,
    dest_lng: destCoords.lng,
    attack_type: mapCategoryToAttackType(categories),
    mitre_technique_id: null,
    severity: mapSeverity(confidence),
    confidence: confidence / 100,
    source_feed: 'abuseipdb',
    involves_bolivia: ipData.countryCode === 'BO' || randomDestCountry === 'BO',
    raw_report: {
      ...ipData,
      categoryNames, // Agregar nombres legibles de categorías
      verificationUrl: `https://abuseipdb.com/check/${ipData.ipAddress}`,
      note: 'Destination country is simulated - AbuseIPDB does not report actual attack destinations',
    },
  };
}

/**
 * Calcula métricas agregadas
 */
function calculateMetrics(ipDataList) {
  const metrics = {
    byCountry: {},
    byCategory: {},
    topIPs: [],
    totalReports: ipDataList.length,
    averageConfidence: 0,
  };

  let totalConfidence = 0;

  ipDataList.forEach(ip => {
    // Por país
    const country = ip.countryCode || 'Unknown';
    metrics.byCountry[country] = (metrics.byCountry[country] || 0) + 1;

    // Por categoría
    if (ip.categories && ip.categories.length > 0) {
      ip.categories.forEach(cat => {
        metrics.byCategory[cat] = (metrics.byCategory[cat] || 0) + 1;
      });
    }

    totalConfidence += ip.abuseConfidenceScore || 0;
  });

  // Top IPs por confidence score
  metrics.topIPs = ipDataList
    .map(ip => ({
      ip: ip.ipAddress,
      confidence: ip.abuseConfidenceScore || 0,
      reports: ip.totalReports || ip.numReports || 1,
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);

  metrics.averageConfidence = ipDataList.length > 0
    ? Math.round(totalConfidence / ipDataList.length)
    : 0;

  return metrics;
}

/**
 * Consulta una IP específica en AbuseIPDB
 */
async function checkIP(ipAddress) {
  if (!ABUSEIPDB_API_KEY) {
    return { error: 'ABUSEIPDB_API_KEY not configured' };
  }

  try {
    const params = new URLSearchParams({
      ipAddress,
      maxAgeInDays: '90',
      verbose: '',
    });

    const url = `${ABUSEIPDB_API_URL}/check?${params}`;

    const response = await safeFetch(url, {
      headers: {
        'Key': ABUSEIPDB_API_KEY,
        'Accept': 'application/json',
      },
      timeout: 15000,
    });

    if (response.error) {
      return { error: response.error };
    }

    const data = response.data;

    return {
      ipAddress: data.ipAddress,
      isPublic: data.isPublic,
      abuseConfidenceScore: data.abuseConfidenceScore || 0,
      countryCode: data.countryCode,
      countryName: data.countryName,
      usageType: data.usageType,
      isp: data.isp,
      domain: data.domain,
      hostnames: data.hostnames || [],
      totalReports: data.totalReports || 0,
      lastReportedAt: data.lastReportedAt,
      reports: data.reports || [],
    };

  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Obtiene datos de múltiples IPs (para briefing)
 */
async function fetchMultipleIPs(ipList) {
  const results = [];

  // Consultar IPs en batches de 5 para evitar rate limiting
  const batchSize = 5;
  for (let i = 0; i < ipList.length; i += batchSize) {
    const batch = ipList.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map(ip => checkIP(ip))
    );

    batchResults.forEach(result => {
      if (result.status === 'fulfilled' && !result.value.error) {
        // Solo incluir IPs con reportes recientes
        if (result.value.totalReports > 0) {
          results.push(result.value);
        }
      }
    });

    // Pequeña pausa entre batches
    if (i + batchSize < ipList.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * ENDPOINT PRINCIPAL - Obtiene datos de amenazas desde AbuseIPDB
 * Usa un set de IPs conocidas para generar datos
 */
export async function mainEndpoint(options = {}) {
  const { limit = 50 } = options;

  if (!ABUSEIPDB_API_KEY) {
    return {
      configured: false,
      events: [],
      metrics: null,
      error: 'ABUSEIPDB_API_KEY not configured',
    };
  }

  try {
    console.error('[AbuseIPDB] Fetching threat data from known IPs...');

    // Set de IPs conocidas por actividad maliciosa (basado en threat feeds públicos)
    const knownThreatIPs = [
      // Tor exit nodes (frecuentemente reportados)
      '185.220.101.1', '185.220.101.2', '185.220.101.3',
      '185.220.101.4', '185.220.101.5', '185.220.101.6',

      // IPs conocidas de botnets y scanners (ejemplos de threat intelligence)
      '45.142.212.31',
      '192.42.116.208',
      '185.156.189.142',
      '198.98.50.126',
      '109.236.86.228',
      '94.156.189.142',
      '45.9.148.124',
      '5.188.86.21',

      // Servidores expuestos/recientes
      '185.220.101.182',
      '185.220.101.183',
      '185.220.101.184',

      // IPs de diversas regiones para diversidad geográfica
      '103.21.244.10',  // Asia
      '185.220.101.7',  // Europa
      '209.141.36.63',  // Norteamérica
    ];

    const ipDataList = await fetchMultipleIPs(knownThreatIPs);

    console.error(`[AbuseIPDB] Retrieved data for ${ipDataList.length} IPs`);

    // Filtrar por confidence score mínimo
    const minConfidence = 10;
    const filteredIPs = ipDataList.filter(
      ip => (ip.abuseConfidenceScore || 0) >= minConfidence
    );

    console.error(`[AbuseIPDB] ${filteredIPs.length} IPs meet minimum confidence threshold`);

    // Mapear a AttackEvents
    const events = filteredIPs.slice(0, limit).map(ip => {
      // Construir datos de categorías desde los reportes si existen
      const categories = ip.reports && ip.reports.length > 0
        ? [...new Set(ip.reports.flatMap(r => r.categories || []))]
        : [];

      const ipData = {
        ipAddress: ip.ipAddress,
        countryCode: ip.countryCode,
        abuseConfidenceScore: ip.abuseConfidenceScore,
        categories,
        lastReportedAt: ip.lastReportedAt,
        totalReports: ip.totalReports,
      };

      return mapAbuseIPDBToAttackEvent(ipData, ip);
    });

    // Calcular métricas
    const metrics = calculateMetrics(filteredIPs);

    return {
      configured: true,
      events,
      metrics,
      totalReports: filteredIPs.length,
      error: null,
    };

  } catch (error) {
    return {
      configured: true,
      events: [],
      metrics: null,
      error: error.message,
    };
  }
}

/**
 * OPCIÓN A - Reportes recientes
 */
export async function getRecent(limit = 25) {
  const data = await mainEndpoint({ limit });
  return {
    events: data.events.slice(0, limit),
    total: data.events.length,
    error: data.error,
  };
}

/**
 * OPCIÓN B - Consulta IP específica
 */
export async function getByIP(ipAddress) {
  const result = await checkIP(ipAddress);
  return result;
}

/**
 * OPCIÓN C - Métricas agregadas
 */
export async function getMetrics() {
  const data = await mainEndpoint({ limit: 100 });
  return data.metrics;
}

/**
 * Función principal briefing() - Integra con el sistema
 */
export async function briefing() {
  if (!ABUSEIPDB_API_KEY) {
    return {
      source: 'AbuseIPDB',
      timestamp: new Date().toISOString(),
      configured: false,
      events: [],
      note: 'Configure ABUSEIPDB_API_KEY to enable AbuseIPDB integration',
    };
  }

  // Usar cache si está disponible
  const now = Date.now();
  if (cache && cacheTime && (now - cacheTime < CACHE_TTL_MS)) {
    return {
      ...cache,
      cached: true,
      cacheAge: Math.round((now - cacheTime) / 1000),
    };
  }

  // Obtener datos frescos
  const data = await mainEndpoint({ limit: 50 });

  const result = {
    source: 'AbuseIPDB',
    timestamp: new Date().toISOString(),
    configured: data.configured,
    events: data.events || [],
    total_events: data.totalReports || 0,
    metrics: data.metrics,
    error: data.error,
  };

  // Actualizar cache
  cache = result;
  cacheTime = now;

  return result;
}

// Ejecutable standalone
if (process.argv[1]?.endsWith('abuseipdb.mjs')) {
  const option = process.argv[2] || 'all';

  console.error(`[AbuseIPDB] Testing option: ${option}`);

  if (option === 'recent' || option === 'all') {
    console.error('[AbuseIPDB] Testing getRecent()...');
    const recent = await getRecent(5);
    console.log(JSON.stringify({ option: 'getRecent', data: recent }, null, 2));
  }

  if (option === 'ip' || option === 'all') {
    console.error('[AbuseIPDB] Testing getByIP()...');
    const ipData = await getByIP('8.8.8.8');
    console.log(JSON.stringify({ option: 'getByIP', data: ipData }, null, 2));
  }

  if (option === 'metrics' || option === 'all') {
    console.error('[AbuseIPDB] Testing getMetrics()...');
    const metrics = await getMetrics();
    console.log(JSON.stringify({ option: 'getMetrics', data: metrics }, null, 2));
  }

  if (option === 'briefing' || option === 'all') {
    console.error('[AbuseIPDB] Testing briefing()...');
    const briefingData = await briefing();
    console.log(JSON.stringify({ option: 'briefing', data: briefingData }, null, 2));
  }
}
