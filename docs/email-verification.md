# Registration email verification

The registration page sends verification messages directly from the browser to
`https://mailserver.cqiming.com/api/batch_mail/api/send`. Configure one of these
options in the frontend build environment:

- `REACT_APP_MAILSERVER_API_KEY`: a public, narrowly restricted client key. Any
  value included in a frontend build is visible to users; restrict it to the
  mail-send operation and approved origins, and rotate it if needed.
- `REACT_APP_MAILSERVER_ALLOW_NO_API_KEY=true`: only when the mail service
  explicitly permits credential-free browser requests and has suitable CORS
  and abuse protections.

If neither option is configured, sending fails with a configuration error.
Never put a private or unrestricted service key in frontend configuration.

The current registration flow checks the emailed code in browser memory before
calling the existing registration API. This is a user-interface check, not a
server-enforced identity proof; users can bypass client-side checks. Enforcing
email ownership for account creation requires the registration service to
validate a server-issued verification token.
