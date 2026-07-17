const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const filePath = path.join(componentsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('<nav className="bottom-nav">')) {
    // Check if MapPin is imported from lucide-react
    if (content.includes('lucide-react') && !content.includes('MapPin')) {
      content = content.replace(/import {([^}]+)} from 'lucide-react';/, (match, p1) => {
        return `import { ${p1.trim()}, MapPin } from 'lucide-react';`;
      });
    }

    const navItem = `
        <a href="/location" className={"nav-item" + (window.location.pathname === '/location' ? ' active' : '')}>
          <div className="nav-icon"><MapPin /></div>
          <span>Position</span>
        </a>`;

    // Try to insert before the closing </nav> tag if not already there
    if (!content.includes('href="/location"')) {
      content = content.replace('</nav>', `${navItem}\n      </nav>`);
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${file}`);
    }
  }
}
