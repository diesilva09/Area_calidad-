// Opciones de configuración SMTP alternativas para evitar dependencia de Gmail

console.log('📧 Opciones de configuración SMTP alternativas:');
console.log('');

console.log('🔧 Opción 1: Usar servicio de correo transaccional');
console.log('   - SendGrid: smtp.sendgrid.com (puerto 587)');
console.log('   - Mailgun: smtp.mailgun.org (puerto 587)');
console.log('   - Amazon SES: email-smtp.us-east-1.amazonaws.com');
console.log('');

console.log('🔧 Opción 2: Configurar servidor SMTP local');
console.log('   - Usar Postfix o类似 servidor local');
console.log('   - Mayor control y sin límites de Gmail');
console.log('');

console.log('🔧 Opción 3: Usar cuenta de correo dedicada');
console.log('   - Crear cuenta específica para el sistema');
console.log('   - Una sola contraseña de aplicación para todo');
console.log('');

console.log('📋 Configuración actual recomendada para .env.local:');
console.log(`
# Opción con SendGrid (ejemplo)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=SG.xxxxx.xxxxx.xxxxx
EMAIL_FROM=noreply@tuempresa.com

# Opción con Mailgun (ejemplo)
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@tuempresa.com
EMAIL_PASS=xxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@tuempresa.com
`);

console.log('✅ Ventajas de usar servicio dedicado:');
console.log('   - No dependes de cuentas personales');
console.log('   - Límites más altos de envío');
console.log('   - Mejor deliverabilidad');
console.log('   - Sin configuración por usuario');
