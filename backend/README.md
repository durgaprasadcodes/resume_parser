```code
                  REGISTER
                     │
                     ▼
             POST /auth/register
                     │
                     ▼
              Check DB email
                     │
                     ▼
                Generate OTP
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
     Redis OTP             Redis User Data
          │                     │
          │                     │
          └──────────┬──────────┘
                     ▼
                  Email OTP
                     │
                     ▼
           Redirect → /otp
                     │
                     ▼
              User enters OTP
                     │
                     ▼
          POST /auth/verify-otp
                     │
                     ▼
              Check Redis OTP
                     │
               ┌─────┴─────┐
               │           │
             WRONG       CORRECT
               │           │
               ▼           ▼
             400       Get user data
                           │
                           ▼
                     Create DB user
                           │
                           ▼
                    is_verified=True
                           │
                           ▼
                  Create JWT tokens
                           │
                           ▼
                    Set cookies
                           │
                           ▼
                       Dashboard
```