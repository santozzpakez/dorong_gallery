
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "pages/index.js");
let content = fs.readFileSync(filePath, "utf8");

const startMarker = "{/* 3D Skewed Brushed-Metal Cards Deck */}";
const endMarker = "{/* Brushed Platinum Elegant Bottom Divider Line */}";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.log("Could not find markers.");
    process.exit(1);
}

const replacement = `{/* 3D Skewed Brushed-Metal Cards Deck */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8" style={{ perspective: "2000px" }}>
            <div className="flex flex-col md:flex-row justify-center items-center gap-10 md:gap-4 lg:gap-6 py-20" style={{ transformStyle: "preserve-3d" }}>
              
              {/* CARD 1: ANIME */}
              <Link 
                href="/anime" 
                className="group relative w-full md:w-[24%] aspect-[4/5] rounded-[24px] border border-white/60 dark:border-zinc-400 bg-gradient-to-br from-zinc-50 via-zinc-200 to-zinc-400 dark:from-zinc-300 dark:via-zinc-400 dark:to-zinc-500 shadow-[-20px_20px_30px_rgba(0,0,0,0.4)] hover:shadow-[-30px_30px_50px_rgba(0,0,0,0.6)] transition-all duration-700 ease-out cursor-pointer overflow-hidden md:[transform:rotateY(-20deg)_rotateX(10deg)_rotateZ(-4deg)] hover:!transform-none z-10 hover:z-50"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out z-20 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-[85%] bg-zinc-950 overflow-hidden">
                  {getUrl("cover-anime") ? (
                    <img src={getUrl("cover-anime")} alt="Anime" className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-all duration-700 ease-out" style={{ WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)", maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)" }} />
                  ) : (
                    <div className="w-full h-full bg-zinc-800" style={{ WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)", maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)" }} />
                  )}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-[35%] flex flex-col justify-end items-center pb-8 z-10 pointer-events-none">
                  <h3 className="text-2xl lg:text-3xl font-serif text-zinc-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] tracking-wide">{t.anime}</h3>
                  <span className="text-[9px] lg:text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#8a5d19] mt-2 drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">{t.animeSubtitle}</span>
                </div>
              </Link>

              {/* CARD 2: K-POP */}
              <Link 
                href="/kpop" 
                className="group relative w-full md:w-[24%] aspect-[4/5] rounded-[24px] border border-white/60 dark:border-zinc-400 bg-gradient-to-br from-zinc-50 via-zinc-200 to-zinc-400 dark:from-zinc-300 dark:via-zinc-400 dark:to-zinc-500 shadow-[-20px_20px_30px_rgba(0,0,0,0.4)] hover:shadow-[-30px_30px_50px_rgba(0,0,0,0.6)] transition-all duration-700 ease-out cursor-pointer overflow-hidden md:[transform:rotateY(-20deg)_rotateX(10deg)_rotateZ(-1deg)] hover:!transform-none z-10 hover:z-50"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out z-20 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-[85%] bg-zinc-950 overflow-hidden">
                  {getUrl("cover-kpop") ? (
                    <img src={getUrl("cover-kpop")} alt="K-Pop" className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-all duration-700 ease-out" style={{ WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)", maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)" }} />
                  ) : (
                    <div className="w-full h-full bg-zinc-800" style={{ WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)", maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)" }} />
                  )}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-[35%] flex flex-col justify-end items-center pb-8 z-10 pointer-events-none">
                  <h3 className="text-2xl lg:text-3xl font-serif text-zinc-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] tracking-wide">{t.kpop}</h3>
                  <span className="text-[9px] lg:text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#8a5d19] mt-2 drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">{t.kpopSubtitle}</span>
                </div>
              </Link>

              {/* CARD 3: AESTHETIC */}
              <Link 
                href="/aesthetic" 
                className="group relative w-full md:w-[24%] aspect-[4/5] rounded-[24px] border border-white/60 dark:border-zinc-400 bg-gradient-to-br from-zinc-50 via-zinc-200 to-zinc-400 dark:from-zinc-300 dark:via-zinc-400 dark:to-zinc-500 shadow-[-20px_20px_30px_rgba(0,0,0,0.4)] hover:shadow-[-30px_30px_50px_rgba(0,0,0,0.6)] transition-all duration-700 ease-out cursor-pointer overflow-hidden md:[transform:rotateY(-20deg)_rotateX(10deg)_rotateZ(2deg)] hover:!transform-none z-10 hover:z-50"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out z-20 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-[85%] bg-zinc-950 overflow-hidden">
                  {getUrl("cover-aesthetic") ? (
                    <img src={getUrl("cover-aesthetic")} alt="Aesthetic" className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-all duration-700 ease-out" style={{ WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)", maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)" }} />
                  ) : (
                    <div className="w-full h-full bg-zinc-800" style={{ WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)", maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)" }} />
                  )}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-[35%] flex flex-col justify-end items-center pb-8 z-10 pointer-events-none">
                  <h3 className="text-2xl lg:text-3xl font-serif text-zinc-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] tracking-wide">{t.aesthetic}</h3>
                  <span className="text-[9px] lg:text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#8a5d19] mt-2 drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">{t.aestheticSubtitle}</span>
                </div>
              </Link>

              {/* CARD 4: CUSTOM */}
              <Link 
                href="/custom" 
                className="group relative w-full md:w-[24%] aspect-[4/5] rounded-[24px] border border-white/60 dark:border-zinc-400 bg-gradient-to-br from-zinc-50 via-zinc-200 to-zinc-400 dark:from-zinc-300 dark:via-zinc-400 dark:to-zinc-500 shadow-[-20px_20px_30px_rgba(0,0,0,0.4)] hover:shadow-[-30px_30px_50px_rgba(0,0,0,0.6)] transition-all duration-700 ease-out cursor-pointer overflow-hidden md:[transform:rotateY(-20deg)_rotateX(10deg)_rotateZ(5deg)] hover:!transform-none z-10 hover:z-50"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out z-20 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-[85%] bg-zinc-950 overflow-hidden">
                  {getUrl("cover-custom") ? (
                    <img src={getUrl("cover-custom")} alt="Custom" className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-all duration-700 ease-out" style={{ WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)", maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)" }} />
                  ) : (
                    <div className="w-full h-full bg-zinc-800" style={{ WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)", maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)" }} />
                  )}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-[35%] flex flex-col justify-end items-center pb-8 z-10 pointer-events-none">
                  <h3 className="text-2xl lg:text-3xl font-serif text-zinc-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] tracking-wide">{t.custom}</h3>
                  <span className="text-[9px] lg:text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#8a5d19] mt-2 drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">{t.customSubtitle}</span>
                </div>
              </Link>

            </div>
          </div>
          
          `;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync(filePath, newContent, "utf8");
console.log("Cards refactored successfully!");

