
const fs = require("fs");
const path = require("path");

// 1. Fix Locales
["en.json", "id.json"].forEach(file => {
    const localePath = path.join(__dirname, "locales", file);
    if (fs.existsSync(localePath)) {
        let content = fs.readFileSync(localePath, "utf8");
        content = content.replace(/"- ANIME -"/g, `"ANIME"`);
        content = content.replace(/"- K-POP -"/g, `"K-POP"`);
        content = content.replace(/"- AESTHETIC -"/g, `"AESTHETIC"`);
        content = content.replace(/"- CUSTOM -"/g, `"CUSTOM"`);
        fs.writeFileSync(localePath, content, "utf8");
    }
});

// 2. Fix index.js collision
const indexPath = path.join(__dirname, "pages/index.js");
let indexContent = fs.readFileSync(indexPath, "utf8");

// Change image height from 85% to 75% to give more room for text
indexContent = indexContent.replace(/h-\[85%\]/g, "h-[75%]");

// Adjust padding so text sits elegantly in the new larger silver space
indexContent = indexContent.replace(/pb-3 z-10/g, "pb-5 z-10");

fs.writeFileSync(indexPath, indexContent, "utf8");
console.log("Collision fixed and hyphens removed!");

