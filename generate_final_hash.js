const bcrypt = require('bcrypt');

bcrypt.hash('operario123', 10)
  .then(hash => {
    console.log('Hash generado para operario123:');
    console.log(hash);
    console.log('\nSQL para actualizar:');
    console.log(`UPDATE users SET password_hash = '${hash}', updated_at = CURRENT_TIMESTAMP WHERE email = 'diegoy2312@gmail.com';`);
  })
  .catch(err => {
    console.error('Error al generar hash:', err);
  });
