
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

// Regex to remove the subtitle span for all 4 cards
content = content.replace(/<span className="text-\[9px\].*?\{t\.(anime|kpop|aesthetic|custom)Subtitle\}.*?<\/span>/g, "");

fs.writeFileSync(filePath, content, "utf8");
console.log("Subtitles removed!");

