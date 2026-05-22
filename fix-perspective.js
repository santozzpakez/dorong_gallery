
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

// 1. Remove perspective from the parent container
content = content.replace(/style=\{\{ perspective: "2000px" \}\}/g, "");

// 2. Remove transformStyle from the flex container
content = content.replace(/style=\{\{ transformStyle: "preserve-3d" \}\}/g, "");

// 3. Add perspective directly into the transform of each card so they all look identical
content = content.replace(/md:\[transform:rotateY\(-55deg\)_rotateX\(5deg\)\]/g, "md:[transform:perspective(2000px)_rotateY(-55deg)_rotateX(5deg)]");

fs.writeFileSync(filePath, content, "utf8");
console.log("Perspective fixed so all cards look identical!");

