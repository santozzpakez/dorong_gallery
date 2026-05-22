
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

// Increase rotation to tilt further inwards
content = content.replace(/rotateY\(-25deg\)/g, "rotateY(-40deg)");

fs.writeFileSync(filePath, content, "utf8");
console.log("Cards tilted deeper!");

