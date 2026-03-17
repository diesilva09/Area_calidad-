// Script para probar la persistencia de sesión
const fetch = require('node-fetch');

async function testSessionPersistence() {
  console.log('🧪 Iniciando prueba de persistencia de sesión...');
  
  try {
    // 1. Iniciar sesión
    console.log('\n1. Iniciando sesión...');
    const loginResponse = await fetch('http://localhost:9002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: 'diego@ejemplo.com', 
        password: 'password123' 
      }),
      redirect: 'manual'
    });

    if (!loginResponse.ok) {
      console.error('❌ Error en login:', await loginResponse.text());
      return;
    }

    // Extraer cookie de la respuesta
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log('🍪 Cookie recibida:', setCookieHeader);

    // 2. Verificar sesión inmediatamente
    console.log('\n2. Verificando sesión inmediatamente...');
    const meResponse1 = await fetch('http://localhost:9002/api/auth/me', {
      headers: {
        'Cookie': setCookieHeader
      }
    });

    if (meResponse1.ok) {
      const userData = await meResponse1.json();
      console.log('✅ Sesión verificada:', userData.user);
    } else {
      console.error('❌ Error verificando sesión:', await meResponse1.text());
    }

    // 3. Simular recarga de página (verificar sesión después de un tiempo)
    console.log('\n3. Simulando recarga de página...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const meResponse2 = await fetch('http://localhost:9002/api/auth/me', {
      headers: {
        'Cookie': setCookieHeader
      }
    });

    if (meResponse2.ok) {
      const userData = await meResponse2.json();
      console.log('✅ Sesión persistente verificada:', userData.user);
      console.log('\n🎉 La persistencia de sesión funciona correctamente!');
    } else {
      console.error('❌ Error en persistencia de sesión:', await meResponse2.text());
    }

  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

// Ejecutar prueba si el servidor está corriendo
testSessionPersistence();
