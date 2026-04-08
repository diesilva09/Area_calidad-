// =====================================================
// CREAR USUARIO CON BCRYPT - VERSIÓN SIMPLE
// =====================================================
// Uso: node crear-usuario.js

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Configuración de la base de datos
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'area_calidad',
  password: 'admin', // Cambia esto por tu contraseña real
  port: 5432,
});

async function crearUsuario() {
  try {
    // Datos del nuevo usuario
    const email = 'nuevo.usuario@empresa.com';
    const name = 'Usuario Nuevo';
    const role = 'tecnico';
    const password = 'Temp123!@#';
    
    console.log('🔐 Generando hash de contraseña...');
    
    // Generar hash
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insertar en la base de datos
    const query = `
      INSERT INTO users (id, name, email, role, password, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, role
    `;
    
    const result = await pool.query(query, [
      'usr_' + Date.now(),
      name,
      email,
      role,
      hashedPassword,
      new Date(),
      new Date()
    ]);
    
    const usuario = result.rows[0];
    
    console.log('✅ USUARIO CREADO CORRECTAMENTE');
    console.log('═════════════════════════════════════════');
    console.log('👤 Nombre:', usuario.name);
    console.log('📧 Email:', usuario.email);
    console.log('👔 Rol:', usuario.role);
    console.log('🆔 ID:', usuario.id);
    console.log('🔐 Contraseña temporal:', password);
    console.log('📅 Creado el:', usuario.created_at);
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('🌐 Para iniciar sesión:');
    console.log('   URL: http://localhost:3000/login');
    console.log('   Email:', email);
    console.log('   Contraseña:', password);
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

crearUsuario();
