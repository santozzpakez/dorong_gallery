
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

// Revert the background and padding back to exactly what it was
content = content.replace(
    `bg-[center_bottom] bg-no-repeat overflow-hidden pt-40 pb-16"`,
    `bg-center bg-no-repeat overflow-hidden py-32"`
);

// Revert the width of the cards back to 24%
content = content.replace(/md:w-\[20%\]/g, "md:w-[24%]");

fs.writeFileSync(filePath, content, "utf8");
console.log("Undo successful!");

