# Mindstix (Meraki Path) — Career Guidance System

> **AI-Powered Career Evaluation Platform for Indian Students**
> Live: [https://meraki-path.onrender.com](https://meraki-path.onrender.com)

---

## 📌 Project Summary (Prompt)

**Mindstix** is a full-stack AI-powered career evaluation platform built with **React + Vite** (frontend) and **Express.js** (backend). It helps **Indian students after 10th/12th standard** assess their alignment with **17 different career paths** across **Science, Commerce, and Arts** streams using a **40-question, 6-category assessment**. Based on the student's scores across **7 dimensions** (Analytical Thinking, Problem Solving, Technical Curiosity, Learning Commitment, Persistence Level, Academic Readiness, Financial Capacity), it generates an **AI-personalized 4-month preparation roadmap** with curated Coursera courses and YouTube resources. The AI backend is powered by **Groq API (LLaMA 3.3 70B)** and includes a pre-verified resource database of 17×4 = 68 course+video pairs covering every career path.

---

## 🏗️ Application Architecture

```
Meraki-Path/
├── backend/                          # Express.js API Server
│   ├── .env                          # GEMINI_KEY (Groq API key)
│   ├── server.js                     # Main server (1660 lines) — API + static serving
│   ├── package.json                  # Backend dependencies
│   ├── parse_all_pdfs.js             # PDF parser utility
│   ├── read_pdf_keys.js              # PDF key reader
│   ├── read_pdf_sample.js            # PDF sample reader
│   ├── test_bing_search.js           # Bing search test utility
│   └── test_parser.js                # Parser test utility
│
├── frontend/                         # React + Vite Client
│   ├── .env                          # VITE_GEMINI_KEY
│   ├── index.html                    # SPA entry point
│   ├── vite.config.js                # Vite config with /api proxy to :3001
│   ├── package.json                  # Frontend dependencies
│   └── src/
│       ├── main.jsx                  # React DOM entry
│       ├── App.jsx                   # Main app (1886 lines) — ALL components
│       ├── App.css                   # Component-specific styles
│       ├── index.css                 # Global styles + dark/light mode
│       ├── science_quizzes.js        # 9 science career quizzes (9384 lines, 40 Q each)
│       └── commerce_arts_quizzes.js  # 8 commerce/arts quizzes (4013 lines, 40 Q each)
│
├── science questions/                # Source markdown files for science quizzes
│   ├── AIML_Self_Realization_Assessment.md
│   ├── Agriculture_Self_Realization_Assessment.md
│   ├── Architecture_Self_Realization_Assessment.md
│   ├── BDS_Self_Realization_Assessment.md
│   ├── BPharm_Self_Realization_Assessment.md
│   ├── Biotechnology_Self_Realization_Assessment.md
│   ├── DataScience_Self_Realization_Assessment.md
│   ├── Engineering_Career_Discovery_Assessment.md
│   ├── MBBS_Self_Realization_Assessment.md
│   └── general science questions.md
│
├── commerce and arts questions/      # Source PDFs for commerce/arts quizzes
│   ├── Accounting.pdf
│   ├── Economics.pdf
│   ├── Entrepreneurship.pdf
│   ├── Finance.pdf
│   ├── History.pdf
│   ├── Marketing.pdf
│   ├── PoliticalScience.pdf
│   └── Psychology.pdf
│
├── General Questions/                # General aptitude PDFs
│   └── arts/
│       └── GeneralAptitude_Coms&Arts.pdf
│
├── env/                              # Environment file templates
│   ├── frontend.env.example
│   └── backend.env.example
│
├── Dockerfile                        # Multi-stage Docker build
├── render.yaml                       # Render deployment config
├── package.json                      # Root monorepo scripts
└── README.md                         # Project documentation
```

---

## 🧩 Required Components for the Career Guidance System

### Frontend Components (all in `App.jsx`)

| # | Component | Description | Props |
|---|-----------|-------------|-------|
| 1 | **`App`** (default export) | Root app shell — manages all state (page, career, stream, answers, theme) with localStorage persistence | — |
| 2 | **`Navbar`** | Sticky top navigation bar with brand logo, page links (Home, Careers, About), dark/light toggle, and "Get Started" CTA | `setPage`, `theme`, `toggleTheme` |
| 3 | **`LandingPage`** | Hero section with tagline, stats row (17 careers, 40 questions, 7 dimensions, AI roadmap), features grid, and "How It Works" step cards | `setPage`, `theme` |
| 4 | **`StreamSelectionPage`** | Stream picker — 3 large cards for Science, Commerce, Arts & Humanities with descriptions and hover effects | `setPage`, `setSelectedStream`, `theme` |
| 5 | **`CareersPage`** | Career card grid filtered by selected stream — user picks one of the available careers within that stream | `setPage`, `selectedStream`, `setSelectedCareer`, `setAnswers`, `theme` |
| 6 | **`QuizPage`** | Full assessment interface with question card (left) + sidebar (right) containing progress tracker and question navigator. Supports keyboard nav, review screen, exit confirmation modal | `career`, `setSelectedCareer`, `setPage`, `answers`, `setAnswers`, `theme` |
| 7 | **`ResultPage`** | Assessment report — overall fit score circle, verdict, 7 score bars, financial analysis grid (8 metrics), scholarship section (general, govt, girls-specific) | `career`, `answers`, `setPage`, `theme` |
| 8 | **`RoadmapPage`** | AI-generated 4-month roadmap with month cards containing topics, courses (with difficulty tags + "Open" links), YouTube resources (with "Watch" links), and monthly goals | `career`, `answers`, `setPage`, `theme` |
| 9 | **`AlternativesPage`** | Alternative career comparison — side-by-side table + individual cards with "Assess for [Career]" buttons to start a new assessment | `career`, `answers`, `setAnswers`, `setPage`, `setSelectedCareer`, `theme` |
| 10 | **`AboutPage`** | "How It Works" 4-step guide with numbered step cards | `theme` |
| 11 | **`ScoreBar`** | Reusable animated progress bar for individual score dimensions with label, icon, level badge, and percentage | `label`, `score`, `color`, `icon` |

### Frontend Utilities & Data (in `App.jsx`)

| # | Utility | Description |
|---|---------|-------------|
| 12 | **`CAREERS`** array | 17 career definitions with `id`, `stream`, `label`, `icon`, `desc`, `fin` (financial data: govt/pvt fees, hostel, coaching, duration, salary, ROI), and `alts` (alternative career IDs) |
| 13 | **`CATEGORIES`** array | 6 assessment categories: Aptitude & Reasoning, Academic Readiness, Commitment Level, Financial Assessment, Soft Skills, Career Expectations |
| 14 | **`SCHOLARSHIPS`** object | Curated scholarship lists: `general` (4), `govt` (4), `girls` (5) |
| 15 | **`s(theme)`** function | Complete style factory generating ~40 style objects for dark/light mode theming |
| 16 | **`calcScores(answers, career)`** function | Score calculator producing 7 dimension scores + overall fitScore from quiz answers |
| 17 | **`fetchRoadmap(career, scores)`** function | API caller that POSTs to `/api/roadmap` |

### Quiz Data Files

| # | File | Description |
|---|------|-------------|
| 18 | **`science_quizzes.js`** | `SCIENCE_QUIZZES` — 9 career quizzes × 40 questions each (360 total science MCQs) |
| 19 | **`commerce_arts_quizzes.js`** | `COMMERCE_ARTS_QUIZZES` — 8 career quizzes × 40 questions each (320 total commerce/arts MCQs) |

### Backend Components (all in `server.js`)

| # | Component | Description |
|---|-----------|-------------|
| 20 | **Express Server** | Main API server on port 3001 with CORS, JSON parsing, static file serving |
| 21 | **`POST /api/roadmap`** | Main AI endpoint — receives career + scores, generates roadmap via Groq API |
| 22 | **`CAREER_RESOURCES`** | Pre-verified database of 17 careers × 4 resource pairs (68 course + 68 YouTube = 136 curated links) |
| 23 | **`validateUrl(url)`** | URL validator — HEAD/GET with fallback, YouTube oEmbed check, timeout handling |
| 24 | **`performValidationPass(roadmap)`** | Validates all URLs in a roadmap, replaces broken ones with fallbacks |
| 25 | **`overrideRoadmapResources(roadmap, career)`** | Overrides AI-generated resource links with pre-verified ones from `CAREER_RESOURCES` |
| 26 | **`generateFallbackRoadmap(career, scores)`** | Generates complete fallback roadmap when Groq API fails |
| 27 | **`getCareerKey(label)`** | Fuzzy career label → resource key resolver |
| 28 | **Wildcard Route** | `GET /*splat` — serves React's `index.html` for client-side routing |

---

## 📋 Complete MCQ Inventory

### Science Stream — 9 Careers × 40 Questions = **360 MCQs**

| Career | Quiz Key | Questions | Category Breakdown |
|--------|----------|-----------|-------------------|
| 🌾 Agriculture | `agri` | 40 | Biology & Nature Observation (6), Chemistry in Everyday Agriculture (6), Physics in Farming & Natural Systems (6), Agricultural Aptitude & Systems Thinking (6), Logical & Analytical Reasoning (6), Financial (4), Commitment (6) |
| ⚙️ Engineering | `engineering` | 40 | Academic Readiness (6), Aptitude & Reasoning (6), Technical Curiosity (6), Problem Solving (6), Persistence (6), Financial (4), Commitment (6) |
| 🩺 MBBS | `mbbs` | 40 | Academic (6), Aptitude (6), Curiosity (6), Problem Solving (6), Persistence (6), Financial (4), Commitment (6) |
| 🦷 BDS | `bds` | 40 | Academic (6), Aptitude (6), Curiosity (6), Problem Solving (6), Persistence (6), Financial (4), Commitment (6) |
| 💊 B.Pharm | `bpharm` | 40 | Academic (6), Aptitude (6), Curiosity (6), Problem Solving (6), Persistence (6), Financial (4), Commitment (6) |
| 🧬 Biotechnology | `biotech` | 40 | Academic (6), Aptitude (6), Curiosity (6), Problem Solving (6), Persistence (6), Financial (4), Commitment (6) |
| 📊 Data Science | `data_science` | 40 | Academic (6), Aptitude (6), Curiosity (6), Problem Solving (6), Persistence (6), Financial (4), Commitment (6) |
| 🤖 AI / ML | `ai_ml` | 40 | Academic (6), Aptitude (6), Curiosity (6), Problem Solving (6), Persistence (6), Financial (4), Commitment (6) |
| 🏛️ Architecture | `architecture` | 40 | Academic (6), Aptitude (6), Curiosity (6), Problem Solving (6), Persistence (6), Financial (4), Commitment (6) |

### Commerce & Arts Stream — 8 Careers × 40 Questions = **320 MCQs**

| Career | Quiz Key | Questions | Subject Focus |
|--------|----------|-----------|---------------|
| 📊 Accounting | `accounting` | 40 | Financial record-keeping, assets/liabilities, depreciation, revenue recognition, accounting equation, auditing ethics |
| 📈 Economics | `economics` | 40 | Opportunity cost, supply/demand, price signals, scarcity, fiscal policy, inflation, trade-offs, econometrics |
| 💡 Entrepreneurship | `entrepreneurship` | 40 | Market validation, scaling, pitch decks, funding, business models, revenue, customer acquisition |
| 💰 Finance | `finance` | 40 | Corporate finance, investment, portfolio theory, stocks/bonds, risk/return, financial markets |
| 📜 History | `history` | 40 | Source analysis, historical causation, periodization, historiography, primary vs secondary evidence |
| 📢 Marketing | `marketing` | 40 | Brand strategy, digital marketing, SEO, consumer behavior, market segmentation, advertising |
| 🏛️ Political Science | `political_science` | 40 | Constitutional principles, governance, international relations, public policy, political theory |
| 🧠 Psychology | `psychology` | 40 | Social psychology, cognitive frameworks, positive psychology, memory, emotional intelligence |

### Total MCQ Count: **680 Questions** (360 Science + 320 Commerce/Arts)

### MCQ Question Format
Each question follows this structure:
```javascript
{
  "cat": "academic|aptitude|commitment|expectation|softskills|financial",
  "q": "Question text",
  "opts": [
    { "t": "Option text", "s": 1-4 },  // s = score weight (1=lowest, 4=highest)
    { "t": "Option text", "s": 1 },
    { "t": "Option text", "s": 1 },
    { "t": "Option text", "s": 1 }
  ],
  "categoryName": "Display name of category",
  "correctAnswer": "A|B|C|D|Any",
  "whyMatters": "Why this question matters",
  "insight": "What it reveals"
}
```

---

## 👥 Target Users of This Application

### Primary Users

| User Type | Description | How They Use Mindstix |
|-----------|-------------|----------------------|
| 🎓 **10th Std Students** | Students who have completed 10th standard and need to choose between Science/Commerce/Arts streams | Take the general assessment to discover which stream and career aligns with their natural aptitude |
| 📚 **12th Std Students** | Students about to enter college who need career direction | Take career-specific 40-question assessments to evaluate fit, then use AI roadmap for preparation |
| 👨‍👩‍👧 **Parents** | Parents of students exploring career options and costs | Review financial analysis (govt vs pvt fees, ROI, salary projections), scholarship opportunities, and alternative careers |
| 👩‍🏫 **School Counselors** | Career guidance counselors in Indian schools | Use the platform as a structured assessment tool during counseling sessions; review 7-dimensional reports with students |
| 👩 **Girl Students** | Female students looking for financial support | Access dedicated section on girl-specific scholarships (AICTE Pragati, Vigyan Jyoti, WOS-C, etc.) |

### Secondary Users

| User Type | Description |
|-----------|-------------|
| 🏫 **Coaching Centers** | Can use the assessment to guide students toward appropriate career paths before enrollment |
| 📱 **Self-learners** | Students independently exploring career options can use the AI roadmap as a study plan |
| 🌐 **Rural/Tier-2/3 Students** | Students with limited access to career counselors benefit from AI-generated personalized guidance |

---

## 🤖 AI Integration Details

| Component | Detail |
|-----------|--------|
| **AI Provider** | Groq API (cloud inference) |
| **Model** | `llama-3.3-70b-versatile` (Meta LLaMA 3.3 70B) |
| **API Endpoint** | `https://api.groq.com/openai/v1/chat/completions` |
| **API Key Env Var** | `GEMINI_KEY` (stored in `backend/.env`) |
| **Max Tokens** | 2000 |
| **Temperature** | 0.7 |
| **Fallback** | Auto-generates a complete roadmap using pre-verified resources if API fails |
| **Resource Override** | All AI-generated course/YouTube links are replaced with pre-verified URLs from `CAREER_RESOURCES` |
| **URL Validation** | All roadmap URLs are validated via HEAD/GET requests with 4-second timeouts |

### AI Prompt Structure
The AI receives:
- Student's chosen career
- 7 assessment scores (Analytical, Problem Solving, Curiosity, Commitment, Persistence, Academic, Financial)
- Fit score classification (Strong / Moderate / Explore Further / Weak)
- Instructions to generate a 4-month personalized roadmap with courses, YouTube resources, certifications, scholarships, and tips

---

## 🎨 Theming & Styling

| Feature | Implementation |
|---------|---------------|
| **Dark Mode** | Purple/violet gradient palette (`#8B5CF6`, `#A855F7`, `#C084FC`) with `Space Grotesk` font |
| **Light Mode** | Blue/teal palette (`#2563EB`, `#38bdf8`, `#14B8A6`) with `Segoe UI` font |
| **Toggle** | Global theme toggle in navbar, persisted via React state |
| **Animations** | CSS cubic-bezier transitions, hover glow effects, card elevation, button scale transforms |
| **Layout** | Responsive CSS Grid/Flexbox, mobile-friendly with `clamp()` font sizes |

---

## 📊 Scoring System

### 7 Assessment Dimensions (out of 100%)

| # | Dimension | What It Measures |
|---|-----------|-----------------|
| 1 | **Analytical Thinking** | Logical reasoning and pattern recognition |
| 2 | **Problem Solving** | Approach to complex problems and troubleshooting |
| 3 | **Technical Curiosity** | Interest in exploring how things work |
| 4 | **Learning Commitment** | Dedication to study and continuous learning |
| 5 | **Persistence Level** | Ability to stay focused through challenges |
| 6 | **Academic Readiness** | Preparedness for academic rigor |
| 7 | **Financial Capacity** | Financial readiness for education costs |

### Fit Score Classification

| Score Range | Classification | Verdict |
|-------------|---------------|---------|
| 75–100 | Strong Fit | "High Career Alignment 🌟" |
| 50–74 | Moderate Fit | "Good Career Alignment Detected ✅" |
| 30–49 | Explore Further | "Strong Analytical Potential with Room for Refinement 📈" |
| 0–29 | Weak Fit | "Emerging Aptitude for Development 💡" |

---

## 💰 Financial Data (per career)

Each of the 17 careers includes:
- **Government College Fees** (annual)
- **Private College Fees** (total)
- **Hostel/Living Costs** (annual)
- **Coaching/Prep Costs**
- **Duration** (years)
- **Starting Salary** (per annum)
- **Long-term Salary** (per annum)
- **ROI Rating** (Low / Medium / High / Very High)

---

## 🎓 Pre-Verified Learning Resources (17 Careers × 4 Months)

Each career has 4 verified resource pairs (1 course + 1 YouTube per month):

| Career | Month 1 Course | Month 1 YouTube |
|--------|---------------|-----------------|
| Engineering | Engineering Mechanics (Coursera) | Jeff Hanson — Statics |
| MBBS | Medical Neuroscience (Coursera) | Sam Webster — Anatomy |
| BDS | Dental Medicine (Coursera) | HackDental — Dental Anatomy |
| B.Pharm | Physical Chemistry (Coursera) | Professor Dave — Organic Chem |
| Biotechnology | Genetics & Evolution (Coursera) | Amoeba Sisters — DNA |
| Data Science | Python for Everybody (Coursera) | freeCodeCamp — Python |
| AI / ML | Machine Learning (Coursera) | 3Blue1Brown — Neural Networks |
| Architecture | Roman Architecture (Coursera) | 30X40 Design — Sketching |
| Agriculture | Land Management (Coursera) | Horticulture Secrets — Soil |
| Accounting | Financial Accounting (Coursera) | Edspira — Accounting Eq. |
| Entrepreneurship | Developing Opportunity (Coursera) | Y Combinator — Startups |
| Finance | Finance for Non-Finance (Coursera) | CFI — Corporate Finance |
| Marketing | Intro to Marketing (Coursera) | HubSpot — Digital Marketing |
| Economics | Microeconomics (Coursera) | CrashCourse — Economics |
| History | Brief History of Humankind (Coursera) | CrashCourse — Ag. Revolution |
| Political Science | Moral Politics (Coursera) | CrashCourse — Government |
| Psychology | Intro to Psychology (Coursera) | CrashCourse — Psychology |

*Each career also has Month 2 (Intermediate), Month 3 (Advanced), and Month 4 (Portfolio/Assessment) resources.*

---

## 🚀 Deployment & Infrastructure

| Component | Technology |
|-----------|------------|
| **Frontend** | React 19 + Vite 8 |
| **Backend** | Express 5 + Node.js |
| **AI** | Groq API (LLaMA 3.3 70B) |
| **Hosting** | Render (free tier) |
| **Docker** | Multi-stage Dockerfile (node:20-alpine) |
| **Port** | 3001 (production) |
| **Dev Proxy** | Vite proxies `/api` → `localhost:3001` |

### Dependencies

**Backend**: `express`, `cors`, `dotenv`, `node-fetch`, `pdf-parse`
**Frontend**: `react`, `react-dom`, `@vitejs/plugin-react`, `vite`, `eslint`
**Root**: `concurrently` (for parallel dev servers)

---

## 🔑 Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `GEMINI_KEY` | `backend/.env` | Groq API key for roadmap generation |
| `VITE_GEMINI_KEY` | `frontend/.env` | Frontend API key (currently unused by app logic) |
| `PORT` | System/Render | Server port (default: 3001) |

---

## 📝 State Management

All application state is managed via React `useState` hooks with `localStorage` persistence:

| State | Storage Key | Purpose |
|-------|------------|---------|
| `page` | `career_reality_page` | Current page/view |
| `selectedStream` | `career_reality_stream` | Selected stream (science/commerce/arts) |
| `selectedCareer` | `career_reality_career` | Selected career ID |
| `answers` | `career_reality_answers` | Quiz answer array |
| `current` | `career_reality_current_q` | Current question index |
| `showReview` | `career_reality_show_review` | Review screen visibility |

---

*Last updated: June 2026*
*Project: Mindstix (Meraki Path) by shruti053*
