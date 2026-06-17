import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

console.log("PDFParse class properties:", Object.getOwnPropertyNames(pdf.PDFParse));
console.log("PDFParse prototype properties:", Object.getOwnPropertyNames(pdf.PDFParse.prototype));
