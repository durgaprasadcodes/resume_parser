# 🔐 HireLense AI  

> A production-oriented authentication system built for **HireLense AI**, implementing email-based account registration, OTP verification, Redis-backed temporary storage, JWT authentication, HTTP-only cookies, and protected user sessions.

---

## 🚀 Project Overview

This project implements the complete **email-based registration and login authentication flow** for HireLense AI.

Instead of immediately creating a user in the database during registration, the system first verifies ownership of the user's email address through a **6-digit OTP**.

The temporary registration data and OTP are stored in **Redis with TTL**, and the permanent user record is created only after successful OTP verification.

After verification, the backend generates **JWT access and refresh tokens** and stores them securely in **HTTP-only cookies**.

---

# Phase 1 - 📩 Email Registration & Login Flow

## 🔧 Technologies Used

### Frontend
- React.js
- React Router
- Axios

### Backend
- Python
- FastAPI
- Pydantic
- SQLAlchemy
- JWT Authentication

### Database
- PostgreSQL / MySQL

### Temporary Storage
- Redis
- Redis TTL

### Email
- Brevo Email Service
- Email OTP Verification

### Authentication
- JWT Access Token
- JWT Refresh Token
- HTTP-only Cookies

### Deployment
- Docker
- Render — Backend
- Vercel — Frontend

---

# 📝 Registration Flow

The registration process uses **Email OTP verification** before creating the permanent user account.

```text
                     REGISTER
                        │
                        ▼
                POST /auth/register
                        │
                        ▼
                 Check DB Email
                        │
                        ▼
                  Generate OTP
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
        Redis OTP          Redis User Data
              │                   │
              └─────────┬─────────┘
                        ▼
                    Send Email
                     OTP Code
                        │
                        ▼
                  Redirect → /otp
                        │
                        ▼
                  User Enters OTP
                        │
                        ▼
              POST /auth/verify-otp
                        │
                        ▼
                 Check Redis OTP
                        │
                 ┌──────┴──────┐
                 │             │
               WRONG         CORRECT
                 │             │
                 ▼             ▼
                400       Get User Data
                               │
                               ▼
                         Create DB User
                               │
                               ▼
                       is_verified=True
                               │
                               ▼
                      Generate JWT Tokens
                               │
                               ▼
                         Set Cookies
                               │
                               ▼
                           Dashboard
```

### Registration Summary

```text
Register
   ↓
Check Email
   ↓
Generate OTP
   ↓
Store OTP + User Data in Redis
   ↓
Send OTP through Email
   ↓
Verify OTP
   ↓
Create User in Database
   ↓
Generate Access + Refresh Tokens
   ↓
Set HTTP-only Cookies
   ↓
Dashboard
```

---

# 🔑 Login Flow

After registration and verification, the user can log in using their email and password.

```text
                       LOGIN
                         │
                         ▼
                  POST /auth/login
                         │
                         ▼
                    Find User
                         │
                         ▼
                  Verify Password
                         │
                  ┌──────┴──────┐
                  │             │
                WRONG         CORRECT
                  │             │
                  ▼             ▼
                 401       Generate JWT
                                │
                         ┌──────┴──────┐
                         ▼             ▼
                   Access Token   Refresh Token
                         │             │
                         └──────┬──────┘
                                ▼
                         Set HTTP-only
                            Cookies
                                │
                                ▼
                           Dashboard
```

### Login Summary

```text
Login
  ↓
Find User
  ↓
Verify Password
  ↓
Generate Access Token
  +
Generate Refresh Token
  ↓
Set HTTP-only Cookies
  ↓
Dashboard
```

---

# 🏗️ Overall Authentication Architecture

```text
                         HireLense AI
                              │
             ┌────────────────┴────────────────┐
             │                                 │
        REGISTRATION                         LOGIN
             │                                 │
             ▼                                 ▼
       Email + Password                  Email + Password
             │                                 │
             ▼                                 ▼
        Generate OTP                    Verify Password
             │                                 │
             ▼                                 ▼
           Redis                         Generate JWT
             │                                 │
             ▼                                 ▼
        Email OTP                         Set Cookies
             │                                 │
             ▼                                 ▼
       Verify OTP                         Dashboard
             │
             ▼
       Create User
             │
             ▼
        Generate JWT
             │
             ▼
        Set Cookies
             │
             ▼
         Dashboard
```

---

# 🧰 Technology Architecture

```text
                         React.js
                            │
                            │ HTTP / Axios
                            ▼
                         FastAPI
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
        PostgreSQL         Redis         Email
        / MySQL             │              │
             │              │              │
             │          OTP + TTL       OTP Delivery
             │
             ▼
        User Database

                         FastAPI
                            │
                            ▼
                    JWT Authentication
                            │
                    ┌───────┴────────┐
                    ▼                ▼
              Access Token     Refresh Token
                    │                │
                    └───────┬────────┘
                            ▼
                     HTTP-only Cookies
```

---

# 📌 Current Authentication Stack

<div align="center">

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Routing | React Router |
| HTTP Client | Axios |
| Backend | FastAPI |
| Validation | Pydantic |
| ORM | SQLAlchemy |
| Database | PostgreSQL (NEON) |
| Temporary Storage | Redis |
| OTP Expiration | Redis TTL |
| Email | Brevo Email Service |
| Authentication | JWT |
| Session Storage | HTTP-only Cookies |
| Containerization | Docker |
| Backend Deployment | Render |
| Frontend Deployment | Vercel |


</div>

---

> Phase 1 Email Authentication Completed next Phase Forget Password Endpoint