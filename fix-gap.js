
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

content = content.replace("gap-10 md:gap-0 md:-space-x-12 lg:-space-x-20", "gap-10 md:gap-6 lg:gap-10");

// Also let us slightly relax the rotation from -35deg to -25deg so it doesn`t look too thin when separated
content = content.replace(/rotateY\(-35deg\)/g, "rotateY(-25deg)");

fs.writeFileSync(filePath, content, "utf8");
console.log("Cards gap fixed successfully!");

