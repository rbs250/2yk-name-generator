// names-engine.js (in the project root) is the single source of truth:
// the site loads it directly and it generates the database in the browser.
// This script just snapshots it into names.generated.js for anyone who
// wants a static list. Run: node tools/generate-names.js
const fs = require("fs");
const path = require("path");

const names = require(path.join(__dirname, "..", "names-engine.js"));
const outputPath = path.join(__dirname, "..", "names.generated.js");

const fileBody = `// Generated from names-engine.js. Edit that file, then run tools/generate-names.js.\nwindow.NAME_DATABASE = ${JSON.stringify(names, null, 2)};\n`;

fs.writeFileSync(outputPath, fileBody, "utf8");
console.log(`Generated ${names.length} names at ${outputPath}`);
