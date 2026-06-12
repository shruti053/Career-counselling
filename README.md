# Career Reality AI (Meraki Path)

**Career Reality AI** is an AI-powered career evaluation platform that helps science students assess their alignment with 15 different career paths using a 6-category assessment. It provides an encouraging, AI-personalized 4-month preparation roadmap with curated educational resources.

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


