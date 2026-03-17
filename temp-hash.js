const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync('jefe123', 10);
console.log('Nuevo hash para diesilva1709@gmail.com:');
console.log(hash);
console.log('\nSQL para actualizar:');
console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'diesilva1709@gmail.com';`);
