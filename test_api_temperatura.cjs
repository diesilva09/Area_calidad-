const http = require('http');

function testAPI() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/temperatura-envasado?action=existe&productoId=000114',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Estado: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Respuesta:', data);
      try {
        const parsed = JSON.parse(data);
        console.log('Respuesta parseada:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('No se pudo parsear como JSON');
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
  });

  req.end();
}

testAPI();
