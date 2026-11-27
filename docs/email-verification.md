# Registration email verification

The registration page requests a verification code from
`POST /api/auth/email-verification/send/` with `{ "email": "name@example.com" }`.
The backend sends and validates the six-digit code; it expires after 10 minutes
and is consumed only when registration succeeds.

Registration submits
`{ "username": "...", "email": "...", "password": "...", "verification_code": "123456" }`
to `POST /api/auth/register/`. The backend is the source of truth for code
validity, expiry, and one-time use. The browser does not generate or verify
codes, and no mail-service credentials are included in the frontend.
