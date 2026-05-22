
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

// 1. Change the outer Link
// We will replace the border and bg-gradient with bg-cover bg-center, and add the style tag.
// Since hrefs are different, we can match the common className part.
const oldOuterClass = "className=\"group relative w-full md:w-[20%] lg:w-[18%] aspect-[4/5] rounded-sm border-[8px] border-white dark:border-zinc-700 bg-gradient-to-br from-zinc-50 via-zinc-200 to-zinc-400 dark:from-zinc-300 dark:via-zinc-400 dark:to-zinc-500";
const newOuterClass = "style={{ backgroundImage: \"url('/wood-texture.png')\" }}\n                className=\"group relative w-full md:w-[20%] lg:w-[18%] aspect-[4/5] rounded-sm bg-cover bg-center";
content = content.split(oldOuterClass).join(newOuterClass);

// 2. Change the inner wrapper
// From: <div className="absolute inset-0 overflow-hidden rounded-[14px]">
// To: <div className="absolute inset-[8px] overflow-hidden rounded-[14px] bg-gradient-to-br from-zinc-50 via-zinc-200 to-zinc-400 dark:from-zinc-300 dark:via-zinc-400 dark:to-zinc-500 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]">
const oldInnerDiv = "<div className=\"absolute inset-0 overflow-hidden rounded-[14px]\">";
const newInnerDiv = "<div className=\"absolute inset-[8px] overflow-hidden rounded-[14px] bg-gradient-to-br from-zinc-50 via-zinc-200 to-zinc-400 dark:from-zinc-300 dark:via-zinc-400 dark:to-zinc-500 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]\">";
content = content.split(oldInnerDiv).join(newInnerDiv);

fs.writeFileSync(filePath, content, "utf8");
console.log("Real wood image applied as frame!");

