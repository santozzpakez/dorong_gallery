
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

// The closing tag is currently missing.
// The end of the card looks like:
//                 </div>
//               </Link>
// We need to add one more </div> before </Link>

content = content.replace(
    /                <\/div>\n              <\/Link>/g,
    "                </div>\n                </div>\n              </Link>"
);

fs.writeFileSync(filePath, content, "utf8");
console.log("Syntax error fixed!");

