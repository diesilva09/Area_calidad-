const bcrypt = require('bcrypt');

// Generar hash para la contraseña 'operario123'
const password = 'operario123';
const saltRounds = 12; // Mismo número de rondas que tu hash existente

bcrypt.hash(password, saltRounds, function(err, hash) {
  if (err) {
    console.error('Error al generar hash:', err);
    return;
  }
  
  console.log('Hash generado para operario123:');
  console.log(hash);
  
  // SQL para actualizar
  console.log('\n--- SQL para actualizar ---');
  console.log(`UPDATE users 
SET password_hash = '${hash}', 
    verified = true,
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'diegoy2312@gmail.com';`);
  
  // Verificación inmediata
  bcrypt.compare('operario123', hash, function(err, result) {
    console.log('\nVerificación del hash:', result); // debería ser true
  });
});
