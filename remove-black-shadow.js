
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

// Remove bg-zinc-950 from the photo container so it doesn't create a black fade effect
content = content.replace(/className="absolute top-0 left-0 w-full h-\[75%\] bg-zinc-950 overflow-hidden"/g, "className=\"absolute top-0 left-0 w-full h-[75%] overflow-hidden\"");

fs.writeFileSync(filePath, content, "utf8");
console.log("Black shadow removed!");

