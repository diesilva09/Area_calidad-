/**
 * Utilidades para generar keys estables en React y evitar el error de removeChild
 */

/**
 * Genera una key estable para elementos en listas
 * @param base - Base para la key (ej: nombre del componente)
 * @param item - El item actual
 * @param index - El índice del item
 * @returns Una key estable y única
 */
export function getStableKey(base: string, item: any, index: number): string {
  // Intentar obtener un identificador único del item
  const itemKey = item?.id || item?.key || item?.name || item?.code;
  
  if (itemKey) {
    return `${base}-${itemKey}`;
  }
  
  // Si no hay identificador único, usar el índice con un prefijo
  return `${base}-item-${index}`;
}

/**
 * Genera una key para inputs dinámicos
 * @param base - Base para la key
 * @param index - Índice del input
 * @param value - Valor actual del input
 * @returns Una key estable
 */
export function getInputKey(base: string, index: number, value?: string): string {
  const valueKey = value ? `-${value.slice(0, 20)}` : '';
  return `${base}-${index}${valueKey}`;
}

/**
 * Genera una key para componentes de configuración
 * @param type - Tipo de configuración
 * @param config - Objeto de configuración
 * @param index - Índice
 * @returns Una key estable
 */
export function getConfigKey(type: string, config: any, index: number): string {
  const identifier = config?.envase_tipo || config?.equipo || config?.parametro || config?.name || 'config';
  return `${type}-${identifier}-${index}`;
}

/**
 * Genera una key para arrays de datos
 * @param base - Base para la key
 * @param data - Array de datos
 * @param index - Índice
 * @returns Una key estable
 */
export function getArrayKey(base: string, data: any[], index: number): string {
  const item = data[index];
  const identifier = item?.date || item?.id || item?.name || item?.code || `item-${index}`;
  return `${base}-${identifier}-${index}`;
}
