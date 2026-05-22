const fs = require('fs');
const path = require('path');

const dirs = ['./pages', './components'];

const replacements = [
  { regex: /rgba\(\s*212\s*,\s*175\s*,\s*55\s*,\s*([0-9.]+)\s*\)/gi, replace: 'rgb(var(--accent-main)/$1)' },
  { regex: /rgba\(\s*243\s*,\s*229\s*,\s*171\s*,\s*([0-9.]+)\s*\)/gi, replace: 'rgb(var(--accent-light)/$1)' },
  { regex: /rgba\(\s*170\s*,\s*124\s*,\s*17\s*,\s*([0-9.]+)\s*\)/gi, replace: 'rgb(var(--accent-dark)/$1)' },
  { regex: /rgba\(\s*179\s*,\s*147\s*,\s*89\s*,\s*([0-9.]+)\s*\)/gi, replace: 'rgb(var(--accent-alt)/$1)' },
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
        console.log('Updated RGBA: ' + fullPath);
      }
    }
  }
}

dirs.forEach(processDir);
console.log('Done');
