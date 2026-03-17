const bcrypt = require('bcrypt');

// Generar hash para la contraseña 'operario123'
const password = 'operario123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function(err, hash) {
  if (err) {
    console.error('Error al generar hash:', err);
    return;
  }
  
  console.log('Hash generado para operario123:');
  console.log(hash);
  
  // Ejemplo de verificación
  bcrypt.compare('operario123', hash, function(err, result) {
    console.log('Verificación:', result); // debería ser true
  });
});
