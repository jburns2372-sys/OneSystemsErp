const http = require('http');

const data = JSON.stringify({
  deviceSerialNumber: "DS-M5504HNI-123456789",
  timestamp: new Date().toISOString(),
  latitude: 14.5995,
  longitude: 120.9842,
  speedKph: 45.2,
  heading: 120,
  satelliteCount: 8,
  ignitionStatus: true
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/fleet/hikvision/webhook/gps',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': 'dev_secret'
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', d => process.stdout.write(d));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
