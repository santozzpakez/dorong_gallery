
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

const newMiterJoints = `                {/* Wood Frame Miter Joints & Grooves */}
                <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                  {/* 4 Diagonal Corner Seams (Miter Joints) */}
                  <div className="absolute top-0 left-0 w-[23px] h-[2px] bg-black/80 origin-top-left rotate-45" />
                  <div className="absolute top-0 right-0 w-[23px] h-[2px] bg-black/80 origin-top-right -rotate-45" />
                  <div className="absolute bottom-0 left-0 w-[23px] h-[2px] bg-black/80 origin-bottom-left -rotate-45" />
                  <div className="absolute bottom-0 right-0 w-[23px] h-[2px] bg-black/80 origin-bottom-right rotate-45" />
                  
                  {/* Decorative Carved Grooves */}
                  <div className="absolute inset-[6px] border border-black/70 shadow-[0_1px_1px_rgba(255,255,255,0.2)] rounded-sm" />
                  <div className="absolute inset-[10px] border border-black/40 rounded-sm" />
                  <div className="absolute inset-0 border-[2px] border-white/20 rounded-sm" />
                </div>
                
                {/* Frame Inner Contents (Wrapped for overflow) */}`;

content = content.replace(/                \{\/\* Frame Inner Contents \(Wrapped for overflow\) \*\/\}/g, newMiterJoints);

fs.writeFileSync(filePath, content, "utf8");
console.log("Miter joints and grooves added!");

