<div align="center">

# 🎯 HireLense AI

### *Your first real interview, before the real one.*

**A next-generation AI resume parsing, ATS benchmarking, and candidate intelligence platform.**

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Upstash_Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://upstash.com)
[![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://www.langchain.com)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

[Explore Features](#-key-features) • [Application Screenshots](#-application-screenshots) • [Architecture](#-high-level-system-architecture) • [Getting Started](#-installation--setup) • [API Docs](backend/README.md)

</div>

---

## 📌 Project Overview

**HireLense AI** is an enterprise-grade applicant evaluation platform designed to bridge the gap between job candidates and modern Applicant Tracking Systems (ATS). 

By combining **FastAPI**, **PyMuPDF**, and **Groq-accelerated LLMs (Qwen 2.5 / LangChain)**, HireLense extracts structural content from PDF resumes and evaluates it deterministically against targeted Job Descriptions (JDs). It identifies matched skills, uncovers critical keyword gaps, audits project depth, and assigns an objective ATS compatibility score before candidates submit their applications.

---

## ❓ The Problem Statement

Traditional hiring funnels rely heavily on algorithmic keyword matching and automated resume filters:
1. **The "Black Box" ATS Filter:** Up to 75% of qualified resumes are rejected before human review due to formatting mismatches or missing synonyms.
2. **Generic Feedback Tools:** Existing tools offer vague advice without evaluating specific technical stack depth, production metrics, or target job requirements.
3. **Subjective Manual Reviews:** Candidates lack an objective, evidence-based rubric to benchmark their technical experience against real job descriptions.

**HireLense AI** solves this by delivering an automated, evidence-based recruiter assessment with actionable recommendations in seconds.

---

## ✨ Key Features

- **📄 Binary PDF Parsing with PyMuPDF:** High-speed, memory-efficient PDF text extraction utilizing low-level C-based stream reading without third-party OCR delays.
- **🎯 Deterministic ATS Scoring Rubric:** Objective score (0–100) calculated using weighted scoring across technical skills (35%), experience (25%), project depth (20%), education (10%), and keyword alignment (10%).
- **⚖️ Side-by-Side Dual-Column Workbench:** Desktop-optimized dual-pane workspace pairing drag-and-drop resume ingestion with custom target Job Description inputs.
- **📊 Interactive SaaS Analytics Dashboard:**
  - Dynamic **AtsScoreCircle** animated meter.
  - **Chart.js Doughnut Charts** breaking down matched vs. missing skills.
  - **Chart.js Gradient Line Charts** scoring project complexity.
  - Evidence-based **Positives & Negatives Audit Cards**.
  - **Prioritized Improvement Matrix** categorized by priority (`HIGH`, `MEDIUM`, `LOW`).
- **🔐 Multi-Method Authentication:**
  - **Two-Phase Registration:** 6-digit numeric email OTP delivered via Brevo SMTP and verified through Redis before database commitment.
  - **Google OAuth 2.0:** One-click social login with automatic account provisioning.
  - **Session Management:** JWT Access Tokens paired with HTTP-only, SameSite Refresh Cookies and in-memory Axios retry queues.
- **⚡ Serverless Redis Caching:** Upstash Redis handles OTP TTL management, signup attempt limits, and cached user profile serialization for sub-millisecond route guards.
- **☁️ Cloud Object Storage:** Resumes are persisted to secure Supabase Storage buckets partitioned by user ID.
- **🖨️ Native Print & PDF Export:** Dedicated print stylesheets for exporting clean intelligence reports directly to PDF.

---

## 📸 Application Screenshots

### 1. Resume Intelligence Dashboard
> Complete ATS evaluation report displaying the circular score gauge, KPI scorecards, candidate credentials, and actionable audit items.

![Resume Intelligence Report](docs/images/analysis-dashboard.png)

---

### 2. Dual-Column Upload & JD Workbench
> Side-by-side ingestion interface allowing candidates to upload PDF resumes and supply target Job Descriptions simultaneously.

![Resume Upload Workbench](docs/images/resume-upload.png)

---

### 3. Landing & Hero Showcase
> Conversion-focused landing page introducing the platform, core value propositions, and supported tech engineering standards.

![Landing Page](docs/images/landing-page.png)

---

### 4. Authentication & Registration
> Clean authentication modal supporting dual-phase email verification and one-click Google OAuth sign-in.

![Registration Screen](docs/images/auth-register.png)

---

### 5. Candidate Account Settings
> User management dashboard displaying verification badges, profile settings, and previous resume upload history.

![Account Profile](docs/images/account-profile.png)

---

## 🛠️ Technology Stack

<div align="center">

| Category | Technologies |
|---|---|
| **Frontend Core** | React 19, Vite 8, React Router v7, HTML5, Vanilla CSS3 |
| **Data Visualization** | Chart.js 4, React-Chartjs-2 |
| **Animation & UX** | DotLottie React (`@lottiefiles/dotlottie-react`), React Toastify, Font Awesome |
| **Backend Core** | Python 3.13, FastAPI, Uvicorn, Pydantic v2 |
| **AI / LLM Pipeline** | LangChain, ChatGroq (`qwen/qwen3.8-27b`), PyMuPDF (`fitz`), Google GenAI |
| **Database & Cache** | PostgreSQL (Neon Serverless), SQLAlchemy 2, Alembic, Upstash Redis |
| **Object Storage** | Supabase Storage (S3-compatible) |
| **Email & Auth** | Brevo REST API (v3 SMTP), Authlib, Python-Jose (JWT), Pwdlib (Argon2id) |
| **DevOps & Hosting** | Docker, Vercel (Frontend), Render (Backend) |

</div>

---

## 🏛️ High-Level System Architecture

```mermaid
graph TD
    subgraph Client ["Frontend Client (React 19 + Vite)"]
        UI["SPA User Interface"]
        Axios["Axios Client (Interceptors & Refresh Queue)"]
        AuthCtx["AuthContext State Manager"]
    end

    subgraph Gateway ["FastAPI Gateway & Security"]
        Router["FastAPI Application (ASGI)"]
        RateLimiter["SlowAPI Rate Limiter"]
        CORS["CORS & Session Middleware"]
    end

    subgraph Services ["Application Services"]
        AuthSvc["Auth Service (JWT & OAuth2)"]
        ParserSvc["PyMuPDF Extraction Engine"]
        LLMSvc["LangChain Groq (Qwen-2.5)"]
    end

    subgraph Data ["Data & Storage Layer"]
        NeonDB[("Neon PostgreSQL")]
        UpstashRedis[("Upstash Redis (Cache & OTP)")]
        SupabaseS3[("Supabase Object Storage")]
        BrevoSMTP["Brevo Email Service"]
    end

    UI --> Axios
    Axios --> Router
    Router --> RateLimiter --> CORS
    CORS --> AuthSvc
    CORS --> ParserSvc

    AuthSvc --> BrevoSMTP
    AuthSvc --> UpstashRedis
    AuthSvc --> NeonDB

    ParserSvc --> LLMSvc
    ParserSvc --> SupabaseS3
    ParserSvc --> NeonDB
```

---

## 🔄 Complete Application Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Candidate
    participant FE as React Frontend
    participant BE as FastAPI Backend
    participant Redis as Upstash Redis
    participant DB as Neon PostgreSQL
    participant AI as Groq / LangChain LLM
    participant S3 as Supabase Storage

    Candidate->>FE: Fill Registration Form
    FE->>BE: POST /auth/register
    BE->>Redis: Store OTP & Pending User (TTL: 5m)
    BE-->>Candidate: Email OTP Code via Brevo
    Candidate->>FE: Submit 6-digit OTP
    FE->>BE: POST /auth/verify-otp
    BE->>DB: Create User (is_verified = true)
    BE-->>FE: Return Access Token + Set HTTP-only Cookie
    
    Candidate->>FE: Upload Resume (PDF) + Paste JD
    FE->>BE: POST /hirelense/upload_resume
    BE->>BE: Validate Magic Bytes & Extract Text via PyMuPDF
    BE->>AI: Evaluate against JD with Pydantic Schema
    AI-->>BE: Structured Resume Evaluation
    BE->>S3: Upload PDF to `resumes/{user_id}/{uuid}.pdf`
    BE->>DB: Insert record into `resumes` table
    BE-->>FE: 200 OK (JSON Evaluation)
    FE-->>Candidate: Render Dashboard with Charts & Action Plan
```

---

## 📂 Project Directory Structure

```text
Resume-Parser/
├── docs/                       # Project Documentation Assets
│   └── images/                 # High-resolution application screenshots
├── backend/                    # FastAPI Backend Service
│   ├── agent/                  # AI agent, PyMuPDF, and LLM structured prompt
│   ├── alembic/                # Database migrations and revision scripts
│   ├── auth/                   # JWT, OTP, and Google OAuth handlers
│   ├── models/                 # SQLAlchemy ORM models (Users, Resumes, RefreshToken)
│   ├── schemas/                # Pydantic validation & LLM output schemas
│   ├── tokens/                 # Token creation, decoding, and Redis user cache
│   ├── .dockerfile             # Production Docker build
│   ├── .env.example            # Backend environment variables template
│   ├── config.py               # Central configuration, Redis client, Brevo, Supabase
│   ├── database.py             # Database session manager
│   ├── main.py                 # ASGI entrypoint
│   ├── README.md               # Backend-specific README
│   └── requirements.txt        # Backend dependencies
├── frontend/                   # React 19 Frontend Client
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── anim/               # DotLottie loading and 404 animation wrappers
│   │   ├── api/                # Axios instance with auth & refresh queue
│   │   ├── assets/             # Calligraphy fonts, illustrations, and images
│   │   ├── auth/               # Login, Register, OTP, and Forgot Password views
│   │   ├── components/         # AtsScoreCircle gauge and Navbar
│   │   ├── lib/                # Storage & toast notification helpers
│   │   ├── pages/              # Home, Analysis, Profile, and NotFound pages
│   │   ├── styles/             # Scoped stylesheets
│   │   ├── App.jsx             # Route definitions & router loading layout
│   │   └── main.jsx            # Application mount point
│   ├── .env.example            # Frontend environment template
│   ├── package.json            # Frontend package manifest
│   ├── vercel.json             # Vercel SPA rewrite configuration
│   ├── vite.config.js          # Vite build configuration
│   └── README.md               # Frontend-specific README
└── README.md                   # Main repository README
```

---

## ⚡ Prerequisites

Before running the project locally, ensure you have installed:
- **Node.js** (v18.0.0 or higher) and **npm**
- **Python** (v3.11 or higher, Python 3.13 recommended)
- **Git**
- A **PostgreSQL** database (e.g., [Neon](https://neon.tech))
- A **Redis** instance (e.g., [Upstash](https://upstash.com))
- Free API keys for **Groq**, **Supabase**, and **Brevo**

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/hirelense-ai.git
cd hirelense-ai
```

---

### 2. Configure & Run Backend

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and supply your credentials

# Run database migrations
alembic upgrade head

# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*API will be available at [http://localhost:8000](http://localhost:8000)*  
*Swagger Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)*

---

### 3. Configure & Run Frontend

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start Vite development server
npm run dev
```
*Web application will be available at [http://localhost:5173](http://localhost:5173)*

---

## 🔐 Environment Configuration

### Backend `.env`
```env
NEON_DATABASE_URL=postgresql://user:password@ep-sample.neon.tech/hirelense?sslmode=require
GROQ_API_KEY=gsk_your_groq_api_key
UPSTASH_REDIS_URL=https://your-upstash-redis.upstash.io
UPSTASH_REDIS_TOKEN=your_upstash_redis_token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_key
BREVO_API_KEY=xkeysib-your_brevo_key
BREVO_SENDER_NAME=HireLense AI
BREVO_SENDER_EMAIL=verify@hirelense.ai
ALGORITH=HS256
SECREST_CODE=your_jwt_signing_secret_key
ACCESS_TOKEN_EXPIRY_TIME=60
REFRESH_TOKEN_EXPIRY_TIME=30
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URL=http://localhost:8000/auth/google/callback
GOOGLE_SESSION_SECRET=your_starlette_session_secret
FRONTEND_URL=http://localhost:5173
ENV=development
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:8000
```

---

## 🚢 Deployment Architecture

```
┌───────────────────────────────────────┐       ┌───────────────────────────────────────┐
│               Vercel                  │       │                Render                 │
│         (Frontend Client SPA)         │       │          (FastAPI Backend)            │
│  · React 19 + Vite Production Build   │       │  · Dockerized ASGI Application        │
│  · Global CDN Edge Network            │       │  · Python 3.13 Slim Container         │
└──────────────────┬────────────────────┘       └──────────────────┬────────────────────┘
                   │                                               │
                   │ HTTPS API Requests (withCredentials)          │
                   └───────────────────────┬───────────────────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
        ┌───────────▼──────────┐ ┌─────────▼──────────┐ ┌─────────▼──────────┐
        │   Neon PostgreSQL    │ │    Upstash Redis   │ │   Supabase Storage │
        │ (Relational Data/ACID│ │ (Cache & OTP TTL)  │ │ (Private PDF Files)│
        └──────────────────────┘ └────────────────────┘ └────────────────────┘
```

- **Frontend:** Hosted on **Vercel** with automatic deployment on push and client-side route rewrites via `vercel.json`.
- **Backend:** Packaged via multi-stage **Docker** container and deployed as a web service on **Render**.
- **Database:** Serverless **PostgreSQL** hosted on **Neon**.
- **Cache:** Serverless **Redis** hosted on **Upstash**.
- **Storage:** S3-compatible document storage hosted on **Supabase**.

---

## 🔒 Security Considerations

1. **Argon2id Password Hashing:** Utilizes memory-hard password hashing to defend against GPU-based cracking.
2. **Dual-Token Refresh Rotation:** Plain-text refresh tokens are never stored; only their cryptographic SHA-256 hashes are recorded in PostgreSQL.
3. **HTTP-Only Cookies:** Mitigates Cross-Site Scripting (XSS) by preventing JavaScript execution from accessing refresh tokens.
4. **Buffer & Magic Byte Verification:** Verifies binary streams start with `%PDF` before passing to PyMuPDF, neutralizing disguised malicious files.
5. **SlowAPI Token-Bucket Rate Limiting:** Enforces strict per-IP rate limits on sensitive endpoints (`/auth/register`, `/auth/login`, `/hirelense/upload_resume`).

---

## 🗺️ Roadmap & Future Improvements

- [ ] **Interactive AI Resume Builder (`/build_resume`):** Real-time LaTeX and Markdown resume editor featuring live ATS score previews.
- [ ] **SerpApi Live Job Aggregator:** Integration connecting evaluated resumes directly to active job postings on Google Jobs and LinkedIn.
- [ ] **Semantic Vector Search (pgvector):** Embed candidate resumes and job descriptions using OpenAI / Gemini text embeddings to compute cosine similarity scores.
- [ ] **Automated PDF Annotator:** Generate visual PDF previews with inline highlights marking keyword gaps and formatting warnings.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/AmazingFeature`.
3. Commit your changes: `git commit -m "feat: Add amazing feature"`.
4. Push to the branch: `git push origin feature/AmazingFeature`.
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 👨‍💻 Author & Contact

**Durga Prasad Kota**  
*AI/ML Engineer & Python Backend Developer*

- **GitHub:** [@your-github-username](https://github.com)
- **LinkedIn:** [linkedin.com/in/your-profile](https://linkedin.com)
- **Email:** durgaprasad04289@gmail.com

