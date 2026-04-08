import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { createDatabasePool } from './database-config';
import { emailService } from './email-service';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'jefe' | 'operario' | 'supervisor';
  is_active: boolean;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'jefe' | 'operario' | 'supervisor';
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
  message: string;
  requiresVerification?: boolean;
  email?: string;
}

class AuthService {
  private pool: Pool;

  constructor() {
    console.log('🔗 AuthService: Inicializando Pool de PostgreSQL...');
    try {
      this.pool = createDatabasePool('area_calidad');
      console.log('✅ AuthService: Pool inicializado correctamente');
    } catch (error) {
      console.error('❌ AuthService: Error inicializando Pool:', error);
      throw error;
    }
  }

  // Generar token aleatorio
  private generateToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Hashear contraseña
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  // Verificar contraseña
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  // Enviar correo de verificación (ahora usa email-service real)
  private async sendVerificationEmail(email: string, token: string): Promise<void> {
    try {
      await emailService.sendVerificationEmail(email, token);
      console.log('✅ Correo de verificación enviado a:', email);
    } catch (error) {
      console.error('❌ Error al enviar correo de verificación:', error);
      // En caso de error, mostrar el código en consola como fallback
      console.log('\n🔔 ===== CÓDIGO DE VERIFICACIÓN (FALLBACK) =====');
      console.log(`📧 Correo: ${email}`);
      console.log(`🔢 Código: ${token}`);
      console.log(`🔗 Enlace: ${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`);
      console.log('=====================================\n');
    }
  }

  // Enviar correo de recuperación (ahora usa email-service real)
  private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    try {
      await emailService.sendPasswordResetEmail(email, token);
      console.log('✅ Correo de recuperación enviado a:', email);
    } catch (error) {
      console.error('❌ Error al enviar correo de recuperación:', error);
      // En caso de error, mostrar el código en consola como fallback
      console.log('\n🔔 ===== CÓDIGO DE RECUPERACIÓN (FALLBACK) =====');
      console.log(`📧 Correo: ${email}`);
      console.log(`🔢 Código: ${token}`);
      console.log(`🔗 Enlace: ${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`);
      console.log('=====================================\n');
    }
  }

  // Iniciar sesión
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('🔍 AuthService: Iniciando login para:', credentials.email);
      console.log('🔗 AuthService: Conectando a base de datos...');
      
      const result = await this.pool.query(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        [credentials.email]
      );
      
      console.log('📊 AuthService: Usuarios encontrados:', result.rows.length);

      if (result.rows.length === 0) {
        return {
          user: null as any,
          token: '',
          message: 'Usuario no encontrado o inactivo'
        };
      }

      const user = result.rows[0];
      console.log('👤 AuthService: Usuario encontrado:', { id: user.id, email: user.email, role: user.role, verified: user.email_verified });

      // Verificar contraseña
      console.log('🔐 AuthService: Verificando contraseña...');
      const isValidPassword = await this.verifyPassword(credentials.password, user.password_hash);
      console.log('✅ AuthService: Contraseña válida:', isValidPassword);
      
      if (!isValidPassword) {
        return {
          user: null as any,
          token: '',
          message: 'Contraseña incorrecta'
        };
      }

      // Verificar si el correo está verificado
      if (!user.email_verified) {
        // Enviar correo de verificación
        const verificationToken = this.generateToken();
        
        // Guardar token en base de datos
        await this.pool.query(
          'UPDATE users SET email_verification_token = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [verificationToken, user.id]
        );
        
        // Enviar correo de verificación
        await this.sendVerificationEmail(user.email, verificationToken);
        
        return {
          user: null as any,
          token: '',
          message: 'Por favor, revisa tu correo y haz clic en "Verificar Cuenta" para continuar. Hemos enviado un nuevo correo de verificación.',
          requiresVerification: true,
          email: user.email
        };
      }

      // Generar token de sesión
      const sessionToken = this.generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

      // Guardar sesión
      await this.pool.query(
        'INSERT INTO user_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, sessionToken, expiresAt]
      );

      // Limpiar sesiones expiradas
      await this.pool.query('SELECT cleanup_expired_sessions()');

      const { password_hash, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        token: sessionToken,
        message: 'Inicio de sesión exitoso'
      };

    } catch (error) {
      console.error('❌ AuthService: Error en login:', error);
      if (error instanceof Error) {
        console.error('❌ AuthService: Error details:', {
          message: error.message,
          stack: error.stack,
          code: (error as any).code
        });
      }
      return {
        user: null as any,
        token: '',
        message: 'Error al iniciar sesión'
      };
    }
  }

  // Registrar nuevo usuario
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await this.pool.query(
        'SELECT id FROM users WHERE email = $1',
        [userData.email]
      );

      if (existingUser.rows.length > 0) {
        return {
          user: null as any,
          token: '',
          message: 'El correo electrónico ya está registrado'
        };
      }

      // Hashear contraseña
      const passwordHash = await this.hashPassword(userData.password);

      // Generar token de verificación
      const verificationToken = this.generateToken();

      // Insertar usuario
      const result = await this.pool.query(
        `INSERT INTO users (email, password_hash, name, role, email_verification_token) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userData.email, passwordHash, userData.name, userData.role, verificationToken]
      );

      const newUser = result.rows[0];

      // Enviar correo de verificación
      await this.sendVerificationEmail(userData.email, verificationToken);

      const { password_hash, ...userWithoutPassword } = newUser;

      return {
        user: userWithoutPassword,
        token: '',
        message: 'Usuario registrado. Por favor, verifica tu correo electrónico.'
      };

    } catch (error) {
      console.error('Error en registro:', error);
      return {
        user: null as any,
        token: '',
        message: 'Error al registrar usuario'
      };
    }
  }

  // Verificar correo
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.pool.query(
        'SELECT id FROM users WHERE email_verification_token = $1',
        [token]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          message: 'Token de verificación inválido'
        };
      }

      // Actualizar usuario como verificado
      await this.pool.query(
        `UPDATE users 
         SET email_verified = true, email_verification_token = NULL, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [result.rows[0].id]
      );

      return {
        success: true,
        message: 'Correo electrónico verificado exitosamente'
      };

    } catch (error) {
      console.error('Error en verificación de correo:', error);
      return {
        success: false,
        message: 'Error al verificar correo electrónico'
      };
    }
  }

  // Solicitar recuperación de contraseña
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.pool.query(
        'SELECT id FROM users WHERE email = $1 AND is_active = true',
        [email]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          message: 'Correo electrónico no encontrado'
        };
      }

      // Generar token de recuperación
      const resetToken = this.generateToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Actualizar usuario con token de recuperación
      await this.pool.query(
        `UPDATE users 
         SET password_reset_token = $1, password_reset_expires = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [resetToken, expiresAt, result.rows[0].id]
      );

      // Enviar correo de recuperación
      await this.sendPasswordResetEmail(email, resetToken);

      return {
        success: true,
        message: 'Se ha enviado un correo de recuperación de contraseña'
      };

    } catch (error) {
      console.error('Error en solicitud de recuperación:', error);
      return {
        success: false,
        message: 'Error al solicitar recuperación de contraseña'
      };
    }
  }

  // Restablecer contraseña
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.pool.query(
        'SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires > CURRENT_TIMESTAMP',
        [token]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          message: 'Token de recuperación inválido o expirado'
        };
      }

      // Hashear nueva contraseña
      const passwordHash = await this.hashPassword(newPassword);

      // Actualizar contraseña
      await this.pool.query(
        `UPDATE users 
         SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [passwordHash, result.rows[0].id]
      );

      return {
        success: true,
        message: 'Contraseña actualizada exitosamente'
      };

    } catch (error) {
      console.error('Error en restablecimiento de contraseña:', error);
      return {
        success: false,
        message: 'Error al restablecer contraseña'
      };
    }
  }

  // Validar sesión
  async validateSession(token: string): Promise<User | null> {
    try {
      const result = await this.pool.query(
        `SELECT u.* FROM users u 
         JOIN user_sessions s ON u.id = s.user_id 
         WHERE s.token = $1 AND s.expires_at > CURRENT_TIMESTAMP`,
        [token]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];

    } catch (error) {
      console.error('Error en validación de sesión:', error);
      return null;
    }
  }

  // Reenviar correo de verificación
  async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Buscar usuario
      const result = await this.pool.query(
        'SELECT id, email_verified FROM users WHERE email = $1 AND is_active = true',
        [email]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          message: 'Correo electrónico no encontrado'
        };
      }

      const user = result.rows[0];

      // Si ya está verificado, no enviar correo
      if (user.email_verified) {
        return {
          success: false,
          message: 'Este correo ya está verificado. Puedes iniciar sesión directamente.'
        };
      }

      // Generar nuevo token y enviar correo
      const verificationToken = this.generateToken();
      
      await this.pool.query(
        'UPDATE users SET email_verification_token = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [verificationToken, user.id]
      );
      
      await this.sendVerificationEmail(email, verificationToken);
      
      return {
        success: true,
        message: 'Correo de verificación reenviado exitosamente'
      };

    } catch (error) {
      console.error('Error al reenviar verificación:', error);
      return {
        success: false,
        message: 'Error al reenviar correo de verificación'
      };
    }
  }

  // Cerrar sesión
  async logout(token: string): Promise<void> {
    try {
      await this.pool.query(
        'DELETE FROM user_sessions WHERE token = $1',
        [token]
      );
    } catch (error) {
      console.error('Error en logout:', error);
    }
  }
}

export const authService = new AuthService();
