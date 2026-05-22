
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

// Remove the individual rotateZ differences so they all stand exactly the same way
content = content.replace(/md:\[transform:rotateY\(-40deg\)_rotateX\(10deg\)_rotateZ\(-?\d+deg\)\]/g, "md:[transform:rotateY(-40deg)_rotateX(5deg)]");

fs.writeFileSync(filePath, content, "utf8");
console.log("Cards made uniform!");

