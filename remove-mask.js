
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

// Remove the maskImage style from all 4 image tags
content = content.replace(/style=\{\{ WebkitMaskImage: "linear-gradient\(to bottom, rgba\(0,0,0,1\) 50%, rgba\(0,0,0,0\) 100%\)", maskImage: "linear-gradient\(to bottom, rgba\(0,0,0,1\) 50%, rgba\(0,0,0,0\) 100%\)" \}\}/g, "");

fs.writeFileSync(filePath, content, "utf8");
console.log("Masks removed!");

