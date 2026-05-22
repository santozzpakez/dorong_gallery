
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

// Remove the heavy rounding from the outer frame (Link), replacing it with rounded-sm for a sharp rectangular picture frame look.
content = content.replace(/rounded-\[24px\] /g, "rounded-sm ");

fs.writeFileSync(filePath, content, "utf8");
console.log("Frames squared!");

