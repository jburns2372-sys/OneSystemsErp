const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.startsWith('.env'));
const results = [];
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  content.split('\n').forEach(l => {
    if (l.includes('DATABASE_URL') || l.includes('DIRECT_URL') || l.includes('POSTGRES_URL')) {
      let host = '';
      try {
        if(l.includes('postgres://') || l.includes('postgresql://')) {
          const urlStr = l.split('=')[1].replace(/\"/g, '').replace(/\'/g, '').trim();
          const url = new URL(urlStr);
          host = url.hostname;
        }
      } catch(e) {}
      results.push({ file: f, variable: l.split('=')[0].trim().replace('#', '').trim(), value: host || "Empty/ParseError" });
    }
  });
});
console.log(JSON.stringify(results, null, 2));
