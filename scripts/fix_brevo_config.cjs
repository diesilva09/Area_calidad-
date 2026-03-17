console.log('🔧 Corrección de configuración de Brevo');
console.log('');

console.log('❌ Configuración INCORRECTA:');
console.log('   EMAIL_HOST=smtp-relay.brevo.com');
console.log('   ❌ Error de certificado SSL');
console.log('');

console.log('✅ Configuración CORRECTA:');
console.log('   EMAIL_HOST=smtp-relay.sendinblue.com');
console.log('   ✅ Certificado SSL válido');
console.log('');

console.log('📋 Actualiza tu .env.local con:');
console.log(`
# Configuración CORRECTA de Brevo
EMAIL_HOST=smtp-relay.sendinblue.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=D4xPJARkymwbp1ct
EMAIL_PASS=D4xPJARkymwbp1ct
EMAIL_FROM=noreply@sistema-calidad.com
NEXT_PUBLIC_APP_URL=http://localhost:9002
`);

console.log('📝 Explicación:');
console.log('   • Brevo anteriormente era Sendinblue');
console.log('   • El servidor SMTP correcto es smtp-relay.sendinblue.com');
console.log('   • smtp-relay.brevo.com tiene problemas de certificado');
console.log('   • Ambos funcionan, pero sendinblue.com es más estable');

console.log('');
console.log('🔄 Una vez corregido:');
console.log('   1. Reinicia el servidor: npm run dev');
console.log('   2. Intenta login nuevamente');
console.log('   3. El correo debería llegar correctamente');
