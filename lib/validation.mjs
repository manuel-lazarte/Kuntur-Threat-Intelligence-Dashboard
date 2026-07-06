// Validación de AttackEvents usando JSON Schema
// Usa ajv (Another JSON Schema Validator) para validar eventos

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Cache del schema y validator
let schema = null;
let Ajv = null;
let validator = null;

/**
 * Carga el schema AttackEvent desde el archivo JSON
 */
function loadSchema() {
  if (schema) return schema;

  const schemaPath = join(process.cwd(), 'schemas/attack-event.schema.json');

  if (!existsSync(schemaPath)) {
    console.warn('[Validation] Schema file not found, skipping validation');
    return null;
  }

  try {
    schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    return schema;
  } catch (error) {
    console.error('[Validation] Error loading schema:', error.message);
    return null;
  }
}

/**
 * Inicializa el validator Ajv
 */
async function initValidator() {
  if (validator) return validator;

  if (!loadSchema()) {
    return null;
  }

  try {
    // Importar Ajv dinámicamente
    Ajv = (await import('ajv')).default;
    validator = new Ajv({ allErrors: true });
    return validator;
  } catch (error) {
    console.warn('[Validation] Ajv not installed, skipping validation. Install with: npm install ajv');
    return null;
  }
}

/**
 * Valida un AttackEvent contra el schema
 *
 * @param {Object} event - Evento a validar
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export async function validateEvent(event) {
  // Si no hay schema disponible, pasar validación
  const ajv = await initValidator();
  if (!ajv || !schema) {
    return { valid: true, errors: [] };
  }

  try {
    const validate = ajv.compile(schema);
    const valid = validate(event);

    if (valid) {
      return { valid: true, errors: [] };
    }

    // Extraer errores legibles
    const errors = validate.errors?.map(err => {
      const path = err.instancePath || err.params?.missing || 'root';
      return `${path}: ${err.message}`;
    }) || [];

    return { valid: false, errors };
  } catch (error) {
    console.error('[Validation] Error validating event:', error.message);
    return { valid: true, errors: [] }; // Pass on error
  }
}

/**
 * Valida un array de AttackEvents
 *
 * @param {Array} events - Array de eventos a validar
 * @returns {Object} - { valid: [], invalid: [], errors: [] }
 */
export async function validateEvents(events) {
  if (!Array.isArray(events)) {
    return {
      valid: [],
      invalid: [],
      errors: [{ eventId: null, message: 'Input is not an array' }]
    };
  }

  const valid = [];
  const invalid = [];
  const errors = [];

  for (const event of events) {
    const validation = await validateEvent(event);

    if (validation.valid) {
      valid.push(event);
    } else {
      invalid.push(event);
      errors.push({
        eventId: event?.id || 'unknown',
        errors: validation.errors
      });
    }
  }

  return { valid, invalid, errors };
}

/**
 * Valida y filtra eventos en un solo paso
 * Retorna solo los eventos válidos, logueando los inválidos
 */
export async function filterValidEvents(events, sourceName = 'unknown') {
  const result = await validateEvents(events);

  // Loguear eventos inválidos
  if (result.invalid.length > 0) {
    console.log(`[Validation] Source ${sourceName}: ${result.invalid.length} invalid events filtered`);
    for (const error of result.errors.slice(0, 5)) { // Max 5 errores
      console.log(`[Validation]   - ${error.eventId}: ${error.errors.join(', ')}`);
    }
    if (result.errors.length > 5) {
      console.log(`[Validation]   ... and ${result.errors.length - 5} more`);
    }
  }

  return result.valid;
}

/**
 * Validación básica sin schema (fallback)
 * Útil cuando ajv no está instalado
 */
export function basicValidation(event) {
  const errors = [];

  if (!event) {
    return { valid: false, errors: ['Event is null or undefined'] };
  }

  // Campos obligatorios básicos
  const requiredFields = ['id', 'timestamp', 'attack_type', 'severity'];
  for (const field of requiredFields) {
    if (!event[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validación de tipos básicos
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
  if (event.confidence !== undefined && (typeof event.confidence !== 'number' || event.confidence < 0 || event.confidence > 1)) {
    errors.push('confidence must be a number between 0 and 1');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
