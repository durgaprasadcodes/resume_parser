# ⚙️ HireLense AI — Backend Architecture & API Documentation

> High-performance, asynchronous REST API engine powering **HireLense AI**, built with **FastAPI**, **PostgreSQL (Neon)**, **Upstash Redis**, **LangChain (Groq / Qwen-2.5)**, and **PyMuPDF**.

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Backend Architecture](#-backend-architecture)
3. [Technology Stack](#-technology-stack)
4. [Folder Structure](#-folder-structure)
5. [System Architecture Diagram](#-system-architecture-diagram)
6. [Backend Execution Flow](#-backend-execution-flow)
7. [Authentication & Authorization Flow](#-authentication--authorization-flow)
8. [Database Architecture & Entity Relationships](#-database-architecture--entity-relationships)
9. [Database Models & Responsibilities](#-database-models--responsibilities)
10. [API Endpoints Documentation](#-api-endpoints-documentation)
11. [Redis Architecture & Caching Strategy](#-redis-architecture--caching-strategy)
12. [External API Integrations](#-external-api-integrations)
13. [AI/ML Processing Pipeline](#-aiml-processing-pipeline)
14. [Error Handling & Validation](#-error-handling--validation)
15. [Security Implementations](#-security-implementations)
16. [Environment Variables](#-environment-variables)
17. [Installation & Setup](#-installation--setup)
18. [Database Migrations (Alembic)](#-database-migrations-alembic)
19. [Running Locally](#-running-locally)
20. [Docker Configuration & Deployment](#-docker-configuration--deployment)
21. [Testing & Verification](#-testing--verification)
22. [Troubleshooting & Common Errors](#-troubleshooting--common-errors)

---

## 🚀 Project Overview

The **HireLense AI Backend** is an asynchronous microservice architecture developed in Python 3.13 and FastAPI. It serves as the analytical backbone for HireLense, handling:
- **Resilient Identity Management:** Two-phase registration with email OTP verification, Argon2 password hashing, and Google OAuth 2.0 integration.
- **Session & Token Management:** Dual-token JWT architecture (short-lived access tokens and rotated, SHA-256 hashed refresh tokens) with Redis-backed user profile caching.
- **AI-Powered Resume Analysis:** Ingests unstructured PDF resumes, parses raw binary buffers with PyMuPDF, and benchmarks skills, projects, and career trajectories against target Job Descriptions (JDs) using LLM-backed structured schema outputs.
- **Cloud Storage & Persistence:** Seamless document ingestion to Supabase Storage buckets combined with relational tracking in PostgreSQL.

---

## 🏛️ Backend Architecture

The backend follows a modular, layered architecture adhering to the **Separation of Concerns (SoC)** principle:

```
┌────────────────────────────────────────────────────────┐
│                   FastAPI Application                  │
│       CORS Middleware · SessionMiddleware · SlowAPI     │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
┌───────────▼───────────┐        ┌───────────▼───────────┐
│     Auth Router       │        │     Agent Router      │
│  JWT, OAuth2, Brevo   │        │  Resume Parse & Store │
└───────────┬───────────┘        └───────────┬───────────┘
            │                                │
┌───────────▼────────────────────────────────▼───────────┐
│                    Business & Services                 │
│    Token Service · Security · PyMuPDF · LangChain LLM  │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
┌───────────▼───────────┐        ┌───────────▼───────────┐
│     Upstash Redis     │        │    PostgreSQL (Neon)  │
│  OTP, TTL, User Cache │        │  Users, Tokens, Docs  │
└───────────────────────┘        └───────────────────────┘
```

---

## 🛠️ Technology Stack

| Component | Technology | Version | Purpose & Technical Rationale |
|---|---|---|---|
| **Language** | Python | `3.13` | Modern typing, enhanced performance, and robust ecosystem for AI/LLM tooling. |
| **Framework** | FastAPI | `^0.115` | High-throughput asynchronous ASGI framework with automated OpenAPI docs and native Pydantic validation. |
| **Server** | Uvicorn | `[standard]` | Production ASGI server handling asynchronous event loops and worker processes. |
| **ORM** | SQLAlchemy | `^2.0` | Declarative relational mapping with PostgreSQL-specific UUID and JSONB support. |
| **Migrations** | Alembic | `^1.13` | Programmatic schema migrations and version tracking for relational tables. |
| **Database** | PostgreSQL (Neon) | Serverless | Cloud-native serverless PostgreSQL providing reliable ACID compliance and connection pooling. |
| **Cache / KV** | Upstash Redis | HTTP REST | Serverless Redis client operating over HTTP, avoiding connection exhaustion in stateless environments. |
| **LLM Engine** | ChatGroq / LangChain | `qwen3.8-27b` | Ultra-low inference latency for JSON-enforced structured resume evaluation. |
| **PDF Extraction**| PyMuPDF (`fitz`) | `^1.24` | C-level binary PDF stream parsing, extracting embedded text blocks with minimal memory overhead. |
| **Object Storage**| Supabase Storage | S3-compatible | Secure, scalable storage for uploaded resume PDFs partitioned by `user_id`. |
| **Email Service** | Brevo API | v3 REST | Transactional email delivery for 6-digit verification codes and security notifications. |
| **Authentication**| Authlib & Jose | OAuth2 / JWT | Implements RFC 7519 JWT standards and OpenID Connect for Google Social Login. |
| **Security** | Pwdlib (`argon2`) | Memory-hard | Resistance against GPU-accelerated brute-force attacks compared to legacy bcrypt. |
| **Rate Limiter** | SlowAPI | Limiter | Token-bucket rate limiting based on remote client IP address to prevent DDoS and spam. |

---

## 📂 Folder Structure

```text
backend/
├── agent/                      # AI Resume Parsing & Evaluation Engine
│   ├── __init__.py
│   └── bot.py                  # PyMuPDF extraction, Groq LLM invocation, Supabase upload
├── alembic/                    # Database Migration Scripts
│   ├── versions/               # Versioned migration revision files
│   ├── env.py                  # Alembic runtime environment
│   ├── README
│   └── script.py.mako
├── auth/                       # Authentication & Authorization Subsystem
│   ├── __init__.py
│   ├── google_auth.py          # Google OAuth 2.0 flow & callback handler
│   └── jwt_auth.py             # Email registration, OTP, login, refresh, password reset
├── models/                     # SQLAlchemy Declarative Models
│   ├── __init__.py
│   └── model.py                # Users, Resumes, and RefreshToken ORM tables
├── schemas/                    # Pydantic Schemas for DTOs & LLM Output
│   ├── __init__.py
│   └── schema.py               # Auth schemas and structured Resume evaluation schemas
├── tokens/                     # Token Encoding/Decoding & Session Invalidation
│   ├── __init__.py
│   ├── get_user_info.py        # Dependency injection for user retrieval with Redis cache
│   └── jwt_token.py            # JWT creation, decoding, and signature verification
├── .dockerfile                 # Production Docker container build
├── .dockerignore               # Containerization ignore rules
├── .env.example                # Canonical environment variable template
├── alembic.ini                 # Alembic configuration file
├── config.py                   # Centralized configuration, Redis, Supabase, Brevo, & Prompts
├── database.py                 # SQLAlchemy engine, session maker, and Base class
├── main.py                     # Application entry point, CORS, middlewares, and router mounts
├── README.md                   # Backend documentation
└── requirements.txt            # Locked Python dependency manifest
```

---

## 📊 System Architecture Diagram

```mermaid
graph TD
    Client["React Frontend (Client)"] -->|HTTPS / REST API| App["FastAPI Engine (main.py)"]
    
    subgraph Middlewares
        App --> CORS["CORS Middleware"]
        App --> Limiter["SlowAPI Rate Limiter"]
        App --> Session["Session Middleware (Cookies)"]
    end
    
    subgraph Routing Layer
        App --> AuthRouter["/auth (jwt_auth.py)"]
        App --> GoogleRouter["/auth/google (google_auth.py)"]
        App --> AgentRouter["/hirelense (bot.py)"]
    end
    
    subgraph Auth Services
        AuthRouter --> Brevo["Brevo API (Email OTP)"]
        AuthRouter --> Redis["Upstash Redis (OTP & Cache)"]
        GoogleRouter --> GoogleOAuth["Google OAuth 2.0 Provider"]
    end
    
    subgraph AI Parser Services
        AgentRouter --> PyMuPDF["PyMuPDF (Binary Text Extractor)"]
        AgentRouter --> Groq["ChatGroq / Qwen LLM Engine"]
        AgentRouter --> Supabase["Supabase Storage (PDF Bucket)"]
    end
    
    subgraph Database Layer
        AuthRouter --> PostgreSQL[("Neon PostgreSQL DB")]
        AgentRouter --> PostgreSQL
    end
```

---

## 🔄 Backend Execution Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Candidate
    participant FE as Frontend Client
    participant API as FastAPI Backend
    participant Redis as Upstash Redis
    participant DB as Neon PostgreSQL
    participant LLM as Groq LLM Engine
    participant S3 as Supabase Storage

    User->>FE: Upload Resume (PDF) + Target JD
    FE->>API: POST /hirelense/upload_resume (Multipart Form)
    API->>API: Verify Bearer Token & Validate Magic Bytes (%PDF)
    API->>API: Parse text using PyMuPDF
    API->>LLM: Invoke Structured Prompt with Pydantic Schema (Resume)
    LLM-->>API: Validated JSON Evaluation (Scores, Skills, Feedback)
    API->>S3: Upload PDF to `resumes/{user_id}/{uuid}.pdf`
    API->>DB: Record Resume Metadata (resumes table)
    DB-->>API: Commit Transaction
    API-->>FE: 200 OK (JSON Result & File Metadata)
    FE-->>User: Render Interactive SaaS Dashboard
```

---

## 🔐 Authentication & Authorization Flow

HireLense implements a zero-trust, two-phase authentication model:

### 1. Registration via Email OTP (Two-Phase Registration)
1. The user posts credentials (`name`, `email`, `password`) to `/auth/register`.
2. The user is **NOT** inserted into the PostgreSQL database immediately.
3. Password is cryptographically hashed with **Argon2id**.
4. A 6-digit cryptographically random OTP is generated and stored in Redis under `RESUME_PARSER_OTP_{email}` with a 300-second (5 min) TTL.
5. User payload is cached in Redis under `CURRENT_USER_DATA_{email}`.
6. Brevo transactional email sends the OTP asynchronously in a `BackgroundTask`.
7. Client submits OTP to `/auth/verify-otp`. Upon verification:
   - User record is created in PostgreSQL with `is_verified = True`.
   - JWT Access Token (JSON body) and Refresh Token (HTTP-Only Secure Cookie) are issued.

### 2. Login & JWT Issuance
- Password verified via `PasswordHash.verify()`.
- Generates access token (15-60 min TTL) with claims: `{ "user_id": str(uuid), "email": str, "exp": int }`.
- Generates refresh token (7-30 days TTL), stores the SHA-256 hash in PostgreSQL `refresh_tokens` table.
- Sets `refresh_token` as an `HttpOnly`, `SameSite=Lax/None`, `Secure` cookie.

### 3. Google OAuth 2.0
- Initiated at `/auth/google/login`, generating a cryptographically signed state token.
- User authorizes with Google and is redirected to `/auth/google/callback`.
- Backend fetches user info (`email`, `name`, `picture`, `sub`), upserts the `users` record, generates tokens, and redirects to frontend with URL hash parameters `#oauth-callback?...`.

### 4. User Invalidation & Caching (`tokens/get_user_info.py`)
- Authorized requests are intercepted by `get_user_info`.
- Reads `_USER_{user_id}` from Redis.
- **Cache Hit:** Returns user object immediately without querying PostgreSQL.
- **Cache Miss:** Queries PostgreSQL, populates Redis with 600s TTL.
- **Cache Invalidation:** Called during `/auth/profile` updates or `/auth/logout`.

---

## 🗄️ Database Architecture & Entity Relationships

```mermaid
erDiagram
    USERS ||--o{ REFRESH_TOKENS : "owns"
    USERS ||--o{ RESUMES : "uploads"

    USERS {
        uuid id PK "UUID4 primary key"
        string name "Candidate display name"
        string email UK "Unique lowercase email"
        string password "Argon2 password hash (nullable for OAuth)"
        string google_id UK "Google OAuth subject identifier"
        boolean is_verified "Email verification status"
        string picture "Avatar image URL"
        datetime created_at "Account creation timestamp"
        datetime updated_at "Last update timestamp"
    }

    REFRESH_TOKENS {
        uuid id PK "UUID4 primary key"
        string refresh_token UK "SHA-256 hex digest of refresh token"
        uuid user_id FK "References users.id"
        datetime expires_at "Token expiration timestamp"
        datetime created_at "Issuance timestamp"
        boolean revoked "Revocation status flag"
        uuid revoked_by_id FK "Self-referencing token rotation chain"
    }

    RESUMES {
        uuid id PK "UUID4 primary key"
        string resume_name "Original uploaded filename"
        uuid user_id FK "References users.id"
        datetime uploaded_at "Timestamp of upload"
        datetime updated_at "Timestamp of last analysis"
    }
```

---

## 📦 Database Models & Responsibilities

1. **`Users` (`models/model.py`)**:
   - Represents the registered user identity.
   - Enforces unique constraints on `email` and `google_id`.
   - Manages cascading deletions: removing a user purges all associated refresh tokens and resume records.

2. **`RefreshToken` (`models/model.py`)**:
   - Tracks active sessions and rotation chains.
   - Stores only `hash_refresh_token(token)` to prevent plain-text leakage in database backups.
   - Supports active session revocation on logout.

3. **`Resumes` (`models/model.py`)**:
   - Relational audit ledger recording uploaded candidate resumes.
   - Tracks document timestamps and file names per user.

---

## 🌐 API Endpoints Documentation

### Authentication Routes (`/auth`)

| Method | Endpoint | Description | Auth Required | Rate Limit |
|---|---|---|---|---|
| `POST` | `/auth/register` | Registers candidate and dispatches 6-digit email OTP | No | 5 / min |
| `POST` | `/auth/verify-otp` | Validates registration OTP and creates permanent user | No | 10 / min |
| `POST` | `/auth/login` | Authenticates email & password, sets cookies | No | 10 / min |
| `GET` | `/auth/google/login` | Generates OAuth redirect to Google consent screen | No | None |
| `GET` | `/auth/google/callback` | Exchanges Google auth code, logs in user | No | None |
| `GET` | `/auth/me` | Fetches active authenticated user profile | Bearer Token | None |
| `PATCH` | `/auth/profile` | Updates candidate profile name and invalidates cache | Bearer Token | 10 / min |
| `POST` | `/auth/refresh` | Rotates refresh token and issues new access token | Cookie / Body | 20 / min |
| `POST` | `/auth/logout` | Revokes refresh token, purges cache, clears cookies | Bearer Token | None |
| `POST` | `/auth/reset-password` | Requests password reset OTP via email | No | 3 / min |
| `POST` | `/auth/reset-otp` | Validates reset OTP, returns a single-use reset token | No | 5 / min |
| `POST` | `/auth/change-password`| Sets new password using verified reset token | No | 5 / min |

### AI Resume Agent Routes (`/hirelense`)

| Method | Endpoint | Description | Auth Required | Rate Limit |
|---|---|---|---|---|
| `POST` | `/hirelense/upload_resume` | Accepts PDF and JD, executes PyMuPDF + LLM evaluation | Bearer Token | 3 / min |
| `GET` | `/hirelense/get_resumes` | Retrieves paginated upload history for the user | Bearer Token | None |

#### Sample Request: `POST /hirelense/upload_resume`
- **Headers:** `Authorization: Bearer <jwt_access_token>`
- **Content-Type:** `multipart/form-data`
- **Query Params:** `user_id=<user_uuid>`
- **Form Data:**
  - `file`: `<binary PDF buffer>`
  - `jd`: `"Looking for a Senior Python Developer with FastAPI, PostgreSQL, and Docker experience..."`

#### Sample Response: `200 OK`
```json
{
  "message": "File uploaded successfully",
  "filename": "John_Doe_Resume.pdf",
  "result": {
    "name": "John Doe",
    "ats_score": "84",
    "profession": "Backend Software Engineer",
    "summary": "Experienced Python backend engineer with 4+ years architecting microservices and scalable APIs.",
    "skills": {
      "matched": ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis"],
      "unmatched": ["Kubernetes", "GraphQL"],
      "final_score": 85
    },
    "projects": [
      {
        "projects": {
          "name": "Real-time Telemetry Engine",
          "description": "High-throughput async event pipeline processing 10k req/sec with FastAPI and Kafka.",
          "project_value": "Directly demonstrates required FastAPI and distributed systems competencies.",
          "score": 90
        },
        "final_score": 90
      }
    ],
    "experience": [
      "Software Engineer at Acme Corp (2022 - Present): Maintained core payment microservices in FastAPI."
    ],
    "certifications": {
      "certificates": ["AWS Certified Solutions Architect - Associate"],
      "final_score": 80
    },
    "resume_quality": {
      "positives": [
        "Strong alignment with target backend stack with concrete operational metrics."
      ],
      "negatives": [
        "Lacks explicit container orchestration details (e.g. Kubernetes) specified as preferred in JD."
      ]
    },
    "improvements": [
      {
        "priority": "HIGH",
        "area": "Projects",
        "problem": "No distributed caching or clustering mentioned in project architecture.",
        "reason": "Target role requires proven experience scaling high-volume transactional workloads."
      }
    ]
  }
}
```

---

## ⚡ Redis Architecture & Caching Strategy

HireLense leverages **Upstash Redis** (REST-based HTTP client) to maintain state and high performance:

| Key Pattern | Data Type | TTL | Purpose |
|---|---|---|---|
| `RESUME_PARSER_OTP_{email}` | String | 300s (5 min) | Stores the active 6-digit numeric verification OTP. |
| `CURRENT_USER_DATA_{email}` | String (JSON) | 300s (5 min) | Caches uncommitted user registration payload until OTP verification succeeds. |
| `RESUME_PARSER_MAX_SIGNUP_ATTEMPTS_{email}` | Integer | 300s (5 min) | Tracks failed OTP verification attempts to prevent brute-forcing. |
| `RESUME_PARSER_RESET_OTP_{email}` | String | 300s (5 min) | Stores OTP for password reset flows. |
| `RESUME_PARSER_RESET_TOKEN_{token}` | String (email) | 600s (10 min) | Single-use URL-safe token authorizing password modification. |
| `_USER_{user_id}` | String (JSON) | 600s (10 min) | Serialized user profile cache used by `get_user_info` dependency. |

---

## 🔌 External API Integrations

1. **Groq Cloud API (`langchain-groq`)**:
   - Executes inference using high-speed LPUs on `qwen/qwen3.8-27b`.
   - Native integration with Pydantic via `.with_structured_output(Resume)`.
2. **Supabase Object Storage**:
   - Stores uploaded resumes in private buckets.
   - Enforces unique storage path isolation: `{user_id}/{uuid}.pdf`.
3. **Brevo Email API (formerly Sendinblue)**:
   - Delivers HTML-formatted transactional emails for verification and password reset events via `https://api.brevo.com/v3/smtp/email`.
4. **Google Identity (OAuth 2.0)**:
   - Authenticates via Authlib OpenID endpoints, extracting candidate name, email, and Google profile picture.

---

## 🧠 AI/ML Processing Pipeline

```mermaid
flowchart TD
    A[Raw Uploaded PDF File] --> B{Magic Byte Validation}
    B -->|Failed| C[HTTP 400: Invalid PDF]
    B -->|Passed %PDF| D[NamedTemporaryFile Creation]
    D --> E[PyMuPDF Text Extractor]
    E --> F[Raw Text Sanitization]
    F --> G[Construct System Prompt & Rubric]
    G --> H[Groq ChatGroq LLM Invocation]
    H --> I[Pydantic Structured Schema Validation]
    I --> J{Matches Resume Schema?}
    J -->|No / Syntax Error| K[Auto-Retry Pipeline]
    J -->|Yes| L[Serialize to JSON & Return to Client]
```

### Deterministic ATS Scoring Rubric
The LLM evaluates resumes deterministically using explicit weights:
$$\text{ATS Score} = (\text{Skills} \times 0.35) + (\text{Experience} \times 0.25) + (\text{Projects} \times 0.20) + (\text{Education} \times 0.10) + (\text{Keywords} \times 0.10)$$

---

## 🛡️ Security Implementations

- **Password Hashing:** Uses `pwdlib` with the **Argon2id** algorithm, configured with memory and time cost factors to neutralize rainbow table and ASIC attacks.
- **Token Security:**
  - Access tokens have short lifespans (15-60 minutes).
  - Refresh tokens are cryptographically randomized (64 hex characters) and stored in PostgreSQL only as SHA-256 hashes.
- **Cookie Hardening:**
  - `HttpOnly = True` prevents client-side JavaScript access (mitigating XSS theft).
  - `SameSite = "Lax"` (or `"None"` in production HTTPS) guards against CSRF.
  - `Secure = True` enforces HTTPS transmission.
- **File Upload Safeguards:**
  - Restricts extensions strictly to `.pdf`.
  - Verifies binary stream begins with `%PDF` magic bytes.
  - Hard cap of 10 MB per file (`MAX_FILE_SIZE`).
- **Rate Limiting:** Protects `/auth/register` (5/min), `/auth/login` (10/min), and `/hirelense/upload_resume` (3/min) via SlowAPI.

---

## 🔑 Environment Variables

Create a `.env` file in the `backend/` directory based on the following template:

```env
# ==========================================
# DATABASE (PostgreSQL / Neon)
# ==========================================
NEON_DATABASE_URL=postgresql://user:password@ep-sample.region.neon.tech/hirelense?sslmode=require

# ==========================================
# LLM & AI PROVIDERS
# ==========================================
GROQ_API_KEY=gsk_your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# ==========================================
# REDIS (Upstash Serverless)
# ==========================================
UPSTASH_REDIS_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_TOKEN=your_upstash_redis_token_here

# ==========================================
# SUPABASE STORAGE
# ==========================================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_service_or_anon_key

# ==========================================
# EMAIL (Brevo Transactional SMTP)
# ==========================================
BREVO_API_KEY=xkeysib-your_brevo_api_key_here
BREVO_SENDER_NAME=HireLense AI
BREVO_SENDER_EMAIL=verify@hirelense.ai

# ==========================================
# JWT & SESSION CONFIGURATION
# ==========================================
ALGORITH=HS256
SECREST_CODE=super_secret_jwt_signing_key_at_least_32_chars
ACCESS_TOKEN_EXPIRY_TIME=60
REFRESH_TOKEN_EXPIRY_TIME=30

# ==========================================
# GOOGLE OAUTH 2.0
# ==========================================
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URL=http://localhost:8000/auth/google/callback
GOOGLE_SESSION_SECRET=session_signing_secret_for_starlette

# ==========================================
# CLIENT & RUNTIME ENVIRONMENT
# ==========================================
FRONTEND_URL=http://localhost:5173
ENV=development
```

---

## 💻 Installation & Setup

### Prerequisites
- **Python 3.11+** (Python 3.13 recommended)
- **Git**
- PostgreSQL database instance (local or Neon)
- Upstash Redis instance

### Steps
```bash
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# 4. Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 5. Configure environment variables
cp .env.example .env
# Edit .env with your credentials
```

---

## 🗃️ Database Migrations (Alembic)

Alembic manages database schema evolution. Ensure your `NEON_DATABASE_URL` is set in `.env`.

```bash
# Check current revision status
alembic current

# Apply all pending migrations to database
alembic upgrade head

# Generate a new migration after editing models/model.py
alembic revision --autogenerate -m "describe_schema_change"

# Rollback a single revision
alembic downgrade -1
```

---

## ▶️ Running Locally

Start the ASGI development server with live reload:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Once running:
- **Interactive Swagger Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **API Health Check:** [http://localhost:8000/](http://localhost:8000/)

---

## 🐳 Docker Configuration & Deployment

The backend includes a production-ready `.dockerfile`:

```dockerfile
FROM python:3.13-slim
WORKDIR /backend
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

### Build and Run with Docker
```bash
# Build the Docker image
docker build -t hirelense-backend -f .dockerfile .

# Run container locally mapping port 8000
docker run -p 8000:8000 --env-file .env hirelense-backend
```

### Deploying to Render
1. Connect repository to Render.
2. Choose **Web Service** with Docker environment or Python environment.
3. Set the Root Directory to `backend`.
4. Configure all environment variables in the Render Dashboard.
5. Set the Start Command to: `uvicorn main:app --host 0.0.0.0 --port $PORT`.

---

## 🧪 Testing & Verification

Verify endpoints using `curl` or HTTPie:

```bash
# Test API Health
curl -X GET http://localhost:8000/

# Test User Registration (Triggers Redis OTP & Brevo Email)
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Password123!"}'

# Test User Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'
```

---

## 🛠️ Troubleshooting & Common Errors

| Issue | Cause | Solution |
|---|---|---|
| `401 Unauthorized: Access token is missing` | Missing `Authorization: Bearer <token>` header | Ensure the client attaches the access token received on login/refresh. |
| `400 Bad Request: Only PDF files are allowed` | File uploaded without `.pdf` extension | Rename or upload a standard PDF file. |
| `400 Bad Request: Invalid PDF file` | File does not start with `%PDF` header | Ensure the file is not corrupted or an encrypted/empty container. |
| `413 Payload Too Large` | File exceeds 10 MB or JD is blank | Reduce PDF file size below 10MB; verify `jd` text is supplied. |
| `429 Too Many Requests` | SlowAPI rate limit exceeded | Wait 60 seconds before retrying the rate-limited endpoint. |
| `Redis Connection Timeout` | Invalid Upstash credentials or IP block | Verify `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN` in `.env`. |
| `Alembic Target database is not up to date` | Missing migration execution | Run `alembic upgrade head` to synchronize schema. |
