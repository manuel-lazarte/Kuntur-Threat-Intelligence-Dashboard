// GreyNoise — Intel de IPs que escanean internet
// API: https://docs.greynoise.io/docs/using-the-greynoise-community-api
// Community API v3:
//   - Sin autenticar: 10 búsquedas/día
//   - Cuenta gratuita: 50 búsquetas/semana (~200/mes)
//   - Con API key: 50 búsquedas/semana
//   - Enterprise: más límites
//
// ENDPOINTS:
//   - Community: https://api.greynoise.io/v3/community/{ip}
//   - Enterprise: https://api.greynoise.io/v3/noise/quick/{ips} (requiere API key)

import { safeFetch } from '../utils/fetch.mjs';
import '../utils/env.mjs';

const GREYNOISE_API_KEY = process.env.GREYNOISE_API_KEY || null;
const GREYNOISE_API_URL = 'https://api.greynoise.io';

/**
 * Mapea un resultado de GreyNoise Community API a AttackEvent
 *
 * Respuesta de Community API:
 * {
 *   "ip": "51.91.185.74",
 *   "noise": true,        // Escaneó internet en últimos 90 días
 *   "riot": false,        // Está en dataset RIOT (benigno conocido)
 *   "classification": "malicious", // benign, malicious, unknown
 *   "name": "unknown",
 *   "link": "https://viz.greynoise.io/ip/51.91.185.74",
 *   "last_seen": "2021-03-18",
 *   "message": "Success"
 * }
 */
function mapGreyNoiseToAttackEvent(gnResult, confidence = 0.8) {
  // Mapear clasificaciones GreyNoise a tipos de ataque
  const attackTypeMap = {
    'malicious': 'other',
    'benign': 'recon',
    'unknown': 'unknown',
  };

  // Determinar severidad basado en classification
  let severity = 'low';
  if (gnResult.classification === 'malicious') {
    severity = 'high';
  }

  const classification = gnResult.classification || 'unknown';
  const attackType = attackTypeMap[classification] || 'other';

  return {
    id: `greynoise-${gnResult.ip}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    source_ip: gnResult.ip || '0.0.0.0',
    dest_ip: null, // GreyNoise reporta escaneo genérico
    source_country: null, // Community API no retorna geolocalización
    dest_country: null,
    source_lat: null,
    source_lng: null,
    dest_lat: null,
    dest_lng: null,
    attack_type: attackType,
    mitre_technique_id: null,
    severity,
    confidence,
    source_feed: 'greynoise',
    involves_bolivia: false,
    raw_result: gnResult,
  };
}

/**
 * Consulta una IP específica usando Community API
 * @param {string} ip - IP a consultar
 * @returns {object|null} Resultado de GreyNoise o null si hay error
 */
async function lookupIP(ip) {
  if (!ip || !isValidIPv4(ip)) {
    return { error: 'Invalid IPv4 address' };
  }

  try {
    const headers = { 'Accept': 'application/json' };
    if (GREYNOISE_API_KEY) {
      headers['key'] = GREYNOISE_API_KEY;
    }

    const response = await safeFetch(`${GREYNOISE_API_URL}/v3/community/${ip}`, {
      headers,
      timeout: 10000,
    });

    if (response.error) {
      return { error: response.error };
    }

    // Rate limit exceeded
    if (response.status === 429) {
      return {
        error: 'Rate limit exceeded',
        message: response.message,
        plan: response.plan,
        limit: response['rate-limit'],
        plan_url: response.plan_url,
      };
    }

    // IP no encontrada o sin datos
    if (!response.noise && !response.riot) {
      return { not_found: true, ip, message: response.message };
    }

    return response;
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Valida dirección IPv4
 */
function isValidIPv4(ip) {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}

/**
 * Obtiene información de múltiples IPs (limite rate limits)
 * @param {string[]} ips - Array de IPs a consultar
 * @returns {object} { events, errors, rate_limit }
 */
async function lookupMultipleIPs(ips) {
  const events = [];
  const errors = [];
  let rateLimitHit = false;

  for (const ip of ips) {
    // Si ya hitimos rate limit, stop
    if (rateLimitHit) {
      errors.push({ ip, error: 'Skipped due to rate limit' });
      continue;
    }

    const result = await lookupIP(ip);

    if (result.error) {
      if (result.error === 'Rate limit exceeded') {
        rateLimitHit = true;
        errors.push({ ip, error: result, rate_limit: true });
      } else {
        errors.push({ ip, error: result.error });
      }
    } else if (!result.not_found) {
      events.push(mapGreyNoiseToAttackEvent(result, 0.8));
    }
  }

  return {
    events,
    errors,
    rate_limit_hit: rateLimitHit,
    total: events.length,
  };
}

/**
 * Función principal briefing()
 *
 * NOTA: La Community API tiene límites estrictos:
 * - Sin auth: 10 búsquedas/día
 * - Con cuenta gratuita: 50/semana (~200/mes)
 *
 * Para producción, usa ips conocidas maliciosas o consulta bajo demanda.
 */
export async function briefing(ips = null) {
  // IPs de ejemplo si no se proporcionan
  const DEFAULT_IPS = [
    '8.8.8.8',        // Google DNS (benigno)
    '1.1.1.1',        // Cloudflare (benigno)
    '51.91.185.74',   // IP maliciosa conocida (ejemplo)
  ];

  const targetIPs = ips || DEFAULT_IPS.slice(0, 3); // Max 3 para evitar rate limits

  const result = await lookupMultipleIPs(targetIPs);

  return {
    source: 'GreyNoise',
    timestamp: new Date().toISOString(),
    api_type: GREYNOISE_API_KEY ? 'community-authenticated' : 'community-unauthenticated',
    configured: true,
    events: result.events || [],
    total_events: result.total || 0,
    errors: result.errors || [],
    rate_limit_hit: result.rate_limit_hit || false,
    metadata: {
      api_docs: 'https://docs.greynoise.io/docs/using-the-greynoise-community-api',
      limits: GREYNOISE_API_KEY
        ? '50 searches/week with free account'
        : '10 searches/day unauthenticated',
      note: 'For higher limits, consider upgrading to GreyNoise Enterprise',
    },
  };
}

/**
 * Función para consultar una IP específica
 * @param {string} ip - IP a consultar
 * @returns {object} Resultado completo de GreyNoise
 */
export async function queryIP(ip) {
  return await lookupIP(ip);
}

// Ejecutable standalone
if (process.argv[1]?.endsWith('greynoise.mjs')) {
  const data = await briefing();
  console.log(JSON.stringify(data, null, 2));
}
