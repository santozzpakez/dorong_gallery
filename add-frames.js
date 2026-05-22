
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

// Step 1: Thicken the border to make it a "bingkai foto" (photo frame) and remove overflow-hidden
content = content.replace(
    /border border-white\/60 dark:border-zinc-400 (.*?) overflow-hidden md:\[transform:perspective/g,
    "border-[8px] border-white dark:border-zinc-700 $1 md:[transform:perspective"
);

// Step 2: Wrap inner contents in an overflow-hidden div and add the stand
const categories = [
    { key: "anime", title: "ANIME" },
    { key: "kpop", title: "K-POP", coverPrefix: "kpop-group-" }, // the map uses t.kpop, but the html has cover-kpop
    { key: "aesthetic", title: "AESTHETIC", coverPrefix: "aesthetic-" },
    { key: "custom", title: "CUSTOM", coverPrefix: "custom-" }
];

// Instead of mapping categories, it is easier to find the inner parts.
// The inner part starts with `<div className="absolute inset-0 bg-gradient-to-tr`
// and ends with `</Link>`

// We will use a regex to replace the inner content of the Link
// Or we can just do literal string replacements for the boundaries.

// The flash effect div:
const flashDiv = `<div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out z-20 pointer-events-none" />`;

const newInnerStart = `
                {/* Photo Frame Stand (Penyangga Belakang) */}
                <div className="absolute top-[15%] -right-[15%] w-[30%] h-[70%] border-r-[8px] border-b-[8px] border-zinc-800 dark:border-zinc-950 rounded-br-[16px] shadow-[10px_10px_20px_rgba(0,0,0,0.6)] opacity-100 group-hover:opacity-0 transition-opacity duration-300 -z-10" />
                
                {/* Frame Inner Contents (Wrapped for overflow) */}
                <div className="absolute inset-0 overflow-hidden rounded-[14px]">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out z-20 pointer-events-none" />`;

content = content.replace(new RegExp(flashDiv.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), newInnerStart);

// Now we need to close the `<div className="absolute inset-0 overflow-hidden rounded-[14px]">` before the `</Link>`
content = content.replace(/                <\/Link>/g, "                </div>\n              </Link>");

fs.writeFileSync(filePath, content, "utf8");
console.log("Frames and stands added successfully!");

