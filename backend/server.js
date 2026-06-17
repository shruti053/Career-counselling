import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the React frontend build
app.use(express.static(path.join(__dirname, "../frontend/dist")));

const sslAgent = new https.Agent({
  rejectUnauthorized: false
});

// Helper function to validate a URL using a HEAD or GET request with a timeout
async function validateUrl(url) {
  if (!url || typeof url !== "string" || !url.startsWith("http")) {
    return false;
  }
  
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("example.com") || lowerUrl.includes("...") || lowerUrl.endsWith("/...")) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout

    let response;
    try {
      response = await fetch(url, {
        method: "HEAD",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        agent: url.startsWith("https") ? sslAgent : undefined,
        signal: controller.signal
      });
    } catch (headErr) {
      // If HEAD fails, fall back to GET (some servers block HEAD)
      const getController = new AbortController();
      const getTimeoutId = setTimeout(() => getController.abort(), 4000);
      response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        agent: url.startsWith("https") ? sslAgent : undefined,
        signal: getController.signal
      });
      clearTimeout(getTimeoutId);
    }

    clearTimeout(timeoutId);

    // 404 means the resource does not exist
    if (response.status === 404) {
      return false;
    }
    
    // Server errors (5xx) mean the resource is broken/inaccessible
    if (response.status >= 500) {
      return false;
    }

    return true;
  } catch (err) {
    console.log(`URL validation failed for ${url}: ${err.message}`);
    // If DNS resolve fails or connection refused or timeout
    if (err.message.includes("ENOTFOUND") || err.message.includes("ECONNREFUSED") || err.name === "AbortError") {
      return false;
    }
    return false;
  }
}

// Perform validation pass on all roadmap urls
async function performValidationPass(roadmap) {
  if (!roadmap || !roadmap.months) return roadmap;

  const validationPromises = [];

  for (const month of roadmap.months) {
    if (month.courses) {
      for (const course of month.courses) {
        validationPromises.push((async () => {
          const isValid = await validateUrl(course.url);
          if (!isValid) {
            console.log(`[Validation] Invalid course URL found and marked unverified: ${course.url}`);
            course.url = "Resource could not be verified";
          }
        })());
      }
    }

    if (month.youtube) {
      for (const yt of month.youtube) {
        validationPromises.push((async () => {
          const isValid = await validateUrl(yt.url);
          if (!isValid) {
            console.log(`[Validation] Invalid YouTube URL found and marked unverified: ${yt.url}`);
            yt.url = "Resource could not be verified";
          }
        })());
      }
    }
  }

  await Promise.all(validationPromises);
  return roadmap;
}

function generateFallbackRoadmap(career, scores) {
  const careerName = career.charAt(0).toUpperCase() + career.slice(1);
  return {
    summary: `Based on your profile, we have built a structured preparation path for ${careerName}. Focus on building core foundational knowledge and practical projects.`,
    strengths: [
      "Good foundational alignment and interest in the field",
      "Willingness to learn and explore new concepts",
      "Analytical mindset to approach problems systematically"
    ],
    gaps: [
      "Needs deeper exposure to real-world applications",
      "Needs structured hands-on project experience",
      "Opportunity to build industry-recognized certifications"
    ],
    months: [
      {
        month: 1,
        title: "Foundations & Core Principles",
        focus: "Understanding the basic concepts and frameworks",
        topics: ["Introduction to Concepts", "Basic Principles", "Terminology"],
        courses: [
          {
            name: `${careerName} Basics`,
            platform: "Coursera",
            url: "https://www.coursera.org",
            free: true,
            why: "Builds absolute fundamental understanding of core concepts.",
            difficulty: "Beginner"
          }
        ],
        youtube: [
          {
            channel: "CrashCourse",
            topic: `Intro to ${careerName}`,
            url: "https://youtube.com",
            why: "Visual explanation of key topics for quick understanding.",
            difficulty: "Beginner"
          }
        ],
        goal: "Master foundational terminology and core frameworks."
      },
      {
        month: 2,
        title: "Intermediate Applications",
        focus: "Applying concepts to practical scenarios",
        topics: ["Applied Methodologies", "Case Studies", "Problem Solving"],
        courses: [
          {
            name: `Applied ${careerName}`,
            platform: "edX",
            url: "https://www.edx.org",
            free: true,
            why: "Focuses on practical implementation of the principles.",
            difficulty: "Intermediate"
          }
        ],
        youtube: [
          {
            channel: "FreeCodeCamp",
            topic: `Practical ${careerName}`,
            url: "https://youtube.com",
            why: "Hands-on projects and guides.",
            difficulty: "Intermediate"
          }
        ],
        goal: "Build 2 small-scale projects applying the principles."
      },
      {
        month: 3,
        title: "Advanced Scenarios & Optimization",
        focus: "Tackling complex real-world scenarios",
        topics: ["Advanced Frameworks", "Optimization Techniques", "Case Analysis"],
        courses: [
          {
            name: `Advanced ${careerName}`,
            platform: "NPTEL",
            url: "https://nptel.ac.in",
            free: true,
            why: "Rigorous academic and professional depth.",
            difficulty: "Advanced"
          }
        ],
        youtube: [
          {
            channel: "MIT OpenCourseWare",
            topic: `Advanced Analysis`,
            url: "https://youtube.com",
            why: "Deep theoretical insights from world-class lectures.",
            difficulty: "Advanced"
          }
        ],
        goal: "Analyze and solve complex industry case studies."
      },
      {
        month: 4,
        title: "Project Portfolio & Assessment",
        focus: "Consolidating learning into a complete project portfolio",
        topics: ["Capstone Project", "Resume Building", "Interview Prep"],
        courses: [
          {
            name: `${careerName} Capstone`,
            platform: "Coursera",
            url: "https://www.coursera.org",
            free: false,
            why: "Structured project guidance to compile a portfolio.",
            difficulty: "Advanced"
          }
        ],
        youtube: [
          {
            channel: "Career Counseling Experts",
            topic: "Interview Questions",
            url: "https://youtube.com",
            why: "Preparing for typical technical and situational interviews.",
            difficulty: "Intermediate"
          }
        ],
        goal: "Publish a complete capstone project and update professional profiles."
      }
    ],
    certifications: [
      `Professional Certificate in ${careerName}`,
      `Industry Foundations Certificate`
    ],
    scholarships: [
      "Central Sector Scheme of Scholarships",
      "State Merit-based Higher Education Scholarships"
    ],
    tip: "Stay consistent! Spending just 4-5 hours a week will compound into significant expertise over 4 months."
  };
}

app.post("/api/roadmap", async (req, res) => {
  const { career, scores } = req.body;

  const isEngineering = career.toLowerCase().includes("engineering");
  const isCommOrArts = ["accounting", "economics", "entrepreneurship", "finance", "history", "marketing", "politicalscience", "psychology", "political science"].some(c => career.toLowerCase().includes(c));

  const strongThresh = isEngineering ? 96 : (isCommOrArts ? 64 : 51);
  const moderateThresh = isEngineering ? 75 : (isCommOrArts ? 50 : 38);
  const exploreThresh = isEngineering ? 54 : (isCommOrArts ? 36 : 26);
  const maxScore = isEngineering ? 120 : (isCommOrArts ? 80 : 60);

  let fitScoreClassification = "Weak Fit";
  if (scores.fitScore >= strongThresh) fitScoreClassification = "Strong Fit";
  else if (scores.fitScore >= moderateThresh) fitScoreClassification = "Moderate Fit";
  else if (scores.fitScore >= exploreThresh) fitScoreClassification = "Explore Further";

  const prompt = `You are a career counselor for Indian science students.
Student wants to pursue ${career}. 

Engineering Career-Fit Assessment Results:
- Engineering Fit Score: ${scores.fitScore}/${maxScore} (Classification: ${fitScoreClassification})
- Analytical Thinking: ${scores.analytical}%
- Problem Solving: ${scores.problem}%
- Technical Curiosity: ${scores.curiosity}%
- Learning Commitment: ${scores.commitment}%
- Persistence Level: ${scores.persistence}%
- Academic Readiness: ${scores.academic}%
- Financial Capacity: ${scores.financial}%

Generate a 4-month personalized roadmap. Use encouraging language. NEVER say "you cannot". 

CRITICAL RESOURCE RULES:
1. ONLY provide real, working, and highly stable educational links (e.g. from official documentation, Coursera, edX, NPTEL, YouTube channels, Khan Academy, freeCodeCamp, GeeksforGeeks).
2. Never invent or hallucinate URLs. If you are not certain a specific course URL exists, provide the main domain page of a reliable platform (e.g., "https://www.coursera.org" or "https://www.nptel.ac.in").
3. For every course and YouTube channel, specify a difficulty level ("Beginner", "Intermediate", or "Advanced") and a brief "why" explaining why it is recommended.

Respond ONLY in this JSON structure (no markdown wrapper, no extra text):
{
  "summary": "2 sentence encouraging summary",
  "strengths": ["s1","s2","s3"],
  "gaps": ["g1","g2","g3"],
  "months": [
    {
      "month": 1,
      "title": "Title",
      "focus": "Focus area",
      "topics": ["t1","t2","t3"],
      "courses": [
        {
          "name": "Course Name",
          "platform": "Platform Name",
          "url": "Exact working URL or reliable platform domain",
          "free": true,
          "why": "Brief reason why it fits their profile",
          "difficulty": "Beginner/Intermediate/Advanced"
        }
      ],
      "youtube": [
        {
          "channel": "YouTube Channel Name",
          "topic": "Topic Name",
          "url": "Exact working video/channel URL or 'https://youtube.com'",
          "why": "Brief reason why it fits their profile",
          "difficulty": "Beginner/Intermediate/Advanced"
        }
      ],
      "goal": "Monthly goal"
    }
  ],
  "certifications": ["c1","c2"],
  "scholarships": ["s1","s2"],
  "tip": "Final tip"
}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GEMINI_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.7
      }),
    });

    const data = await response.json();
    console.log("Groq response:", JSON.stringify(data));

    if (!data.choices || !data.choices[0] || data.error) {
      console.log("Groq API error or invalid key, generating fallback roadmap.");
      const fallback = generateFallbackRoadmap(career, scores);
      const validatedRoadmap = await performValidationPass(fallback);
      return res.json(validatedRoadmap);
    }

    const text = data.choices[0].message.content;
    const roadmap = JSON.parse(text.replace(/```json|```/g, "").trim());
    
    // Run validation pass to filter/flag broken URLs
    const validatedRoadmap = await performValidationPass(roadmap);
    res.json(validatedRoadmap);
  } catch (err) {
    console.error("Error:", err.message, "Generating fallback roadmap.");
    try {
      const fallback = generateFallbackRoadmap(career, scores);
      const validatedRoadmap = await performValidationPass(fallback);
      res.json(validatedRoadmap);
    } catch (fallbackErr) {
      res.status(500).json({ error: err.message });
    }
  }
});

// Wildcard route to serve React's index.html for client-side routing
app.get("/*splat", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));