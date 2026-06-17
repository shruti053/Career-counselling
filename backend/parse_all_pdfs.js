import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

const pdfDir = "../commerce and arts questions";
const outputDir = "./parsed_txt";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const pdfFiles = fs.readdirSync(pdfDir).filter(f => f.endsWith(".pdf"));

async function processPdf(fileName) {
  const filePath = path.join(pdfDir, fileName);
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new pdf.PDFParse({ data: dataBuffer, verbosity: 0 });
  const result = await parser.getText();
  const baseName = path.basename(fileName, ".pdf");
  fs.writeFileSync(path.join(outputDir, `${baseName}.txt`), result.text);
  console.log(`Processed ${fileName}: length = ${result.text.length}`);
}

async function run() {
  for (const file of pdfFiles) {
    try {
      await processPdf(file);
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }
}

run();
