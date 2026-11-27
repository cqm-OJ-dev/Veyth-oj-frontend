# Registration email verification

The registration page generates a six-character verification code in the
browser and sends it directly to
`https://mailserver.cqiming.com/api/batch_mail/api/send`. The request uses the
deliberately public, restricted client key in the `x-api-key` header. The key
is visible in the browser bundle and must remain scoped to this mail-send
operation and approved origins; never use a private or unrestricted service
key in frontend code.

The browser checks that the entered code matches the code sent to the email
address. This is a client-side check only and is not server-enforced proof of
email ownership.
