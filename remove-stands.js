
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

// We can just remove the exact string or use a regex to match the comment and the div.
const standRegex = /\{\/\* Photo Frame Stand \(Penyangga Belakang\) \*\/\}\s*<div className="absolute top-\[15%\] -right-\[15%\] w-\[30%\] h-\[70%\] border-r-\[8px\] border-b-\[8px\] border-zinc-800 dark:border-zinc-950 rounded-br-\[16px\] shadow-\[10px_10px_20px_rgba\(0,0,0,0\.6\)\] opacity-100 group-hover:opacity-0 transition-opacity duration-300 -z-10" \/>/g;

content = content.replace(standRegex, "");

fs.writeFileSync(filePath, content, "utf8");
console.log("Stands removed!");

