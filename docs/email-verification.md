# Registration email verification

The registration page sends verification messages directly from the browser to
`https://mailserver.cqiming.com/api/batch_mail/api/send` and includes the
deliberately public, restricted client key in the `x-api-key` header. The key is
compiled into the browser bundle and is visible to users; it must remain
restricted to the mail-send operation and approved origins, and should be
rotated if its scope changes or it is abused. Never use a private or
unrestricted service key in frontend code.

The current registration flow checks the emailed code in browser memory before
calling the existing registration API. This is a user-interface check, not a
server-enforced identity proof; users can bypass client-side checks. Enforcing
email ownership for account creation requires the registration service to
validate a server-issued verification token.
