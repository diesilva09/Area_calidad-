import bcrypt from 'bcrypt';

async function generatePasswords() {
  console.log('🔐 Generando contraseñas hasheadas para usuarios predeterminados...\n');

  // Contraseñas para los usuarios predeterminados
  const users = [
    { email: 'jefe@calidad.com', password: 'jefe123', role: 'jefe' },
    { email: 'operario@calidad.com', password: 'operario123', role: 'operario' }
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    console.log(`👤 Usuario: ${user.email}`);
    console.log(`🔑 Contraseña: ${user.password}`);
    console.log(`🔐 Hash: ${hashedPassword}`);
    console.log(`📋 Rol: ${user.role}`);
    console.log('---');
    
    // Generar SQL para insertar
    console.log(`-- SQL para ${user.email}`);
    console.log(`INSERT INTO users (email, password_hash, name, role, is_active, email_verified) VALUES`);
    console.log(`('${user.email}', '${hashedPassword}', '${user.role === 'jefe' ? 'Jefe de Calidad' : 'Operario de Producción'}', '${user.role}', true, true);`);
    console.log('\n');
  }

  console.log('✅ Contraseñas generadas exitosamente');
  console.log('\n📝 Instrucciones:');
  console.log('1. Ejecuta el archivo de migración: migrations/create_auth_tables.sql');
  console.log('2. Copia y ejecuta los SQL generados arriba para insertar los usuarios');
  console.log('3. Las contraseñas son: jefe123 y operario123');
}

generatePasswords().catch(console.error);
