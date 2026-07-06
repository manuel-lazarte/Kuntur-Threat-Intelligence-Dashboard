// MaxMind GeoLite2 — Geolocalización de IPs
// Proporciona: país, ciudad, latitud, longitud
//
// DESCARGA DE LA DB:
// 1. Crear cuenta gratuita en https://www.maxmind.com/en/geolite2/signup
// 2. Obtener License Key
// 3. Configurar MAXMIND_LICENSE_KEY en .env
//
// INSTALACIÓN:
// npm install @maxmind/geoip2-node

import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import '../../apis/utils/env.mjs'; // Load .env for MAXMIND_LICENSE_KEY

const ROOT = process.cwd();
const DEFAULT_DB_PATH = join(ROOT, 'data/GeoLite2-City.mmdb');
const DB_PATH = process.env.MAXMIND_DB_PATH || DEFAULT_DB_PATH;
const LICENSE_KEY = process.env.MAXMIND_LICENSE_KEY || null;

// Cache del reader de MaxMind
let maxmindReader = null;

/**
 * Inicializa el reader de MaxMind GeoLite2
 */
async function initMaxMindReader() {
  if (maxmindReader) return maxmindReader;

  // Verificar si la DB existe
  const dbPath = await ensureMaxMindDB();
  if (!dbPath) return null;

  try {
    // Intentar importar @maxmind/geoip2-node
    const { Reader } = await import('@maxmind/geoip2-node');
    maxmindReader = await Reader.open(dbPath);
    console.log('[MaxMind] Reader initialized successfully');
    return maxmindReader;
  } catch (error) {
    console.warn('[MaxMind] @maxmind/geoip2-node not installed. Geolocation will be limited.');
    console.warn('[MaxMind] Install with: npm install @maxmind/geoip2-node');
    return null;
  }
}

/**
 * Descarga la base de datos GeoLite2-City desde MaxMind
 */
export async function downloadMaxMindDB() {
  if (!LICENSE_KEY) {
    throw new Error('MAXMIND_LICENSE_KEY no configurado. Obtenlo gratis en https://www.maxmind.com/en/geolite2/signup');
  }

  const DOWNLOAD_URL = `https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=${LICENSE_KEY}&suffix=tar.gz`;

  try {
    console.log('[MaxMind] Descargando GeoLite2-City database...');
    console.log(`[MaxMind] URL: ${DOWNLOAD_URL}`);

    const response = await fetch(DOWNLOAD_URL);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to download: ${response.status} ${errorText.substring(0, 200)}`);
    }

    // Crear directorio data/ si no existe
    const dataDir = join(ROOT, 'data');
    if (!existsSync(dataDir)) {
      const { mkdir } = await import('fs/promises');
      await mkdir(dataDir, { recursive: true });
    }

    // Guardar tar.gz temporalmente
    const tarPath = join(ROOT, 'data/GeoLite2-City.tar.gz');
    const buffer = await response.arrayBuffer();
    const { writeFile } = await import('fs/promises');
    await writeFile(tarPath, Buffer.from(buffer));

    console.log('[MaxMind] Download completado, extrayendo...');

    // Extraer .tar.gz
    const { execSync } = await import('child_process');
    const tarCommand = process.platform === 'win32'
      ? `tar -xzf "${tarPath}" -C "${dataDir}" --strip-components=1 GeoLite2-City.mmdb`
      : `tar -xzf "${tarPath}" -C "${dataDir}" --strip-components=1 "GeoLite2-City.mmdb"`;

    try {
      execSync(tarCommand, { stdio: 'inherit' });
    } catch (err) {
      // Fallback: intentar sin strip-components
      execSync(`tar -xzf "${tarPath}" -C "${dataDir}"`, { stdio: 'inherit' });
    }

    // Limpiar tar.gz
    const { unlinkSync } = await import('fs');
    unlinkSync(tarPath);

    // Verificar que se creó el .mmdb
    const finalPath = existsSync(DEFAULT_DB_PATH) ? DEFAULT_DB_PATH : join(dataDir, 'GeoLite2-City.mmdb');
    if (existsSync(finalPath)) {
      console.log(`[MaxMind] ✓ Database descargada: ${finalPath}`);
      return finalPath;
    } else {
      throw new Error('Database file not found after extraction');
    }

  } catch (error) {
    throw new Error(`MaxMind download failed: ${error.message}`);
  }
}

/**
 * Verifica que la DB exista, si no, intenta descargarla
 */
export async function ensureMaxMindDB() {
  // Primero verificar si ya existe
  if (existsSync(DB_PATH)) {
    return DB_PATH;
  }

  // Intentar descargar si hay license key
  if (LICENSE_KEY) {
    return await downloadMaxMindDB();
  }

  console.warn('[MaxMind] DB no encontrada y no hay LICENSE_KEY para descargar');
  return null;
}

/**
 * Busca la ubicación de una IP usando MaxMind
 *
 * @param {string} ipAddress - Dirección IP a geolocalizar
 * @returns {Object|null} - { country, city, lat, lng } o null si no se encuentra
 */
export async function lookupIP(ipAddress) {
  if (!ipAddress) return null;

  // Inicializar reader si no está inicializado
  const reader = await initMaxMindReader();
  if (!reader) {
    return null;
  }

  try {
    const result = reader.city(ipAddress);

    return {
      country: result.country?.isoCode || null,
      countryName: result.country?.names?.en || null,
      city: result.city?.names?.en || null,
      lat: result.location?.latitude || null,
      lng: result.location?.longitude || null,
      continent: result.continent?.code || null,
    };
  } catch (error) {
    // IP no encontrada o inválida
    return null;
  }
}

/**
 * Enriquece un AttackEvent con coordenadas geográficas
 * Si el evento ya tiene coordenadas, las respeta
 * Si no, intenta resolverlas usando MaxMind
 */
async function enrichEventGeo(event) {
  // Si ya tiene coordenadas, no hacer nada
  if (event.source_lat && event.source_lng) {
    return event;
  }

  // Intentar resolver IP origen
  if (event.source_ip) {
    const geo = await lookupIP(event.source_ip);
    if (geo) {
      event.source_lat = geo.lat;
      event.source_lng = geo.lng;
      event.source_country = geo.country;
      event.source_city = geo.city;
    }
  }

  // Intentar resolver IP destino
  if (event.dest_ip && !event.dest_lat) {
    const geo = await lookupIP(event.dest_ip);
    if (geo) {
      event.dest_lat = geo.lat;
      event.dest_lng = geo.lng;
      event.dest_country = geo.country;
      event.dest_city = geo.city;
    }
  }

  return event;
}

/**
 * Calcula involves_bolivia basado en países
 */
export function calculateInvolvesBolivia(event) {
  if (!event) return false;

  // Verificar países
  const sourceIsBolivia = event.source_country === 'BO';
  const destIsBolivia = event.dest_country === 'BO';

  return sourceIsBolivia || destIsBolivia;
}

/**
 * Eleva severidad si involucra Bolivia
 */
export function elevateSeverityForBolivia(event) {
  if (!event || !event.involves_bolivia) {
    return event.severity;
  }

  const severityMap = {
    'low': 'medium',
    'medium': 'high',
    'high': 'critical',
    'critical': 'critical',
  };

  return severityMap[event.severity] || event.severity;
}

/**
 * Enriquece completamente un AttackEvent
 * Esta es la función principal que se exporta
 */
export async function enrichAttackEvent(event) {
  if (!event || typeof event !== 'object') {
    return null;
  }

  // 1. Enriquecer geolocalización
  const geoEnriched = await enrichEventGeo(event);

  // 2. Calcular involves_bolivia si no está calculado
  if (geoEnriched.involves_bolivia === undefined || geoEnriched.involves_bolivia === null) {
    geoEnriched.involves_bolivia = calculateInvolvesBolivia(geoEnriched);
  }

  // 3. Elevar severidad si involucra Bolivia
  if (geoEnriched.involves_bolivia) {
    geoEnriched.severity = elevateSeverityForBolivia(geoEnriched);
  }

  return geoEnriched;
}

/**
 * Enriquece un array de AttackEvents
 */
export async function enrichAttackEvents(events) {
  if (!Array.isArray(events)) {
    return [];
  }

  const enriched = [];
  for (const event of events) {
    try {
      const enrichedEvent = await enrichAttackEvent(event);
      if (enrichedEvent) {
        enriched.push(enrichedEvent);
      }
    } catch (error) {
      console.error(`[MaxMind] Error enriching event ${event?.id}:`, error.message);
      enriched.push(event); // Retornar original en caso de error
    }
  }

  return enriched;
}
