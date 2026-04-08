// =====================================================
// CREAR USUARIO CON BCRYPT
// =====================================================
// Uso: node create-user-with-bcrypt.js "nombre@correo.com" "Nombre Usuario" "jefe"

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Configuración de la base de datos
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'area_calidad',
  password: 'tu_password_db', // CAMBIA ESTO
  port: 5432,
});

// Función para generar ID único
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Función principal
async function createUser() {
  // Obtener argumentos de línea de comandos
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('❌ Uso incorrecto');
    console.log('📖 Uso: node create-user-with-bcrypt.js <email> <nombre> <rol>');
    console.log('');
    console.log('📋 Roles disponibles:');
    console.log('   • jefe      - Jefe de producción');
    console.log('   • tecnico   - Técnico de calidad');
    console.log('   • operario  - Operario de línea');
    console.log('');
    console.log('💡 Ejemplo:');
    console.log('   node create-user-with-bcrypt.js "juan.perez@empresa.com" "Juan Pérez" "tecnico"');
    process.exit(1);
  }

  const [email, name, role] = args;
  const userId = generateUUID();
  
  // Validar rol
  const validRoles = ['jefe', 'tecnico', 'operario'];
  if (!validRoles.includes(role)) {
    console.log('❌ Rol inválido:', role);
    console.log('📋 Roles válidos:', validRoles.join(', '));
    process.exit(1);
  }

  // Generar contraseña segura
  const password = 'Temp123!@#'; // Contraseña temporal
  console.log('🔐 Generando hash para la contraseña:', password);

  try {
    // Generar hash de la contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('✅ Hash generado correctamente');
    console.log('🔑 Salt rounds:', saltRounds);

    // Insertar usuario en la base de datos
    const query = `
      INSERT INTO users (
        id, 
        name, 
        email, 
        role, 
        password, 
        created_at, 
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, role, created_at
    `;

    const values = [
      userId,
      name,
      email,
      role,
      hashedPassword,
      new Date(),
      new Date()
    ];

    const result = await pool.query(query, values);
    const createdUser = result.rows[0];

    console.log('');
    console.log('🎉 USUARIO CREADO EXITOSAMENTE');
    console.log('═════════════════════════════════════════');
    console.log('📧 Correo electrónico:', createdUser.email);
    console.log('👤 Nombre completo:', createdUser.name);
    console.log('👔 Rol:', createdUser.role);
    console.log('🆔 ID de usuario:', createdUser.id);
    console.log('📅 Fecha de creación:', createdUser.created_at);
    console.log('🔐 Contraseña temporal:', password);
    console.log('⚠️  IMPORTANTE: El usuario debe cambiar la contraseña al primer inicio de sesión');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('🌐 Para iniciar sesión:');
    console.log('   URL: http://localhost:3000/login');
    console.log('   Email:', email);
    console.log('   Contraseña:', password);

    // Cerrar conexión
    await pool.end();

  } catch (error) {
    console.error('❌ Error creando usuario:', error.message);
    process.exit(1);
  }
}

// Ejecutar la función
createUser();
