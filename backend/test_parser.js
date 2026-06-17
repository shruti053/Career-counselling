import fs from "fs";
import path from "path";

const txtDir = "./parsed_txt";
const outputDir = "./parsed_json";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const txtFiles = fs.readdirSync(txtDir).filter(f => f.endsWith(".txt"));

function parseSubject(fileName) {
  const filePath = path.join(txtDir, fileName);
  let text = fs.readFileSync(filePath, "utf8");

  // Clean page footers
  text = text.replace(/--\s*\d+\s*of\s*\d+\s*--/g, "");

  // Extract Answer Key
  const answers = {};
  const answerKeyRegex = /\bQ(\d+)\s+([A-D])\b/g;
  let match;
  while ((match = answerKeyRegex.exec(text)) !== null) {
    answers[parseInt(match[1], 10)] = match[2];
  }

  // Regex to extract questions
  const questions = [];
  const qRegex = /\bQ(\d+)\.([\s\S]*?)\bA\)([\s\S]*?)\bB\)([\s\S]*?)\bC\)([\s\S]*?)\bD\)([\s\S]*?)(?=\bQ\d+\.|\bAnswer Key|\bSection\b|$)/g;

  while ((match = qRegex.exec(text)) !== null) {
    const qNum = parseInt(match[1], 10);
    const qText = match[2].trim().replace(/\s+/g, " ");
    const optA = match[3].trim().replace(/\s+/g, " ");
    const optB = match[4].trim().replace(/\s+/g, " ");
    const optC = match[5].trim().replace(/\s+/g, " ");
    const optD = match[6].trim().replace(/\s+/g, " ");
    const correctAns = answers[qNum] || "";

    // Set score 4 for correct, 1 for incorrect
    const opts = [
      { t: optA, s: correctAns === "A" ? 4 : 1 },
      { t: optB, s: correctAns === "B" ? 4 : 1 },
      { t: optC, s: correctAns === "C" ? 4 : 1 },
      { t: optD, s: correctAns === "D" ? 4 : 1 }
    ];

    questions.push({
      cat: getCategoryForQNum(qNum),
      q: qText,
      opts: opts
    });
  }

  const baseName = path.basename(fileName, ".txt");
  fs.writeFileSync(path.join(outputDir, `${baseName}.json`), JSON.stringify(questions, null, 2));
  console.log(`${baseName}: Parsed ${questions.length} questions, found ${Object.keys(answers).length} answers in key.`);
}

function getCategoryForQNum(qNum) {
  // Distribute 20 questions across 6 categories:
  // Q1-Q2: financial (2)
  // Q3-Q5: academic (3)
  // Q6-Q8: aptitude (3)
  // Q9-Q12: commitment (4)
  // Q13-Q16: expectation (4)
  // Q17-Q20: softskills (4)
  if (qNum <= 2) return "financial";
  if (qNum <= 5) return "academic";
  if (qNum <= 8) return "aptitude";
  if (qNum <= 12) return "commitment";
  if (qNum <= 16) return "expectation";
  return "softskills";
}

for (const file of txtFiles) {
  parseSubject(file);
}
