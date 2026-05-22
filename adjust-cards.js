
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

// Change padding to push cards down onto the table
content = content.replace(
    `bg-center bg-no-repeat overflow-hidden py-32"`,
    `bg-[center_bottom] bg-no-repeat overflow-hidden pt-40 pb-16"`
);

// Make the cards slightly smaller to fit nicely on the desk
content = content.replace(/md:w-\[24%\]/g, "md:w-[20%]");

fs.writeFileSync(filePath, content, "utf8");
console.log("Cards adjusted successfully!");

