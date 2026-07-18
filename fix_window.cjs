const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'components');

const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(f => {
  const p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf8');
  if (content.includes("window.location.pathname === '/location'")) {
    content = content.replace(/ \+ \(window\.location\.pathname === '\/location' \? ' active' : ''\)/g, '');
    fs.writeFileSync(p, content);
    console.log('Fixed ' + f);
  }
});
