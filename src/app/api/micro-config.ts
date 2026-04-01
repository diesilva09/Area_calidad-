/**
 * Configuración compartida para las APIs del Laboratorio de Microbiología
 * 
 * Este archivo centraliza la configuración del esquema de base de datos
 * para todas las tablas de microbiología.
 */

// Nombre del esquema para las tablas de microbiología
// Cambiar este valor si se mueve el esquema a otro nombre
export const MICRO_SCHEMA = 'lab_microbiologia';

// Mapeo de tablas con su nombre completo incluyendo esquema
export const MICRO_TABLES = {
  condiciones_ambientales: `${MICRO_SCHEMA}.condiciones_ambientales`,
  control_lavado_inactivacion: `${MICRO_SCHEMA}.control_lavado_inactivacion`,
  custodia_muestras: `${MICRO_SCHEMA}.custodia_muestras`,
  esterilizacion_autoclave: `${MICRO_SCHEMA}.esterilizacion_autoclave`,
  incubadora_control: `${MICRO_SCHEMA}.incubadora_control`,
  medios_cultivo: `${MICRO_SCHEMA}.medios_cultivo`,
  registros_recepcion_formatos: `${MICRO_SCHEMA}.registros_recepcion_formatos`,
  resultados_microbiologicos: `${MICRO_SCHEMA}.resultados_microbiologicos`,
  temperatura_equipos: `${MICRO_SCHEMA}.temperatura_equipos`,
} as const;

// Función utilitaria para obtener el nombre completo de una tabla
export function getMicroTable(table: keyof typeof MICRO_TABLES): string {
  return MICRO_TABLES[table];
}

// Configuración de la base de datos
export const getPoolConfig = () => {
  const config: any = {
    host: '127.0.0.1', // Forzar IPv4 para evitar problemas de autenticación
    port: 5432,
    database: 'area_calidad',
    user: 'postgres',
    password: process.env.DB_PASSWORD || 'Coruna.24',
    ssl: { rejectUnauthorized: false },
  };

  return config;
};
