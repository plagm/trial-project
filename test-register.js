const http = require('http');

const data = JSON.stringify({
  name: 'Test User',
  email: 'test' + Date.now() + '@example.com',
  password: 'password123'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let resData = '';
  res.on('data', chunk => { resData += chunk; });
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`BODY: ${resData}`);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
