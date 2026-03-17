const fs = require('fs');

// Leer el archivo .env.local actual
let envContent = '';
try {
  envContent = fs.readFileSync('.env.local', 'utf8');
} catch (error) {
  envContent = '';
}

// Variables de correo a agregar
const emailConfig = `
# Configuración de Correo (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-correo@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicación
EMAIL_FROM=tu-correo@gmail.com
NEXT_PUBLIC_APP_URL=http://localhost:9002
`;

// Verificar si ya existen variables de correo
const hasEmailConfig = envContent.includes('EMAIL_HOST');

if (hasEmailConfig) {
  console.log('⚠️ Las variables de correo ya existen en .env.local');
  console.log('Por favor, edítalas manualmente con tus credenciales reales');
} else {
  // Agregar configuración de correo al final
  const newContent = envContent + emailConfig;
  
  fs.writeFileSync('.env.local', newContent);
  console.log('✅ Variables de correo agregadas a .env.local');
  console.log('📝 Ahora edita el archivo con tus credenciales reales:');
  console.log('   - EMAIL_USER: tu correo@gmail.com');
  console.log('   - EMAIL_PASS: tu contraseña de aplicación de Gmail');
}

console.log('\n📋 Variables configuradas:');
console.log('EMAIL_HOST=smtp.gmail.com');
console.log('EMAIL_PORT=587');
console.log('EMAIL_SECURE=false');
console.log('EMAIL_USER=tu-correo@gmail.com');
console.log('EMAIL_PASS=tu-contraseña-de-aplicación');
console.log('EMAIL_FROM=tu-correo@gmail.com');
console.log('NEXT_PUBLIC_APP_URL=http://localhost:9002');
