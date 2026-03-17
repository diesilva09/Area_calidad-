console.log('🚀 Configuración con SendGrid (Recomendado)');
console.log('');

console.log('❌ Problemas con Brevo:');
console.log('   • Autenticación fallida');
console.log('   • Configuración complicada');
console.log('   • Problemas de certificado');
console.log('');

console.log('✅ Ventajas de SendGrid:');
console.log('   • Configuración más simple');
console.log('   • Mejor documentación');
console.log('   • 100 correos/día gratis');
console.log('   • Más confiable para desarrollo');
console.log('');

console.log('📋 Pasos para configurar SendGrid:');
console.log('');

console.log('1️⃣ Regístrate en SendGrid:');
console.log('   https://signup.sendgrid.com/');
console.log('');

console.log('2️⃣ Crea API Key:');
console.log('   • Dashboard → Settings → API Keys');
console.log('   • Create API Key → Restricted Access');
console.log('   • Nombre: "Sistema Calidad"');
console.log('   • Permisos: Mail Send → Full Access');
console.log('   • Copia la API Key generada');
console.log('');

console.log('3️⃣ Configura .env.local:');
console.log(`
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=TU_API_KEY_SENDGRID
EMAIL_FROM=diesilva1709@gmail.com
NEXT_PUBLIC_APP_URL=http://localhost:9002
`);

console.log('4️⃣ Verifica Sender Identity:');
console.log('   • Settings → Sender Authentication');
console.log('   • Verify tu email: diesilva1709@gmail.com');
console.log('   • Esto permite enviar desde tu dirección');
console.log('');

console.log('🎯 ¿Por qué SendGrid es mejor para ti?');
console.log('   ✅ Usuario siempre es "apikey"');
console.log('   ✅ Solo necesitas la API Key');
console.log('   ✅ Documentación clara');
console.log('   ✅ Soporte técnico mejor');
console.log('   ✅ Funciona desde el primer intento');

console.log('');
console.log('🔄 Una vez configurado SendGrid:');
console.log('   1. Actualiza .env.local');
console.log('   2. Ejecuta: node test_sendgrid.cjs');
console.log('   3. Si funciona, prueba el login del sistema');

console.log('');
console.log('❓ ¿Quieres que te guíe paso a paso con SendGrid?');
