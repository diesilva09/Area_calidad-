console.log('🔍 Verificación de API Key de Brevo');
console.log('');

console.log('❌ Problema detectado:');
console.log('   535 5.7.8 Authentication failed');
console.log('   La API Key no es válida o no tiene permisos SMTP');
console.log('');

console.log('🔧 Pasos para solucionar:');
console.log('');

console.log('1️⃣ Ve a tu cuenta de Brevo:');
console.log('   https://app.brevo.com/');
console.log('');

console.log('2️⃣ Navega a SMTP & API:');
console.log('   - Menú lateral → SMTP & API');
console.log('   - Revisa tus API Keys existentes');
console.log('');

console.log('3️⃣ Crea una NUEVA API Key:');
console.log('   - Nombre: "Sistema Calidad SMTP"');
console.log('   - Permisos: Asegúrate que incluya SMTP');
console.log('   - Copia la nueva API Key');
console.log('');

console.log('4️⃣ Verifica tu cuenta:');
console.log('   - Asegúrate que tu cuenta de Brevo esté verificada');
console.log('   - Revisa que no tengas restricciones de envío');
console.log('');

console.log('5️⃣ Posibles problemas:');
console.log('   ❌ API Key incorrecta o mal copiada');
console.log('   ❌ API Key sin permisos SMTP');
console.log('   ❌ Cuenta de Brevo no verificada');
console.log('   ❌ Límite de envío alcanzado');
console.log('');

console.log('📋 Alternativa: Usar SendGrid (más fácil)');
console.log('   1. Regístrate en https://sendgrid.com/');
console.log('   2. Crea API Key');
console.log('   3. Configura:');
console.log('      EMAIL_HOST=smtp.sendgrid.net');
console.log('      EMAIL_USER=apikey');
console.log('      EMAIL_PASS=TU_API_KEY_SENDGRID');
console.log('      EMAIL_FROM=tu-correo@gmail.com');
console.log('');

console.log('🔄 Una vez tengas la API Key correcta:');
console.log('   1. Actualiza EMAIL_USER y EMAIL_PASS en .env.local');
console.log('   2. Ejecuta: node test_email_final.cjs');
console.log('   3. Si funciona, prueba el login del sistema');
