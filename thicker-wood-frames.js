
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

content = content.replace(/absolute inset-\[8px\]/g, "absolute inset-[16px]");

fs.writeFileSync(filePath, content, "utf8");
console.log("Frames made thicker!");

