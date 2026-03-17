console.log('🔧 Solución de problemas con Gmail');
console.log('');

console.log('❌ Error detectado:');
console.log('   535-5.7.8 Username and Password not accepted');
console.log('   Gmail no está aceptando las credenciales');
console.log('');

console.log('🔍 Verificaciones necesarias:');
console.log('');

console.log('1️⃣ Verificación en dos pasos:');
console.log('   • Ve a: https://myaccount.google.com/security');
console.log('   • Busca "Verificación en dos pasos"');
console.log('   • Debe estar ACTIVADA');
console.log('   • Si no está, actívala primero');
console.log('');

console.log('2️⃣ Contraseña de aplicación:');
console.log('   • Después de activar 2FA, ve a "Contraseñas de aplicaciones"');
console.log('   • Elimina cualquier contraseña anterior para "Sistema Calidad"');
console.log('   • Crea una NUEVA contraseña');
console.log('   • Nombre: "Sistema Calidad"');
console.log('   • Copia EXACTAMENTE como te la da Google');
console.log('');

console.log('3️⃣ Formato de la contraseña:');
console.log('   ❌ "flqqzvjfrhzmgbdj" (sin espacios)');
console.log('   ✅ "flqq zvjf rhzm gbdj" (con espacios)');
console.log('   • Google te da 16 caracteres en grupos de 4');
console.log('   • Debes incluir los espacios exactamente');
console.log('');

console.log('4️⃣ Prueba con contraseña limpia:');
console.log('   • Abre un editor de texto plano');
console.log('   • Pega la contraseña: flqq zvjf rhzm gbdj');
console.log('   • Verifica que no haya espacios extra al inicio/final');
console.log('   • Copia exactamente esa versión');
console.log('');

console.log('📋 Configuración final para .env.local:');
console.log('');
console.log('EMAIL_HOST=smtp.gmail.com');
console.log('EMAIL_PORT=587');
console.log('EMAIL_SECURE=false');
console.log('EMAIL_USER=diesilva1709@gmail.com');
console.log('EMAIL_PASS=flqq zvjf rhzm gbdj');
console.log('EMAIL_FROM=diesilva1709@gmail.com');
console.log('NEXT_PUBLIC_APP_URL=http://localhost:9002');
console.log('');

console.log('🔄 Pasos a seguir:');
console.log('1. Verifica que 2FA esté activa');
console.log('2. Genera NUEVA contraseña de aplicación');
console.log('3. Copia la contraseña EXACTAMENTE como Google la muestra');
console.log('4. Actualiza .env.local');
console.log('5. Ejecuta: node test_gmail.cjs');
console.log('');

console.log('❓ ¿Tienes activada la verificación en dos pasos en tu cuenta de Google?');
