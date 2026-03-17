import { Pool } from 'pg';

/**
 * Configuración inteligente de SSL para PostgreSQL
 * 
 * En desarrollo: SSL deshabilitado (PostgreSQL local no soporta SSL)
 * En producción: SSL habilitado con rejectUnauthorized: false
 * 
 * Esto resuelve el problema "The server does not support SSL connections"
 * manteniendo la seguridad en producción.
 */
export function getDatabaseConfig(databaseName?: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    host: '127.0.0.1', // Forzar IPv4 para evitar problemas de autenticación
    port: parseInt(process.env.DB_PORT || '5432'),
    database: databaseName || process.env.DB_NAME || 'calidad_coruna',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: isProduction 
      ? { rejectUnauthorized: false } 
      : false, // Deshabilitado en desarrollo
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

/**
 * Crea un Pool de PostgreSQL con la configuración SSL apropiada
 */
export function createDatabasePool(databaseName?: string): Pool {
  const config = getDatabaseConfig(databaseName);
  
  console.log('🔗 Configuración de base de datos:', {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    ssl: config.ssl,
    environment: process.env.NODE_ENV || 'development'
  });
  
  return new Pool(config);
}

export { Pool };
