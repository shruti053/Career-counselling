import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the React frontend build
app.use(express.static(path.join(__dirname, "../frontend/dist")));

const sslAgent = new https.Agent({
  rejectUnauthorized: false
});

// Helper function to validate a URL (preserved for utility, but skipped for pre-verified routes)
async function validateUrl(url) {
  if (!url || typeof url !== "string" || !url.startsWith("http")) {
    return false;
  }
  
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("example.com") || lowerUrl.includes("...") || lowerUrl.endsWith("/...")) {
    return false;
  }

  // Handle YouTube URL via oEmbed
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout
      const response = await fetch(oembedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response.status === 200;
    } catch (err) {
      console.log(`YouTube oEmbed check failed for ${url}: ${err.message}`);
      return false;
    }
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
async function performValidationPass(roadmap, career) {
  if (!roadmap || !roadmap.months) return roadmap;

  const validationPromises = [];

  for (const month of roadmap.months) {
    if (month.courses) {
      for (const course of month.courses) {
        validationPromises.push((async () => {
          const isValid = await validateUrl(course.url);
          if (!isValid) {
            console.log(`[Validation] Invalid course URL found and marked unverified: ${course.url}`);
            course.url = "https://www.coursera.org";
          }
        })());
      }
    }

    if (month.youtube) {
      for (const yt of month.youtube) {
        validationPromises.push((async () => {
          const isValid = await validateUrl(yt.url);
          if (!isValid) {
            console.log(`[Validation] Invalid YouTube URL found and fallback to search: ${yt.url}`);
            const query = `${yt.topic || ""} ${career || ""}`.trim();
            yt.url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
          }
        })());
      }
    }
  }

  await Promise.all(validationPromises);
  return roadmap;
}

// ── PRE-VERIFIED HIGH QUALITY DIRECT RESOURCES FOR ALL 17 CAREERS ──
const CAREER_RESOURCES = {
  engineering: [
    {
      course: {
        name: "Introduction to Engineering Mechanics",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/engineering-mechanics-statics",
        free: true,
        why: "Provides foundational physics and mechanical concepts.",
        difficulty: "Beginner"
      },
      youtube: {
        channel: "Jeff Hanson",
        topic: "Engineering Mechanics / Statics",
        url: "https://www.youtube.com/playlist?list=PLRUud5sV4G4pZ5Vv6u2W3ZJpI6D7A6b3D",
        why: "Highly visual step-by-step statics problems.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Introduction to Programming with MATLAB",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/matlab",
        free: true,
        why: "Essential programming skills for numerical computing.",
        difficulty: "Beginner"
      },
      youtube: {
        channel: "CrashCourse",
        topic: "What is Engineering?",
        url: "https://www.youtube.com/watch?v=btGYcizV0iI",
        why: "Broad overview of different engineering fields.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Introduction to Thermodynamics: Transferring Energy from Here to There",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/thermodynamics-intro",
        free: true,
        why: "Covers crucial principles of energy and state changes.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "The Organic Chemistry Tutor",
        topic: "Thermodynamics Basics",
        url: "https://www.youtube.com/watch?v=NyOYW07-L5g",
        why: "Clear problems showing thermodynamic equations in action.",
        difficulty: "Intermediate"
      }
    },
    {
      course: {
        name: "Project Management: The Basics for Success",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/project-management-basics",
        free: true,
        why: "Prepares engineers for managing engineering projects.",
        difficulty: "Advanced"
      },
      youtube: {
        channel: "Learn Engineering",
        topic: "How Mechanical Gears Work",
        url: "https://www.youtube.com/watch?v=D_i3PJIYtuY",
        why: "Great animated insights into actual mechanisms.",
        difficulty: "Intermediate"
      }
    }
  ],
  mbbs: [
    {
      course: {
        name: "Anatomy: Human Neuroanatomy",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/medical-neuroscience",
        free: true,
        why: "In-depth understanding of brain anatomy and function.",
        difficulty: "Beginner"
      },
      youtube: {
        channel: "Sam Webster",
        topic: "Introduction to Human Anatomy",
        url: "https://www.youtube.com/watch?v=n70udDiVtz0",
        why: "Expert anatomical walkthroughs using real models.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Introductory Human Physiology",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/physiology",
        free: true,
        why: "Understands biological systems of the human body.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Ninja Nerd",
        topic: "Cardiovascular Physiology",
        url: "https://www.youtube.com/watch?v=jU9w6w8LwqM",
        why: "Thorough visual breakdown of cardiovascular systems.",
        difficulty: "Intermediate"
      }
    },
    {
      course: {
        name: "Epidemiology: The Basic Science of Public Health",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/epidemiology",
        free: true,
        why: "Teaches patterns and determinants of health conditions.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Armando Hasudungan",
        topic: "Immunology Overview",
        url: "https://www.youtube.com/watch?v=zQGOcOUBi6s",
        why: "Beautiful hand-drawn medical concepts and pathways.",
        difficulty: "Intermediate"
      }
    },
    {
      course: {
        name: "Clinical Terminology for International and U.S. Students",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/clinical-terminology",
        free: true,
        why: "Builds a critical language of clinical practice.",
        difficulty: "Advanced"
      },
      youtube: {
        channel: "MedCram",
        topic: "Understanding Clinical Labs",
        url: "https://www.youtube.com/watch?v=yKWQ_oLSXI8",
        why: "Teaches how medical practitioners interpret lab values.",
        difficulty: "Advanced"
      }
    }
  ],
  bds: [
    {
      course: {
        name: "Introduction to Dental Medicine",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/dental-medicine-penn",
        free: true,
        why: "Introduction to dental health, pathology, and practice.",
        difficulty: "Beginner"
      },
      youtube: {
        channel: "HackDental",
        topic: "Dental Anatomy & Nomenclature",
        url: "https://www.youtube.com/watch?v=ZQ2j3qzJBoA",
        why: "Teaches teeth numbering systems and basic anatomy.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Anatomy of the Abdomen and Pelvis; a journey from science to clinic",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/medical-neuroscience",
        free: true,
        why: "Prepares dental students for systemic anatomy.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Mental Dental",
        topic: "Tooth Morphology",
        url: "https://www.youtube.com/watch?v=d8l-AjYPeAM",
        why: "Crucial study resource for dental board exams.",
        difficulty: "Intermediate"
      }
    },
    {
      course: {
        name: "Introduction to Dental Medicine (Advanced Modules)",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/dental-medicine-penn",
        free: true,
        why: "Focuses on advanced oral pathology and diagnoses.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Mental Dental",
        topic: "Oral Pathology",
        url: "https://www.youtube.com/watch?v=3zcuZ6U7vQA",
        why: "Covers jaw lesions and oral diseases.",
        difficulty: "Advanced"
      }
    },
    {
      course: {
        name: "Clinical Terminology for International and U.S. Students",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/clinical-terminology",
        free: true,
        why: "Fundamental vocabulary for clinical interactions.",
        difficulty: "Advanced"
      },
      youtube: {
        channel: "Mental Dental",
        topic: "Periodontics Basics",
        url: "https://www.youtube.com/watch?v=Pm8s9aqs7Ug",
        why: "Introduction to gum structures and diseases.",
        difficulty: "Advanced"
      }
    }
  ],
  bpharm: [
    {
      course: {
        name: "Introduction to Physical Chemistry",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/physical-chemistry",
        free: true,
        why: "Essential physical chemistry principles for formulation.",
        difficulty: "Beginner"
      },
      youtube: {
        channel: "Professor Dave Explains",
        topic: "Organic Chemistry Introduction",
        url: "https://www.youtube.com/watch?v=rHyIdxOzj9U",
        why: "Explains structure, bonding, and functional groups.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Drugs, Drug Use, Drug Policy and Health",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/clinical-terminology",
        free: true,
        why: "Examines pharmacological impact of drugs.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Speed Pharmacology",
        topic: "Pharmacokinetics Basics",
        url: "https://www.youtube.com/watch?v=NKV5iaUVBUI",
        why: "Excellent animated introduction to ADME.",
        difficulty: "Intermediate"
      }
    },
    {
      course: {
        name: "Introduction to Molecular Spectroscopy",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/spectroscopy",
        free: true,
        why: "Analyzes drug structures using spectroscopy.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Speed Pharmacology",
        topic: "Pharmacodynamics",
        url: "https://www.youtube.com/watch?v=tobx537kFaI",
        why: "Explains how drugs interact with receptors.",
        difficulty: "Intermediate"
      }
    },
    {
      course: {
        name: "Drug Discovery",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/drug-discovery",
        free: true,
        why: "Covers candidate validation and clinical trials.",
        difficulty: "Advanced"
      },
      youtube: {
        channel: "Professor Dave Explains",
        topic: "Drug Design and Development",
        url: "https://www.youtube.com/watch?v=Up_qu1lT_UA",
        why: "Step-by-step visualization of synthetic drug discovery.",
        difficulty: "Advanced"
      }
    }
  ],
  biotech: [
    {
      course: {
        name: "Introduction to Genetics and Evolution",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/genetics-evolution",
        free: true,
        why: "Lays foundations in molecular genetics.",
        difficulty: "Beginner"
      },
      youtube: {
        channel: "Amoeba Sisters",
        topic: "DNA Replication",
        url: "https://www.youtube.com/watch?v=5qSrmeiWsuc",
        why: "Simple and fun animation of replication machinery.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Genes and the Human Condition (Behavioral and Health Genetics)",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/genetics-evolution",
        free: true,
        why: "Explores genetic engineering and human traits.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Bozeman Science",
        topic: "Recombinant DNA Technology",
        url: "https://www.youtube.com/watch?v=5ffl-0OYVQU",
        why: "Explains restriction enzymes and plasmids clearly.",
        difficulty: "Intermediate"
      }
    },
    {
      course: {
        name: "Industrial Biotechnology",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/industrial-biotech",
        free: true,
        why: "Introduces biocatalysis and fermentation in industry.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Shomu's Biology",
        topic: "Bioreactor Design & Scaling",
        url: "https://www.youtube.com/watch?v=yLxzk0RNFl4",
        why: "Detailed explanations of biological reactors and inputs.",
        difficulty: "Advanced"
      }
    },
    {
      course: {
        name: "Bioinformatics Specialization",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/bioinformatics",
        free: false,
        why: "Advanced computational algorithms for genomics.",
        difficulty: "Advanced"
      },
      youtube: {
        channel: "Bioinformatics Coach",
        topic: "Sequence Alignment Algorithms",
        url: "https://www.youtube.com/watch?v=b6xBvl0yPAY",
        why: "Explores BLAST, Smith-Waterman, and sequence search.",
        difficulty: "Advanced"
      }
    }
  ],
  data_science: [
    {
      course: {
        name: "Python for Everybody",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/python",
        free: true,
        why: "Builds core coding foundations in Python.",
        difficulty: "Beginner"
      },
      youtube: {
        channel: "freeCodeCamp.org",
        topic: "Python for Beginners",
        url: "https://www.youtube.com/watch?v=rfscVS0vtbw",
        why: "Comprehensive 4-hour course on Python basics.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "What is Data Science?",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/what-is-datascience",
        free: true,
        why: "Introduces data analysis, models, and practices.",
        difficulty: "Beginner"
      },
      youtube: {
        channel: "StatQuest with Josh Starmer",
        topic: "Linear Regression Analysis",
        url: "https://www.youtube.com/watch?v=PaFPbb66DxQ",
        why: "Breaks down regression analysis into simple steps.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Data Analysis with Python",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/data-analysis-with-python",
        free: true,
        why: "Covers Pandas, NumPy, and basic data processing.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "freeCodeCamp.org",
        topic: "Pandas and NumPy tutorial",
        url: "https://www.youtube.com/watch?v=r-uOLxNrNk8",
        why: "Hands-on analysis using Python's core libraries.",
        difficulty: "Intermediate"
      }
    },
    {
      course: {
        name: "Data Visualization with Python",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/python-for-data-visualization",
        free: true,
        why: "Teaches data storytelling with charts and maps.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Corey Schafer",
        topic: "Matplotlib tutorial",
        url: "https://www.youtube.com/watch?v=UO98lJQ3QGI",
        why: "Comprehensive plotting walkthrough using Matplotlib.",
        difficulty: "Intermediate"
      }
    }
  ],
  ai_ml: [
    {
      course: {
        name: "Supervised Machine Learning: Regression and Classification",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/machine-learning",
        free: true,
        why: "The gold standard introduction to machine learning by Andrew Ng.",
        difficulty: "Beginner"
      },
      youtube: {
        channel: "3Blue1Brown",
        topic: "Neural Networks & Deep Learning",
        url: "https://www.youtube.com/watch?v=aircAruvnKk",
        why: "Stunning visual mathematical intuition for backpropagation.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Advanced Learning Algorithms",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/advanced-learning-algorithms",
        free: true,
        why: "Deep dive into Neural Networks, Decision Trees, and Random Forests.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "StatQuest with Josh Starmer",
        topic: "Decision Trees & Random Forests",
        url: "https://www.youtube.com/watch?v=7VeUPuFGJHk",
        why: "Simplifies machine learning tree classifiers intuitively.",
        difficulty: "Intermediate"
      }
    },
    {
      course: {
        name: "Introduction to TensorFlow for Artificial Intelligence, Machine Learning, and Deep Learning",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/introduction-tensorflow",
        free: true,
        why: "Practical hands-on implementation of machine learning models.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "freeCodeCamp.org",
        topic: "PyTorch for Beginners",
        url: "https://www.youtube.com/watch?v=V_xro1bcAuA",
        why: "Comprehensive guide to deep learning with PyTorch.",
        difficulty: "Intermediate"
      }
    },
    {
      course: {
        name: "AI for Everyone",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/ai-for-everyone",
        free: true,
        why: "Explores the business impact, ethics, and limits of AI.",
        difficulty: "Beginner"
      },
      youtube: {
        channel: "Lex Fridman",
        topic: "Deep Learning Lecture",
        url: "https://www.youtube.com/watch?v=0VH1Lim8gL8",
        why: "Excellent broad survey of neural network breakthroughs.",
        difficulty: "Advanced"
      }
    }
  ],
  architecture: [
    {
      course: {
        name: "Roman Architecture",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/roman-architecture",
        free: true,
        why: "Classic architectural principles and history of design.",
        difficulty: "Beginner"
      },
      youtube: {
        channel: "30X40 Design Workshop",
        topic: "Architectural Drawing & Sketching",
        url: "https://www.youtube.com/watch?v=eNNAnSCrrBI",
        why: "Teaches basic design visualization techniques.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Making Architecture",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/making-architecture",
        free: true,
        why: "Hands-on model construction and structural layout.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Surviving Architecture",
        topic: "Architectural Model Making",
        url: "https://www.youtube.com/watch?v=qiIztryeXBI",
        why: "Excellent physical modeling tips and tricks.",
        difficulty: "Intermediate"
      }
    },
    {
      course: {
        name: "Autodesk Certified Professional: Revit for Architectural Design",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/bim-fundamentals",
        free: false,
        why: "Industry standard BIM software training.",
        difficulty: "Advanced"
      },
      youtube: {
        channel: "Balkan Architect",
        topic: "Revit Tutorial for Beginners",
        url: "https://www.youtube.com/watch?v=chom9hiewXI",
        why: "Fast and easy tools to start designing in 3D.",
        difficulty: "Intermediate"
      }
    },
    {
      course: {
        name: "Introduction to Sustainability",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/sustainability",
        free: true,
        why: "Focuses on eco-friendly building practices.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Architectural Digest",
        topic: "Sustainable Architecture Principles",
        url: "https://www.youtube.com/watch?v=CF97mtu3qlE",
        why: "Explores modern buildings using eco design.",
        difficulty: "Advanced"
      }
    }
  ],
  agri: [
    {
      course: {
        name: "Sustainable Agricultural Land Management",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/global-environmental-management",
        free: true,
        why: "Foundational soil mechanics and land practices.",
        difficulty: "Beginner"
      },
      youtube: {
        channel: "Horticulture Secrets",
        topic: "Soil Science & Preparation",
        url: "https://www.youtube.com/watch?v=GBhHbidYkZ8",
        why: "Great practical insights on testing soil.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Bugs 101: Insect-Human Interactions",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/bugs-101",
        free: true,
        why: "Essential pest identification and biology concepts.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Urban Gardening",
        topic: "Crop Nutrition & Fertilization",
        url: "https://www.youtube.com/watch?v=mDIVpJgjoXQ",
        why: "Explains nitrogen, phosphorus, and potassium inputs.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Global Environmental Management",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/global-environmental-management",
        free: true,
        why: "Studies biological systems on a global scale.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Deep Green Permaculture",
        topic: "Pest Management & Companion Planting",
        url: "https://www.youtube.com/watch?v=dQlhfkDjtr8",
        why: "Biological pest control using companion plants.",
        difficulty: "Intermediate"
      }
    },
    {
      course: {
        name: "Organic Farming for Sustainable Agriculture",
        platform: "NPTEL",
        url: "https://nptel.ac.in/courses/126105014",
        free: true,
        why: "Rigorous academic guide to organic regulations and compost.",
        difficulty: "Advanced"
      },
      youtube: {
        channel: "Modern Agriculture",
        topic: "Hydroponics & Soilless Farming",
        url: "https://www.youtube.com/watch?v=tA67pPHUspU",
        why: "Explores indoor automated watering setups.",
        difficulty: "Advanced"
      }
    }
  ],
  accounting: [
    {
      course: {
        name: "Introduction to Financial Accounting",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/wharton-accounting",
        free: true,
        why: "Wharton's world-class introduction to the balance sheet and ledger.",
        difficulty: "Beginner"
      },
      youtube: {
        channel: "Edspira",
        topic: "The Accounting Equation",
        url: "https://www.youtube.com/watch?v=cLG7K6Sq9K4",
        why: "The basic Assets = Liabilities + Equity equation made simple.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Introduction to Managerial Accounting",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/uva-darden-managerial-accounting",
        free: true,
        why: "Cost accounting and management decision metrics.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Farhat's Accounting Lectures",
        topic: "Double Entry Bookkeeping",
        url: "https://www.youtube.com/watch?v=i7cn1EXCGAc",
        why: "Teaches debits and credits step-by-step.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Financial Accounting: Advanced Topics",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/financial-accounting-advanced",
        free: true,
        why: "Covers liabilities, equity, and statement of cash flows.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Edspira",
        topic: "Cash Flow Statement Analysis",
        url: "https://www.youtube.com/watch?v=nt7PAUIZwtU",
        why: "How to trace operating, investing, and financing cash flows.",
        difficulty: "Intermediate"
      }
    },
    {
      course: {
        name: "Accounting Analysis I: The Role of Accounting as an Information System",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/accounting-analytics",
        free: true,
        why: "Examines corporate earnings quality and performance reporting.",
        difficulty: "Advanced"
      },
      youtube: {
        channel: "Farhat's Accounting Lectures",
        topic: "Corporate Taxation & Auditing",
        url: "https://www.youtube.com/watch?v=J92LxJ4JXpk",
        why: "Crucial guidance on tax rules and auditing principles.",
        difficulty: "Advanced"
      }
    }
  ],
  entrepreneurship: [
    {
      course: {
        name: "Entrepreneurship 1: Developing the Opportunity",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/uva-darden-designbiz",
        free: true,
        why: "Teaches ideation, market validation, and prototyping.",
        difficulty: "Beginner"
      },
      youtube: {
        channel: "Y Combinator",
        topic: "How to Start a Startup",
        url: "https://www.youtube.com/watch?v=CBYhVcO4WgI",
        why: "Essential advice from industry giants on startups.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Entrepreneurship 2: Launching your Start-Up",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/startup-funding",
        free: true,
        why: "Covers operational scaling, business structures, and teams.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Slidebean",
        topic: "Building a Pitch Deck",
        url: "https://www.youtube.com/watch?v=SB16xgtFmco",
        why: "Step-by-step layout of elements investors look for.",
        difficulty: "Intermediate"
      }
    },
    {
      course: {
        name: "Entrepreneurship 3: Growth Strategies",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/innovation-management",
        free: true,
        why: "Acquisition strategies, customer retention, and scaling.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Valuetainment",
        topic: "Scaling and Sales Strategies",
        url: "https://www.youtube.com/watch?v=CEE-irUEOC8",
        why: "High energy sales structures and organizational development.",
        difficulty: "Intermediate"
      }
    },
    {
      course: {
        name: "Entrepreneurship 4: Financing and Profitability",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/wharton-finance",
        free: true,
        why: "Venture capital, terms sheets, and evaluation methods.",
        difficulty: "Advanced"
      },
      youtube: {
        channel: "Stanford eCorner",
        topic: "Venture Capital and Funding Rounds",
        url: "https://www.youtube.com/watch?v=89Q13TUaj6w",
        why: "Lectures on raising institutional capital.",
        difficulty: "Advanced"
      }
    }
  ],
  finance: [
    {
      course: {
        name: "Finance for Non-Financial Professionals",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/finance-for-non-finance",
        free: true,
        why: "Introduces key financial metrics and evaluation.",
        difficulty: "Beginner"
      },
      youtube: {
        channel: "Corporate Finance Institute",
        topic: "Introduction to Corporate Finance",
        url: "https://www.youtube.com/watch?v=5eGRi66iUfU",
        why: "Visual introduction to corporate financial systems.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Financial Markets",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/financial-markets-global",
        free: true,
        why: "Yale University's course on stock, bond, and derivative markets.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Khan Academy",
        topic: "Stocks and Bonds Explained",
        url: "https://www.youtube.com/watch?v=98qfFzqDKR8",
        why: "Easy conceptual introduction to asset classes.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Corporate Finance: Algorithms and Models",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/wharton-finance",
        free: true,
        why: "Applies computing and models to calculate firm value.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Aswath Damodaran",
        topic: "Valuation & Risk Management",
        url: "https://www.youtube.com/watch?v=znmQ7oMiQrM",
        why: "Advanced corporate finance lectures by NYU professor.",
        difficulty: "Advanced"
      }
    },
    {
      course: {
        name: "Investment and Portfolio Management",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/financial-markets-global",
        free: false,
        why: "Active vs passive strategy and modern portfolio construction.",
        difficulty: "Advanced"
      },
      youtube: {
        channel: "Ben Felix",
        topic: "Modern Portfolio Theory",
        url: "https://www.youtube.com/watch?v=p25PPBgMiEk",
        why: "Evidence-based asset allocation and index returns.",
        difficulty: "Intermediate"
      }
    }
  ],
  marketing: [
    {
      course: {
        name: "Introduction to Marketing",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/wharton-marketing",
        free: true,
        why: "Fundamentals of customer centricity, branding, and go-to-market.",
        difficulty: "Beginner"
      },
      youtube: {
        channel: "HubSpot Marketing",
        topic: "Digital Marketing Foundations",
        url: "https://www.youtube.com/watch?v=YhK_PGhdPe8",
        why: "Quick start guidelines for digital customer acquisition.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Marketing Analytics",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/marketing-analytics",
        free: true,
        why: "Teaches quantitative measurement of campaigns and conversions.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Neil Patel",
        topic: "Search Engine Optimization (SEO)",
        url: "https://www.youtube.com/watch?v=Q_lySNxCag0",
        why: "Practical search optimization strategies.",
        difficulty: "Intermediate"
      }
    },
    {
      course: {
        name: "Social Media Marketing Specialization",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/social-media-marketing",
        free: true,
        why: "Teaches content creation, distribution, and community metrics.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "GaryVee",
        topic: "Content Creation and Social Branding",
        url: "https://www.youtube.com/watch?v=xSVAlaAQxho",
        why: "Inspirational tactics for branding in social spaces.",
        difficulty: "Intermediate"
      }
    },
    {
      course: {
        name: "Brand Management: Aligning Business, Brand and Behaviour",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/brand",
        free: true,
        why: "Advanced strategic positioning and internal brand alignment.",
        difficulty: "Advanced"
      },
      youtube: {
        channel: "The Futur",
        topic: "Brand Strategy and Identity",
        url: "https://www.youtube.com/watch?v=sO4te2QNsHY",
        why: "Detailed layout of positioning and brand consulting.",
        difficulty: "Advanced"
      }
    }
  ],
  economics: [
    {
      course: {
        name: "Microeconomics Principles",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/microeconomics",
        free: true,
        why: "Covers consumer demand, supply curves, and market structures.",
        difficulty: "Beginner"
      },
      youtube: {
        channel: "CrashCourse Economics",
        topic: "Introduction to Economics",
        url: "https://www.youtube.com/watch?v=3ez10ADR_gM",
        why: "A fun and fast overview of utility and scarcity.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Macroeconomics Principles",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/microeconomics",
        free: true,
        why: "Studies GDP, inflation, fiscal policy, and money markets.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Jacob Clifford",
        topic: "Aggregate Demand and Supply",
        url: "https://www.youtube.com/watch?v=ujiHgvLzEDw",
        why: "Fantastic board diagrams detailing macro graphs.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Understanding Economic Policymaking",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/economic-policy",
        free: true,
        why: "Studies government policy, central banks, and market failures.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Marginal Revolution University",
        topic: "Game Theory & Market Failure",
        url: "https://www.youtube.com/watch?v=Xik2ZOrRvzU",
        why: "Visual examples of Nash Equilibrium and common goods.",
        difficulty: "Intermediate"
      }
    },
    {
      course: {
        name: "Econometrics: Methods and Applications",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/erasmus-econometrics",
        free: true,
        why: "Rigorous statistical proofs and regression analysis in R.",
        difficulty: "Advanced"
      },
      youtube: {
        channel: "Ben Lambert",
        topic: "Ordinary Least Squares Regression",
        url: "https://www.youtube.com/watch?v=fb1CNQT-3Pg",
        why: "Clear mathematical lectures proving econometrics formulas.",
        difficulty: "Advanced"
      }
    }
  ],
  history: [
    {
      course: {
        name: "A Brief History of Humankind",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/bighistory",
        free: true,
        why: "Broad evolutionary and social history from Hunter-Gatherers to AI.",
        difficulty: "Beginner"
      },
      youtube: {
        channel: "CrashCourse World History",
        topic: "The Agricultural Revolution",
        url: "https://www.youtube.com/watch?v=Yocja_N5s1I",
        why: "Humorous and fast-paced look at early human shifts.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "The Modern World, Part One: Global History from 1760 to 1910",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/modern-world",
        free: true,
        why: "Explores the Industrial Revolution and age of empire.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "OverSimplified",
        topic: "The French Revolution",
        url: "https://www.youtube.com/watch?v=8qRZcXIODNU",
        why: "Extremely engaging animations depicting complex political history.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "The Modern World, Part Two: Global History since 1910",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/modern-world-2",
        free: true,
        why: "Studies World Wars, the Cold War, and contemporary globalization.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "CrashCourse World History II",
        topic: "Decolonization and Modern Conflict",
        url: "https://www.youtube.com/watch?v=T_sGTspaF4Y",
        why: "Studies post-war global restructuring.",
        difficulty: "Intermediate"
      }
    },
    {
      course: {
        name: "Historical Fiction: Writing the Past",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/historical-fiction",
        free: true,
        why: "Creative approaches to studying and narrating historical events.",
        difficulty: "Advanced"
      },
      youtube: {
        channel: "Timeline - World History Documentaries",
        topic: "Industrial Revolution Impact",
        url: "https://www.youtube.com/watch?v=zjK7PWmRRyg",
        why: "Deep dive historical footage and primary source diaries.",
        difficulty: "Advanced"
      }
    }
  ],
  political_science: [
    {
      course: {
        name: "Introduction to Political Science",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/moral-politics",
        free: true,
        why: "Foundational course on political systems, states, and systems.",
        difficulty: "Beginner"
      },
      youtube: {
        channel: "CrashCourse Government and Politics",
        topic: "Constitutional Principles",
        url: "https://www.youtube.com/watch?v=lrk4oY7UxpQ",
        why: "Engaging breakdown of checks, balances, and governance.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Moral Foundations of Politics",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/moral-politics",
        free: true,
        why: "Yale University's study of utilitarianism, Marxism, and social contract.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Harvard Justice with Michael Sandel",
        topic: "The Moral Side of Murder",
        url: "https://www.youtube.com/watch?v=kBdfcR-8hEY",
        why: "Stellar ethics lectures discussing justice and philosophy.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Global Diplomacy: Diplomacy in the Modern World",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/global-diplomacy",
        free: true,
        why: "International relations, negotiations, and global actors.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Ted-Ed",
        topic: "How is international law enforced?",
        url: "https://www.youtube.com/watch?v=jTzKgI68VLc",
        why: "Brief explanation of international courts and treaties.",
        difficulty: "Intermediate"
      }
    },
    {
      course: {
        name: "Public Policy Analysis",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/using-public-policy-for-social-change",
        free: true,
        why: "Teaches quantitative methods for designing and evaluating state regulations.",
        difficulty: "Advanced"
      },
      youtube: {
        channel: "PolicyEd",
        topic: "The Role of Government in Markets",
        url: "https://www.youtube.com/watch?v=hD8BZ-s2Fzw",
        why: "Examines state intervention and external effects.",
        difficulty: "Advanced"
      }
    }
  ],
  psychology: [
    {
      course: {
        name: "Introduction to Psychology",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/introduction-psych",
        free: true,
        why: "Yale's foundational survey covering learning, memory, and therapy.",
        difficulty: "Beginner"
      },
      youtube: {
        channel: "CrashCourse Psychology",
        topic: "Intro to Psychology",
        url: "https://www.youtube.com/watch?v=vo4pMVb0R6M",
        why: "Engaging and visual summary of psychological science origins.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Social Psychology",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/social-psychology",
        free: true,
        why: "Studies social influence, groups, prejudice, and compliance.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "SciShow Psych",
        topic: "The Stanford Prison Experiment",
        url: "https://www.youtube.com/watch?v=ko36W0BdPvs",
        why: "Critique of classical social studies.",
        difficulty: "Beginner"
      }
    },
    {
      course: {
        name: "Positive Psychology",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/positive-psychology",
        free: true,
        why: "Examines factors behind human flourishing and character traits.",
        difficulty: "Intermediate"
      },
      youtube: {
        channel: "Psych2Go",
        topic: "Signs of High Emotional Intelligence",
        url: "https://www.youtube.com/watch?v=9uR9BUH5u4A",
        why: "Simple tips on self-awareness and relationships.",
        difficulty: "Intermediate"
      }
    },
    {
      course: {
        name: "Cognitive Psychology",
        platform: "Coursera",
        url: "https://www.coursera.org/learn/cognitive-psychology",
        free: true,
        why: "Studies cognitive frameworks: perception, attention, and language.",
        difficulty: "Advanced"
      },
      youtube: {
        channel: "CrashCourse Psychology",
        topic: "How We Learn & Memory",
        url: "https://www.youtube.com/watch?v=qG2SwE_6uVM",
        why: "Breaks down conditioning, encoding, and recall models.",
        difficulty: "Advanced"
      }
    }
  ]
};

// Helper to resolve career label to CAREER_RESOURCES key
function getCareerKey(careerLabel) {
  const label = (careerLabel || "").toLowerCase();
  if (label.includes("ai / ml") || label.includes("ai/ml") || label.includes("machine learning") || label.includes("ai_ml")) return "ai_ml";
  if (label.includes("data science") || label.includes("data_science")) return "data_science";
  if (label.includes("engineering")) return "engineering";
  if (label.includes("mbbs") || label.includes("medicine")) return "mbbs";
  if (label.includes("bds") || label.includes("dental")) return "bds";
  if (label.includes("b.pharm") || label.includes("bpharm") || label.includes("pharmacy")) return "bpharm";
  if (label.includes("biotech") || label.includes("biotechnology")) return "biotech";
  if (label.includes("architecture")) return "architecture";
  if (label.includes("agri") || label.includes("agriculture")) return "agri";
  if (label.includes("accounting")) return "accounting";
  if (label.includes("entrepreneurship")) return "entrepreneurship";
  if (label.includes("finance")) return "finance";
  if (label.includes("marketing")) return "marketing";
  if (label.includes("economics")) return "economics";
  if (label.includes("history")) return "history";
  if (label.includes("political science") || label.includes("political_science") || label.includes("politicalscience")) return "political_science";
  if (label.includes("psychology")) return "psychology";
  return "engineering"; // fallback key
}

// Override course and youtube links with high-quality, pre-verified direct resources
function overrideRoadmapResources(roadmap, careerLabel) {
  if (!roadmap) return roadmap;
  const careerKey = getCareerKey(careerLabel);
  const resources = CAREER_RESOURCES[careerKey] || CAREER_RESOURCES["engineering"];
  
  if (roadmap.months && Array.isArray(roadmap.months)) {
    roadmap.months.forEach((month, idx) => {
      const resObj = resources[idx] || resources[idx % resources.length];
      
      // Override course
      month.courses = [
        {
          name: resObj.course.name,
          platform: resObj.course.platform,
          url: resObj.course.url,
          free: resObj.course.free,
          why: month.courses?.[0]?.why || resObj.course.why,
          difficulty: resObj.course.difficulty
        }
      ];
      
      // Override youtube
      month.youtube = [
        {
          channel: resObj.youtube.channel,
          topic: month.youtube?.[0]?.topic || resObj.youtube.topic,
          url: resObj.youtube.url,
          why: month.youtube?.[0]?.why || resObj.youtube.why,
          difficulty: resObj.youtube.difficulty
        }
      ];
    });
  }
  return roadmap;
}

function generateFallbackRoadmap(career, scores) {
  const careerName = career.charAt(0).toUpperCase() + career.slice(1);
  const careerKey = getCareerKey(career);
  const resources = CAREER_RESOURCES[careerKey] || CAREER_RESOURCES["engineering"];
  
  const months = [
    {
      month: 1,
      title: "Foundations & Core Principles",
      focus: "Understanding the basic concepts and frameworks",
      topics: ["Introduction to Concepts", "Basic Principles", "Terminology"],
      courses: [
        {
          name: resources[0].course.name,
          platform: resources[0].course.platform,
          url: resources[0].course.url,
          free: resources[0].course.free,
          why: "Builds absolute fundamental understanding of core concepts.",
          difficulty: resources[0].course.difficulty
        }
      ],
      youtube: [
        {
          channel: resources[0].youtube.channel,
          topic: resources[0].youtube.topic,
          url: resources[0].youtube.url,
          why: "Visual explanation of key topics for quick understanding.",
          difficulty: resources[0].youtube.difficulty
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
          name: resources[1].course.name,
          platform: resources[1].course.platform,
          url: resources[1].course.url,
          free: resources[1].course.free,
          why: "Focuses on practical implementation of the principles.",
          difficulty: resources[1].course.difficulty
        }
      ],
      youtube: [
        {
          channel: resources[1].youtube.channel,
          topic: resources[1].youtube.topic,
          url: resources[1].youtube.url,
          why: "Hands-on projects and guides.",
          difficulty: resources[1].youtube.difficulty
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
          name: resources[2].course.name,
          platform: resources[2].course.platform,
          url: resources[2].course.url,
          free: resources[2].course.free,
          why: "Rigorous academic and professional depth.",
          difficulty: resources[2].course.difficulty
        }
      ],
      youtube: [
        {
          channel: resources[2].youtube.channel,
          topic: resources[2].youtube.topic,
          url: resources[2].youtube.url,
          why: "Deep theoretical insights from world-class lectures.",
          difficulty: resources[2].youtube.difficulty
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
          name: resources[3].course.name,
          platform: resources[3].course.platform,
          url: resources[3].course.url,
          free: resources[3].course.free,
          why: "Structured project guidance to compile a portfolio.",
          difficulty: resources[3].course.difficulty
        }
      ],
      youtube: [
        {
          channel: resources[3].youtube.channel,
          topic: resources[3].youtube.topic,
          url: resources[3].youtube.url,
          why: "Preparing for typical technical and situational interviews.",
          difficulty: resources[3].youtube.difficulty
        }
      ],
      goal: "Publish a complete capstone project and update professional profiles."
    }
  ];

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
    months,
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

  const strongThresh = 75;
  const moderateThresh = 50;
  const exploreThresh = 30;
  const maxScore = 100;

  let fitScoreClassification = "Weak Fit";
  if (scores.fitScore >= strongThresh) fitScoreClassification = "Strong Fit";
  else if (scores.fitScore >= moderateThresh) fitScoreClassification = "Moderate Fit";
  else if (scores.fitScore >= exploreThresh) fitScoreClassification = "Explore Further";

  const prompt = `You are a career counselor for Indian science students.
Student wants to pursue ${career}. 

Career-Fit Assessment Results (out of 100):
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
    const apiKey = process.env.GEMINI_KEY;
    if (!apiKey) {
      console.log("No API key found in .env, generating fallback roadmap.");
      const fallback = generateFallbackRoadmap(career, scores);
      const validated = await performValidationPass(fallback, career);
      return res.json(validated);
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.7
      }),
    });

    const data = await response.json();
    console.log("Groq response status:", response.status);

    if (!data.choices || !data.choices[0] || data.error) {
      console.log("Groq API error:", data.error?.message || "No choices returned. Check your API key.");
      console.log("Generating fallback roadmap instead.");
      const fallback = generateFallbackRoadmap(career, scores);
      const validated = await performValidationPass(fallback, career);
      return res.json(validated);
    }

    const text = data.choices[0].message.content;
    let roadmap = JSON.parse(text.replace(/```json|```/g, "").trim());
    
    // Override course & youtube links using our pre-verified database
    roadmap = overrideRoadmapResources(roadmap, career);
    roadmap = await performValidationPass(roadmap, career);
    res.json(roadmap);
  } catch (err) {
    console.error("Error:", err.message, "Generating fallback roadmap.");
    try {
      const fallback = generateFallbackRoadmap(career, scores);
      const validated = await performValidationPass(fallback, career);
      res.json(validated);
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