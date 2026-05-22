
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

// Change gap to negative spacing for overlap
content = content.replace("gap-10 md:gap-4 lg:gap-6", "gap-10 md:gap-0 md:-space-x-12 lg:-space-x-20");

// Increase rotateY from -20deg to -35deg for deeper perspective
content = content.replace(/rotateY\(-20deg\)/g, "rotateY(-35deg)");

fs.writeFileSync(filePath, content, "utf8");
console.log("Cards tweaked successfully!");

