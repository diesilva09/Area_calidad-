const nodemailer = require('nodemailer');

// Cargar variables de entorno
require('dotenv').config({ path: '../.env.local' });

console.log('📧 Probando configuración de Brevo...');
console.log('');

// Verificar variables de entorno
console.log('🔍 Variables de entorno:');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 10) + '...' : 'NO DEFINIDO');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.substring(0, 10) + '...' : 'NO DEFINIDO');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('');

// Crear transporter de Brevo
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verificar conexión
async function testBrevoConnection() {
  try {
    console.log('🔍 Verificando conexión con Brevo...');
    
    const verification = await transporter.verify();
    console.log('✅ Conexión exitosa:', verification);
    
    // Enviar correo de prueba
    console.log('📧 Enviando correo de prueba...');
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: 'diesilva1709@gmail.com',
      subject: '🧪 Prueba de Brevo - Sistema de Calidad',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin: 0; font-size: 28px;">🧪 Prueba de Correo</h1>
            </div>
            
            <div style="margin-bottom: 30px;">
              <p style="color: #666; font-size: 16px; line-height: 1.5;">
                Este es un correo de prueba para verificar que la configuración de Brevo funciona correctamente.
              </p>
              
              <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="color: #2d5a2d; margin: 0; font-weight: bold;">
                  ✅ Si recibes este correo, la configuración es correcta.
                </p>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                Configuración utilizada:<br>
                • SMTP: ${process.env.EMAIL_HOST}<br>
                • Puerto: ${process.env.EMAIL_PORT}<br>
                • From: ${process.env.EMAIL_FROM}<br>
                • Servicio: Brevo
              </p>
            </div>
          </div>
        </div>
      `,
      text: 'Prueba de correo - Sistema de Calidad. Si recibes este correo, la configuración es correcta.',
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Correo enviado exitosamente:');
    console.log('   Message ID:', result.messageId);
    console.log('   Response:', result.response);
    
    console.log('');
    console.log('📧 Revisa tu Gmail: diesilva1709@gmail.com');
    console.log('   Asunto: "🧪 Prueba de Brevo - Sistema de Calidad"');
    console.log('   Deberías recibirlo en los próximos 30 segundos.');
    
  } catch (error) {
    console.error('❌ Error en la prueba:');
    console.error('   Mensaje:', error.message);
    console.error('   Código:', error.code);
    console.error('   Comando:', error.command);
    
    if (error.response) {
      console.error('   Respuesta SMTP:', error.response);
    }
    
    console.log('');
    console.log('🔧 Posibles soluciones:');
    console.log('   1. Verifica que la API Key sea correcta');
    console.log('   2. Revisa que la API Key tenga permisos SMTP');
    console.log('   3. Confirma que tu cuenta de Brevo esté verificada');
  }
}

testBrevoConnection();
