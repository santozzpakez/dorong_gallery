
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

// Change padding to push cards UP relative to the background
content = content.replace(
    `bg-center bg-no-repeat overflow-hidden py-32"`,
    `bg-center bg-no-repeat overflow-hidden pt-16 pb-[14rem] md:pb-[18rem]"`
);

// Make the cards smaller
content = content.replace(/md:w-\[24%\]/g, "md:w-[20%] lg:w-[18%]");

fs.writeFileSync(filePath, content, "utf8");
console.log("Cards lifted successfully!");

