// ============================================================
// UTILIDADES DE FECHA CENTRALIZADAS
// ============================================================
// 1. parseDateLocal()  — parsea "YYYY-MM-DD" sin desfase UTC
// 2. formatDateLocal() — formatea una fecha al locale español
// 3. getDaysUntil()    — días que faltan desde hoy
// 4. getDateLabel()    — "¡Hoy!", "Mañana", "Faltan X días", etc.
// ============================================================

/**
 * Parsea un string "YYYY-MM-DD" como fecha LOCAL (no UTC).
 * Esto corrige el bug de "off-by-one day" que ocurre al hacer
 * new Date("2026-02-08") que lo interpreta como UTC medianoche
 * y al convertir a local resta un día en zonas horarias negativas.
 */
export function parseDateLocal(dateStr: string): Date {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formatea una fecha al español: "8 de febrero de 2026"
 * Usa parseDateLocal internamente para evitar desfase.
 */
export function formatDateLocal(dateStr: string): string {
  const date = parseDateLocal(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Calcula los días que faltan desde HOY hasta la fecha dada.
 * Positivo = futuro, 0 = hoy, negativo = pasado.
 */
export function getDaysUntil(dateStr: string): number {
  const target = parseDateLocal(dateStr);
  const today = new Date();
  // Limpiar hora para comparar solo días
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Devuelve una etiqueta legible:
 *   - "¡Hoy!"       si faltan 0 días
 *   - "Mañana"      si falta 1 día
 *   - "Faltan X días" si faltan más
 *   - "Pasó hace X días" si ya pasó
 *   - ""            si no hay fecha
 */
export function getDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const days = getDaysUntil(dateStr);
  if (days < 0) return `Hace ${Math.abs(days)} día${Math.abs(days) === 1 ? '' : 's'}`;
  if (days === 0) return '¡Hoy!';
  if (days === 1) return 'Mañana';
  return `Faltan ${days} días`;
}

/**
 * Devuelve la clase de color según la urgencia.
 */
export function getDateLabelColor(dateStr: string): string {
  if (!dateStr) return '';
  const days = getDaysUntil(dateStr);
  if (days < 0) return 'text-gray-400';
  if (days === 0) return 'text-red-500 font-semibold';
  if (days === 1) return 'text-orange-500 font-medium';
  if (days <= 3) return 'text-amber-500';
  return 'text-green-500';
}
