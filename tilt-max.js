
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

// Increase rotation to tilt even deeper inwards
content = content.replace(/rotateY\(-40deg\)/g, "rotateY(-55deg)");

fs.writeFileSync(filePath, content, "utf8");
console.log("Cards tilted extremely deep!");

