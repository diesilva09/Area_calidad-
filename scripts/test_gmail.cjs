const nodemailer = require('nodemailer');

// Cargar variables de entorno
require('dotenv').config({ path: '../.env.local' });

console.log('📧 Probando configuración de Gmail...');
console.log('');

// Verificar variables de entorno
console.log('🔍 Configuración actual:');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'CONFIGURADO' : 'NO CONFIGURADO');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('');

// Crear transporter de Gmail
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  debug: true,
  logger: true
});

async function testGmail() {
  try {
    console.log('🔍 Verificando conexión con Gmail...');
    
    const verification = await transporter.verify();
    console.log('✅ Conexión exitosa:', verification);
    
    console.log('📧 Enviando correo de prueba...');
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: 'diesilva1709@gmail.com',
      subject: '🧪 PRUEBA GMAIL - Sistema de Calidad',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4285f4; margin: 0; font-size: 28px;">🧪 Prueba de Gmail</h1>
            </div>
            
            <div style="margin-bottom: 30px;">
              <p style="color: #666; font-size: 16px; line-height: 1.5;">
                Este es un correo de prueba para verificar que la configuración de Gmail funciona correctamente.
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
                • Servicio: Gmail (contraseña de aplicación)
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
    console.log('📧 Revisa tu Gmail AHORA MISMO: diesilva1709@gmail.com');
    console.log('   Asunto: "🧪 PRUEBA GMAIL - Sistema de Calidad"');
    console.log('   Deberías recibirlo en menos de 30 segundos');
    console.log('');
    console.log('🎯 Si funciona, prueba el login del sistema:');
    console.log('   1. Ve a: http://localhost:9002/login');
    console.log('   2. Email: diesilva1709@gmail.com');
    console.log('   3. Contraseña: Admin2024!');
    console.log('   4. El correo de verificación debería llegar');
    
  } catch (error) {
    console.error('❌ Error al enviar correo:');
    console.error('   Mensaje:', error.message);
    console.error('   Código:', error.code);
    
    if (error.response) {
      console.error('   Respuesta SMTP:', error.response);
    }
    
    console.log('');
    console.log('🔧 Soluciones posibles:');
    console.log('   1. Verifica que la contraseña de aplicación sea correcta');
    console.log('   2. Asegúrate que la verificación en dos pasos esté activa');
    console.log('   3. Revisa que no haya espacios extra en la contraseña');
  }
}

testGmail();
