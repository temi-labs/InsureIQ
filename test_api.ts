import http from 'http';

http.get('http://127.0.0.1:3000/api/policies', (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Data:', data.substring(0, 50)));
}).on('error', err => {
  console.error('Error:', err.message);
});
