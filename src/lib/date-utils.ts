// Utilidades para manejo de fechas consistentes en toda la aplicación
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Obtiene la fecha actual formateada como YYYY-MM-DD
 * @returns string - Fecha actual en formato ISO
 */
export const getFechaActual = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Obtiene el mes actual en español
 * @returns string - Nombre del mes actual en español (ej: "febrero")
 */
export const getMesActual = (): string => {
  return format(new Date(), 'MMMM', { locale: es });
};

/**
 * Obtiene la hora actual formateada como HH:mm
 * @returns string - Hora actual en formato 24h
 */
export const getHoraActual = (): string => {
  return format(new Date(), 'HH:mm');
};

/**
 * Obtiene la fecha y hora actual formateada
 * @returns string - Fecha y hora actual (ej: "2024-02-02 14:30")
 */
export const getFechaHoraActual = (): string => {
  return format(new Date(), 'yyyy-MM-dd HH:mm');
};

/**
 * Obtiene un objeto con todas las fechas/horas actuales
 * @returns object - Objeto con fecha, mes y hora actuales
 */
export const getFechasActuales = () => {
  const fechaActual = new Date();
  return {
    fecha: format(fechaActual, 'yyyy-MM-dd'),
    mesCorte: format(fechaActual, 'MMMM', { locale: es }),
    hora: format(fechaActual, 'HH:mm'),
    fechaHora: format(fechaActual, 'yyyy-MM-dd HH:mm'),
    fechaLarga: format(fechaActual, 'PPP', { locale: es }),
    timestamp: fechaActual.getTime()
  };
};

/**
 * Verifica si una fecha es hoy
 * @param fecha - Fecha a verificar (string YYYY-MM-DD)
 * @returns boolean - True si la fecha es hoy
 */
export const esHoy = (fecha: string): boolean => {
  return fecha === getFechaActual();
};

/**
 * Formatea una fecha para mostrar en español
 * @param fecha - Fecha a formatear (string o Date)
 * @returns string - Fecha formateada en español
 */
export const formatearFechaLarga = (fecha: string | Date): string => {
  const dateObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return format(dateObj, 'PPP', { locale: es });
};

/**
 * Obtiene el nombre del mes en español
 * @param mes - Número del mes (1-12)
 * @returns string - Nombre del mes en español
 */
export const getNombreMes = (mes: number): string => {
  const fecha = new Date();
  fecha.setMonth(mes - 1); // Los meses en JavaScript son 0-11
  return format(fecha, 'MMMM', { locale: es });
};

/**
 * Obtiene la fecha del primer día del mes actual
 * @returns string - Primer día del mes actual en formato YYYY-MM-DD
 */
export const getPrimerDiaMes = (): string => {
  const fecha = new Date();
  fecha.setDate(1);
  return format(fecha, 'yyyy-MM-dd');
};

/**
 * Obtiene la fecha del último día del mes actual
 * @returns string - Último día del mes actual en formato YYYY-MM-DD
 */
export const getUltimoDiaMes = (): string => {
  const fecha = new Date();
  fecha.setMonth(fecha.getMonth() + 1, 0); // Último día del mes actual
  return format(fecha, 'yyyy-MM-dd');
};
