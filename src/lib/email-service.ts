import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      console.log('📧 Enviando correo a:', options.to);
      console.log('📧 Asunto:', options.subject);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Correo enviado exitosamente:', result.messageId);
      
    } catch (error) {
      console.error('❌ Error al enviar correo:', error);
      throw error;
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0; font-size: 28px;">📧 Verificación de Correo</h1>
          </div>
          
          <div style="margin-bottom: 30px;">
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Hola,<br><br>
              Para verificar tu cuenta en el Sistema de Calidad, haz clic en el siguiente botón:
            </p>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
              🚀 Verificar Cuenta
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 14px; margin: 0;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <a href="${verificationUrl}" style="color: #007bff;">${verificationUrl}</a>
            </p>
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Este enlace expirará en 24 horas.<br>
              Si no solicitaste esta verificación, ignora este correo.
            </p>
          </div>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: '📧 Verifica tu correo - Sistema de Calidad',
      html,
      text: `Para verificar tu cuenta, visita: ${verificationUrl}`,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0; font-size: 28px;">🔑 Recuperación de Contraseña</h1>
          </div>
          
          <div style="margin-bottom: 30px;">
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Hola,<br><br>
              Solicitaste restablecer tu contraseña en el Sistema de Calidad. Haz clic en el siguiente botón:
            </p>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
              🔐 Restablecer Contraseña
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 14px; margin: 0;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <a href="${resetUrl}" style="color: #dc3545;">${resetUrl}</a>
            </p>
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Este enlace expirará en 1 hora.<br>
              Si no solicitaste esta recuperación, ignora este correo.
            </p>
          </div>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: '🔑 Recupera tu contraseña - Sistema de Calidad',
      html,
      text: `Para restablecer tu contraseña, visita: ${resetUrl}`,
    });
  }
}

export const emailService = new EmailService();
