console.log('📧 Configuración de Brevo para el Sistema de Calidad');
console.log('');

console.log('🔑 Paso 1: Obtén tus credenciales en https://app.brevo.com/');
console.log('   1. Ve a SMTP & API');
console.log('   2. Crea una API Key con nombre "Sistema Calidad"');
console.log('   3. Copia la API Key generada');
console.log('');

console.log('📋 Paso 2: Configura tu .env.local con estos valores:');
console.log(`
# Configuración de Brevo (reemplaza TU_API_KEY_AQUÍ)
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=TU_API_KEY_AQUÍ
EMAIL_PASS=TU_API_KEY_AQUÍ
EMAIL_FROM=noreply@tuempresa.com
NEXT_PUBLIC_APP_URL=http://localhost:9002
`);

console.log('📊 Límites de Brevo (Gratis):');
console.log('   ✅ 300 correos/día');
console.log('   ✅ 9,000 correos/mes');
console.log('   ✅ Más que suficiente para tu sistema');

console.log('🚀 Ventajas de Brevo:');
console.log('   ✅ Fácil configuración');
console.log('   ✅ Interfaz amigable');
console.log('   ✅ Buen deliverabilidad');
console.log('   ✅ Analíticas incluidas');
console.log('   ✅ Plan generoso gratuito');

console.log('🔧 Una vez configures .env.local:');
console.log('   1. Reinicia el servidor: npm run dev');
console.log('   2. Crea un usuario de prueba');
console.log('   3. Intenta iniciar sesión');
console.log('   4. El correo llegará real a su bandeja');
