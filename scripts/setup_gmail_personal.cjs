console.log('📧 Configuración con tu Gmail Personal');
console.log('');

console.log('✅ Ventajas de usar tu Gmail:');
console.log('   • Ya tienes la cuenta');
console.log('   • Sin registro de servicios externos');
console.log('   • Control total sobre los correos');
console.log('   • Confiable y conocido');
console.log('');

console.log('🔑 Paso 1: Genera Contraseña de Aplicación');
console.log('');
console.log('1️⃣ Ve a tu cuenta de Google:');
console.log('   https://myaccount.google.com/');
console.log('');

console.log('2️⃣ Ve a Seguridad:');
console.log('   • Seguridad en el menú izquierdo');
console.log('   • Verificación en dos pasos (actívala si no está)');
console.log('');

console.log('3️⃣ Contraseñas de aplicaciones:');
console.log('   • Busca "Contraseñas de aplicaciones"');
console.log('   • Haz clic en "Crear contraseña"');
console.log('   • Nombre: "Sistema Calidad"');
console.log('   • Copia la contraseña de 16 caracteres');
console.log('   • Ejemplo: "abcd efgh ijkl mnop"');
console.log('');

console.log('📋 Paso 2: Configura .env.local');
console.log('');
console.log('Reemplaza las líneas de email con:');
console.log(`
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=diesilva1709@gmail.com
EMAIL_PASS=AQUÍ_VA_LA_CONTRASEÑA_DE_APLICACIÓN
EMAIL_FROM=diesilva1709@gmail.com
NEXT_PUBLIC_APP_URL=http://localhost:9002
`);

console.log('📝 Importante:');
console.log('   • EMAIL_USER: tu correo completo');
console.log('   • EMAIL_PASS: la contraseña de aplicación (16 caracteres)');
console.log('   • EMAIL_FROM: tu correo completo');
console.log('   • No uses tu contraseña normal de Gmail');
console.log('');

console.log('🔄 Paso 3: Prueba la configuración');
console.log('');
console.log('1. Actualiza .env.local con la contraseña de aplicación');
console.log('2. Ejecuta: node test_gmail.cjs');
console.log('3. Si funciona, prueba el login del sistema');
console.log('');

console.log('🎯 Ventajas finales:');
console.log('   ✅ Los correos llegan desde tu dirección real');
console.log('   ✅ Los usuarios reconocen tu correo');
console.log('   ✅ Sin dependencias de terceros');
console.log('   ✅ Límite generoso: 500-2000 correos/día');
console.log('   ✅ Configuración única y permanente');

console.log('');
console.log('❓ ¿Listo para generar tu contraseña de aplicación?');
