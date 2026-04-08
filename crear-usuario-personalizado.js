// =====================================================
// CREAR USUARIO CON BCRYPT - PERSONALIZABLE
// =====================================================
// Uso: node crear-usuario-personalizado.js

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

// ===== CONFIGURACIÓN DEL USUARIO =====
// CAMBIA ESTOS VALORES SEGÚN NECESITES
const CONFIG = {
  email: 'nuevo.usuario@empresa.com',
  name: 'Usuario de Prueba',
  role: 'tecnico', // 'jefe', 'operario', 'tecnico'
  password: 'Temp123!@#'
};

async function crearUsuario() {
  try {
    console.log('🔐 Generando hash de contraseña...');
    
    // Generar hash con bcrypt
    const hashedPassword = await bcrypt.hash(CONFIG.password, 10);
    
    // Insertar en la base de datos
    const query = `
      INSERT INTO users (id, name, email, role, password, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, role
    `;
    
    const result = await pool.query(query, [
      'usr_' + Date.now(),
      CONFIG.name,
      CONFIG.email,
      CONFIG.role,
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
    console.log('🔐 Contraseña temporal:', CONFIG.password);
    console.log('📅 Creado el:', usuario.created_at);
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('🌐 Para iniciar sesión:');
    console.log('   URL: http://localhost:3000/login');
    console.log('   Email:', CONFIG.email);
    console.log('   Contraseña:', CONFIG.password);
    console.log('');
    console.log('💡 Para cambiar los datos del usuario, edita las variables en la sección CONFIG de este archivo');
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error creando usuario:', error.message);
    await pool.end();
  }
}

crearUsuario();
