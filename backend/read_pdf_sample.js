import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

const pdfPath = "../commerce and arts questions/Marketing.pdf";
const dataBuffer = fs.readFileSync(pdfPath);

const parser = new pdf.PDFParse({ data: dataBuffer, verbosity: 0 });
parser.getText().then(async (result) => {
  const text = result.text;
  console.log("PDF Text length:", text.length);
  console.log("End of text:\n", text.substring(text.length - 8000));
}).catch(err => {
  console.error("Error parsing pdf:", err);
});
