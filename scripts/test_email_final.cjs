const nodemailer = require('nodemailer');

// Cargar variables de entorno
require('dotenv').config({ path: '../.env.local' });

console.log('📧 Prueba final de correo con Brevo...');
console.log('');

// Verificar variables de entorno
console.log('🔍 Configuración actual:');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'CONFIGURADO' : 'NO CONFIGURADO');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('');

// Crear transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  debug: true, // Activar debug
  logger: true // Activar logger
});

async function testEmail() {
  try {
    console.log('🔍 Verificando conexión...');
    const verification = await transporter.verify();
    console.log('✅ Conexión verificada:', verification);
    
    console.log('📧 Enviando correo de prueba...');
    
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: 'diesilva1709@gmail.com',
      subject: '🧪 TEST FINAL - Sistema de Calidad',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>🧪 Test de Correo - Sistema de Calidad</h1>
          <p>Este es un correo de prueba para verificar que Brevo funciona correctamente.</p>
          <div style="background: #e8f5e8; padding: 15px; border-radius: 5px;">
            <strong>✅ Si recibes este correo, la configuración es correcta.</strong>
          </div>
          <hr>
          <p><strong>Configuración usada:</strong></p>
          <ul>
            <li>SMTP: ${process.env.EMAIL_HOST}</li>
            <li>Puerto: ${process.env.EMAIL_PORT}</li>
            <li>From: ${process.env.EMAIL_FROM}</li>
            <li>To: diesilva1709@gmail.com</li>
          </ul>
        </div>
      `,
      text: 'Test de correo - Sistema de Calidad. Si recibes esto, funciona correctamente.'
    });
    
    console.log('✅ Correo enviado exitosamente:');
    console.log('   Message ID:', result.messageId);
    console.log('   Response:', result.response);
    console.log('');
    console.log('📧 Revisa tu Gmail AHORA MISMO');
    console.log('   Asunto: "🧪 TEST FINAL - Sistema de Calidad"');
    console.log('   Deberías recibirlo en menos de 30 segundos');
    
  } catch (error) {
    console.error('❌ Error al enviar correo:');
    console.error('   Mensaje:', error.message);
    console.error('   Código:', error.code);
    
    if (error.response) {
      console.error('   Respuesta SMTP:', error.response);
    }
    
    console.log('');
    console.log('🔧 Soluciones posibles:');
    console.log('   1. Revisa que la API Key de Brevo sea correcta');
    console.log('   2. Verifica que tu cuenta de Brevo esté verificada');
    console.log('   3. Revisa el correo y contraseña en .env.local');
  }
}

testEmail();
