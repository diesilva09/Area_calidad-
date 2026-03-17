const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync('jefe123', 10);
console.log('Hash para diesilva1709@gmail.com:');
console.log(hash);
