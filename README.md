# Mindstix (Meraki Path)

**Live Site:** [https://mindstix-31mu.onrender.com](https://mindstix-31mu.onrender.com)

[![Deploy to Render](https://render.com/images/deploy-to-render.svg)](https://render.com/deploy?repo=https://github.com/shruti053/Career-counselling)

**Mindstix** is an AI-powered career evaluation platform that helps students assess their alignment with 17 different career paths across Science, Commerce, and Arts using a 6-category assessment. It provides an encouraging, AI-personalized 4-month preparation roadmap with curated educational resources.

---

## 📁 Repository Structure

```
Meraki-Path/ (repository root)
├── backend/                  # Express.js backend server
│   ├── .env                  # Local secret configuration (gitignored)
│   ├── package-lock.json
│   ├── package.json
│   └── server.js             # Express app serving client builds & Groq API
├── frontend/                 # React + Vite client application
│   ├── .env                  # Local environment file (gitignored)
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── public/
│   ├── src/
│   └── vite.config.js        # Vite config with dev API proxy
├── env/                      # Setup template environment files
│   ├── frontend.env.example
│   └── backend.env.example
├── .gitignore                # Repository-wide ignore rules
└── README.md                 # Setup and project guide (this file)
```

---

## 🚀 Production Deployment

This project is configured as a single full-stack Node.js application. The Express backend handles the API endpoints under `/api` and serves the compiled React frontend static files for all other requests. This enables deployment of both frontend and backend as a single service under a single production URL.

### Prerequisites

For all deployments, ensure you set the environment variable:
- `GEMINI_KEY`: Your Groq API key (used by backend).

---

### Option 1: Standard Full-Stack Node.js Deployment (Render, Heroku, Railway)

Many hosting platforms can automatically deploy this application directly from your GitHub repository using the unified scripts in the root `package.json`.

#### Render Deployment Steps:
1. Sign in to [Render](https://render.com) and click **New > Web Service**.
2. Connect your GitHub repository (`shruti053/Meraki-Path`).
3. Configure the service settings:
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. Under **Environment**, add the environment variable:
   - `GEMINI_KEY`: `your_actual_groq_api_key`
5. Click **Deploy Web Service**. Render will build the React frontend, install backend dependencies, and run the Express app under a single URL!

#### Railway Deployment Steps:
1. Go to [Railway](https://railway.app) and create a **New Project > Deploy from GitHub repo**.
2. Select your repository.
3. Railway will automatically detect the root `package.json` scripts.
4. Go to **Variables** and add:
   - `GEMINI_KEY`: `your_actual_groq_api_key`
5. The project will automatically build and start under a single generated domain.

---

### Option 2: Docker Containerized Deployment (Railway, Render, Fly.io, Cloud Run)

If you prefer containerized deployments, the repository includes a multi-stage `Dockerfile` that builds and runs the application in a lightweight container.

1. Build the Docker image locally:
   ```bash
   docker build -t mindstix .
   ```
2. Run the container:
   ```bash
   docker run -p 3001:3001 -e GEMINI_KEY="your_api_key" mindstix
   ```
3. Your full-stack application will be active at `http://localhost:3001`.
