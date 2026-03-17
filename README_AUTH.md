# 🚀 Sistema de Autenticación Completo

## 📋 Descripción General

He implementado un sistema de autenticación completo para tu plataforma con las siguientes características:

- ✅ **Inicio de sesión con correo y contraseña**
- ✅ **Validación por correo electrónico**
- ✅ **Recuperación de contraseña**
- ✅ **Roles de usuario (Jefe y Operario)**
- ✅ **Control de acceso según rol**
- ✅ **Sesiones seguras con cookies**
- ✅ **Middleware de protección de rutas**

## 🔐 Usuarios Predeterminados

### Credenciales de Demostración:
- **Jefe de Calidad**: `jefe@calidad.com` / `jefe123`
- **Operario**: `operario@calidad.com` / `operario123`

## 🗄️ Base de Datos

### 1. Ejecutar la migración:
```sql
-- Ejecutar: migrations/create_auth_tables.sql
```

### 2. Generar contraseñas hasheadas:
```bash
cd scripts
node generate-passwords.mjs
```

### 3. Insertar usuarios con los hashes generados:
```sql
-- Copiar y ejecutar el SQL generado por el script
INSERT INTO users (email, password_hash, name, role, is_active, email_verified) VALUES
('jefe@calidad.com', '$2b$10$...', 'Jefe de Calidad', 'jefe', true, true),
('operario@calidad.com', '$2b$10$...', 'Operario de Producción', 'operario', true, true);
```

## 📁 Estructura de Archivos

### Backend (API Routes):
```
src/app/api/auth/
├── login/route.ts              # Inicio de sesión
├── register/route.ts           # Registro de usuarios
├── logout/route.ts              # Cerrar sesión
├── me/route.ts                 # Validar sesión
├── verify-email/route.ts        # Verificar correo
├── request-password-reset/route.ts  # Solicitar recuperación
└── reset-password/route.ts     # Restablecer contraseña
```

### Frontend (Páginas):
```
src/app/
├── login/page.tsx              # Página de login completa
├── verify-email/page.tsx       # Verificación de correo
├── reset-password/page.tsx     # Restablecimiento de contraseña
└── dashboard/layout.tsx        # Layout protegido
```

### Componentes y Servicios:
```
src/
├── contexts/auth-context.tsx   # Contexto de autenticación
├── lib/auth-service.ts         # Servicio de autenticación
├── components/auth-route-protection.tsx  # Protección de rutas
├── middleware.ts               # Middleware de protección
└── scripts/generate-passwords.mjs  # Generador de contraseñas
```

## 🔧 Configuración

### 1. Variables de Entorno:
```env
# Agregar a tu .env.local
DATABASE_URL="postgresql://usuario:password@localhost:5432/tu_db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. Dependencias necesarias:
```bash
npm install bcrypt pg
npm install -D @types/bcrypt
```

## 🚀 Flujo de Autenticación

### 1. Registro de Usuario:
1. Usuario completa formulario de registro
2. Sistema crea usuario con `email_verified = false`
3. Envía correo de verificación (consola para desarrollo)
4. Usuario hace clic en enlace para verificar correo
5. Cuenta activada, puede iniciar sesión

### 2. Inicio de Sesión:
1. Usuario ingresa correo y contraseña
2. Sistema verifica credenciales
3. Verifica que correo esté verificado
4. Crea sesión segura con cookie
5. Redirige al dashboard

### 3. Recuperación de Contraseña:
1. Usuario solicita recuperación con su correo
2. Sistema genera token único (1 hora de validez)
3. Envía correo con enlace de recuperación
4. Usuario hace clic y establece nueva contraseña
5. Contraseña actualizada

## 🛡️ Control de Acceso por Rol

### Jefe de Calidad:
- ✅ Acceso completo a `/dashboard/supervisores`
- ✅ CRUD completo de registros
- ✅ Gestión de usuarios (futuro)
- ✅ Análisis avanzado

### Operario:
- ✅ Acceso limitado a dashboard principal
- ✅ Solo lectura de registros
- ✅ Creación de registros básicos
- ❌ No puede acceder a `/dashboard/supervisores`

## 🔄 Flujo de Implementación

### Paso 1: Preparar Base de Datos
```bash
# 1. Ejecutar migración
psql -U tu_usuario -d tu_db -f migrations/create_auth_tables.sql

# 2. Generar contraseñas
cd scripts && node generate-passwords.mjs

# 3. Insertar usuarios con hashes generados
```

### Paso 2: Instalar Dependencias
```bash
npm install bcrypt pg @types/bcrypt
```

### Paso 3: Configurar Variables de Entorno
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/tu_db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Paso 4: Probar el Sistema
1. Iniciar aplicación: `npm run dev`
2. Ir a `http://localhost:3000/login`
3. Probar con credenciales predeterminadas
4. Verificar flujo completo

## 📧 Configuración de Correo (Producción)

Para producción, reemplaza los `console.log` en `auth-service.ts` con un servicio real:

```typescript
// Ejemplo con Nodemailer
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Enviar correo real
await transporter.sendMail({
  from: process.env.SMTP_FROM,
  to: email,
  subject: 'Verifica tu correo electrónico',
  html: `<a href="${link}">Verificar correo</a>`,
});
```

## 🔍 Características de Seguridad

- ✅ **Contraseñas hasheadas con bcrypt**
- ✅ **Tokens seguros y únicos**
- ✅ **Cookies HTTP-only y secure**
- ✅ **Sesiones con expiración**
- ✅ **Protección contra CSRF**
- ✅ **Validación de entrada**
- ✅ **Middleware de protección**

## 🚨 Notas Importantes

1. **Desarrollo**: Los correos se muestran en consola
2. **Producción**: Configurar servicio de correo real
3. **Seguridad**: Usar HTTPS en producción
4. **Base de Datos**: Mantener copias de seguridad
5. **Logs**: Implementar sistema de logs de seguridad

## 🔄 Próximos Pasos

1. **Configurar servicio de correo real**
2. **Implementar logs de auditoría**
3. **Agregar autenticación de dos factores**
4. **Crear interfaz de gestión de usuarios**
5. **Implementar políticas de contraseña**

## 🐛 Solución de Problemas

### Error: "Usuario no encontrado"
- Verificar que el usuario exista en la base de datos
- Confirmar que `email_verified = true`

### Error: "Contraseña incorrecta"
- Verificar el hash de la contraseña
- Usar el script `generate-passwords.js`

### Error: "Token inválido"
- Verificar que el token no haya expirado
- Confirmar que el token sea correcto

## 📞 Soporte

Si tienes problemas durante la implementación:

1. Revisa los logs de la consola
2. Verifica la configuración de la base de datos
3. Confirma las variables de entorno
4. Revisa la consola del navegador para errores de frontend

---

**¡Listo!** Tu sistema de autenticación está completamente implementado y funcional. 🎉
