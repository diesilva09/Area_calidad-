import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  try {
    console.log('🔍 Test DB: Iniciando prueba de conexión...');
    
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'area_calidad',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    console.log('🔗 Test DB: Configuración:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      database: process.env.DB_NAME || 'area_calidad',
      user: process.env.DB_USER || 'postgres'
    });

    // Probar conexión
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    
    // Probar tabla users
    const usersResult = await pool.query('SELECT COUNT(*) as total_users FROM users');
    
    // Listar usuarios
    const usersList = await pool.query('SELECT id, email, name, role, is_active, email_verified FROM users LIMIT 5');

    console.log('✅ Test DB: Conexión exitosa');
    console.log('📊 Test DB: Usuarios totales:', usersResult.rows[0].total_users);
    console.log('👥 Test DB: Usuarios encontrados:', usersList.rows.length);

    return NextResponse.json({
      success: true,
      message: 'Conexión a base de datos exitosa',
      data: {
        current_time: result.rows[0].current_time,
        pg_version: result.rows[0].pg_version,
        total_users: usersResult.rows[0].total_users,
        users: usersList.rows
      }
    });

  } catch (error) {
    console.error('❌ Test DB: Error en conexión:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      details: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '5432',
        database: process.env.DB_NAME || 'area_calidad',
        user: process.env.DB_USER || 'postgres'
      }
    }, { status: 500 });
  }
}
