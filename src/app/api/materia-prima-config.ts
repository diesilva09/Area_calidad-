/**
 * Configuración compartida para las APIs de Materia Prima
 * 
 * Este archivo centraliza la configuración del esquema de base de datos
 * para todas las tablas de materia prima.
 */

// Nombre del esquema para las tablas de materia prima
export const MATERIA_PRIMA_SCHEMA = 'materia_prima';

// Mapeo de tablas con su nombre completo incluyendo esquema
export const MATERIA_PRIMA_TABLES = {
  inspeccion_vehiculo: `${MATERIA_PRIMA_SCHEMA}.inspeccion_vehiculo`,
  analisis_fisicoquimico_materia_prima: `${MATERIA_PRIMA_SCHEMA}.analisis_fisicoquimico_materia_prima`,
  analisis_materiales_empaque: `${MATERIA_PRIMA_SCHEMA}.analisis_materiales_empaque`,
} as const;

// Función utilitaria para obtener el nombre completo de una tabla
export function getMateriaPrimaTable(table: keyof typeof MATERIA_PRIMA_TABLES): string {
  return MATERIA_PRIMA_TABLES[table];
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
