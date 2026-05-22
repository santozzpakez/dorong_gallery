
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

// Revert wood back to silver metal
content = content.replace(
    /border-\[8px\] border-\[#3a2012\] dark:border-\[#1a0f05\] bg-gradient-to-br from-\[#5a3a22\] via-\[#8b5a33\] to-\[#2d1a0f\] dark:from-\[#3a2012\] dark:via-\[#4a2e1b\] dark:to-\[#1a0f05\]/g,
    "border-[8px] border-white dark:border-zinc-700 bg-gradient-to-br from-zinc-50 via-zinc-200 to-zinc-400 dark:from-zinc-300 dark:via-zinc-400 dark:to-zinc-500"
);

// Revert gold text back to dark zinc
content = content.replace(
    /text-\[#f4d068\] drop-shadow-\[0_2px_4px_rgba\(0,0,0,0\.8\)\]/g,
    "text-zinc-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]"
);

fs.writeFileSync(filePath, content, "utf8");
console.log("Wood undone!");

