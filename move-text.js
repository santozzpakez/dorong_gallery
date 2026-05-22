
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

// Change the padding bottom of the text container to move it down
// The container currently has "flex flex-col justify-end items-center pb-8 z-10"
content = content.replace(/pb-8 z-10/g, "pb-3 z-10");

fs.writeFileSync(filePath, content, "utf8");
console.log("Text moved down!");

