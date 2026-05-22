const fs = require('fs');
const path = require('path');

const dirs = ['./pages', './components'];

const replacements = [
  { regex: /\[#f3e5ab\]/gi, replace: 'accent-light' },
  { regex: /\[#d4af37\]/gi, replace: 'accent' },
  { regex: /\[#aa7c11\]/gi, replace: 'accent-dark' },
  { regex: /\[#b39359\]/gi, replace: 'accent-alt' },
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content;
      for (const rule of replacements) {
        newContent = newContent.replace(rule.regex, rule.replace);
      }
      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log('Updated: ' + fullPath);
      }
    }
  }
}

dirs.forEach(processDir);
console.log('Done');
