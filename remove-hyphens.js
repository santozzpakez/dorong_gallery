
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

content = content.replace(/'- ANIME -'/g, "'ANIME'");
content = content.replace(/'- K-POP -'/g, "'K-POP'");
content = content.replace(/'- AESTHETIC -'/g, "'AESTHETIC'");
content = content.replace(/'- CUSTOM -'/g, "'CUSTOM'");

fs.writeFileSync(filePath, content, "utf8");
console.log("Hyphens truly removed from index.js!");

