// T-Pot Honeypot — Ingesta desde honeypot T-Pot
// T-Pot es un honeypot all-in-one que expone datos vía API REST o logs
// Este módulo asume que T-Pot corre localmente o en URL configurable

import { safeFetch } from '../utils/fetch.mjs';
import '../utils/env.mjs';

// Configuración vía env vars
const TPOT_API_URL = process.env.TPOT_API_URL || 'http://localhost:64242';
const TPOT_API_KEY = process.env.TPOT_API_KEY || null;

/**
 * Convierte un ataque T-Pot a formato AttackEvent de Kuntur
 */
function mapTpotToAttackEvent(tpotEvent) {
  // Mapeo de tipos T-Pot → Kuntur attack types
  const attackTypeMap = {
    'portscan': 'port_scan',
    'bruteforce': 'brute_force',
    'dos': 'ddos',
    'malware': 'malware_c2',
    'exploit': 'exploit_attempt',
    'recon': 'recon',
  };

  const attackType = attackTypeMap[tpotEvent.attack_type] || 'other';
  const severity = tpotEvent.severity || 'medium';

  return {
    id: tpotEvent.id || `tpot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: tpotEvent.timestamp || new Date().toISOString(),
    source_ip: tpotEvent.source_ip || '0.0.0.0',
    dest_ip: tpotEvent.dest_ip || TPOT_API_URL,
    source_country: tpotEvent.source_country || null,
    dest_country: tpotEvent.dest_country || null,
    source_lat: tpotEvent.source_lat || null,
    source_lng: tpotEvent.source_lng || null,
    dest_lat: tpotEvent.dest_lat || null,
    dest_lng: tpotEvent.dest_lng || null,
    attack_type: attackType,
    mitre_technique_id: tpotEvent.mitre_id || null,
    severity: severity,
    confidence: tpotEvent.confidence || 0.8,
    source_feed: 'tpot',
    involves_bolivia: false, // Se calculará en el pipeline de enriquecimiento
  };
}

/**
 * Obtiene ataques desde T-Pot API
 */
async function fetchTpotAttacks() {
  if (!TPOT_API_URL) {
    return { error: 'TPOT_API_URL not configured' };
  }

  const headers = {};
  if (TPOT_API_KEY) {
    headers['Authorization'] = `Bearer ${TPOT_API_KEY}`;
  }

  try {
    const response = await safeFetch(`${TPOT_API_URL}/api/attacks`, {
      headers,
      timeout: 10000,
    });

    if (response.error) {
      return { error: response.error };
    }

    // Asumimos que T-Pot retorna { attacks: [...] }
    const attacks = response.attacks || [];
    const events = attacks.map(mapTpotToAttackEvent);

    return { events, total: events.length };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Función principal briefing()
 */
export async function briefing() {
  // Si no hay configuración, retornar vacío (no fallar el sweep)
  if (!TPOT_API_URL || TPOT_API_URL === 'http://localhost:64242') {
    return {
      source: 'T-Pot',
      timestamp: new Date().toISOString(),
      configured: false,
      events: [],
      note: 'Configure TPOT_API_URL to enable T-Pot integration',
    };
  }

  const result = await fetchTpotAttacks();

  return {
    source: 'T-Pot',
    timestamp: new Date().toISOString(),
    configured: true,
    events: result.events || [],
    total_events: result.total || 0,
    error: result.error || null,
  };
}

// Ejecutable standalone
if (process.argv[1]?.endsWith('tpot.mjs')) {
  const data = await briefing();
  console.log(JSON.stringify(data, null, 2));
}
