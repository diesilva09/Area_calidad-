const bcrypt = require('bcrypt');

// Generar hash para contraseñas
async function generateHash() {
  const password = 'Admin2024!'; // Cambia esta contraseña
  const hash = await bcrypt.hash(password, 10);
  
  console.log('Contraseña:', password);
  console.log('Hash generado:', hash);
  console.log('\nCopia este hash en tu script SQL:');
  console.log(hash);
}

generateHash();
