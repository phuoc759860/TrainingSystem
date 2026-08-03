# TrainingSystem Backend

## How to run the backend

1. Open terminal
2. `dotnet build`
3. `dotnet run`

## Required secrets (never committed)

Secrets are **not** stored in `appsettings.json` (they were removed for security).
Set them with user-secrets (local dev) or environment variables (deploy):

```
dotnet user-secrets set "Jwt:Key" "<long-random-value>"
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=<host>;Database=onlinetrainingsystem;User=<user>;Password=<password>;"
```

Or use environment variables:

- `Jwt__Key` — JWT signing key (required; startup fails if missing/weak)
- `ConnectionStrings__DefaultConnection` — MySQL connection string
- `DATABASE_URL` — alternative to the connection string (used on Render)
- `Email__Host`, `Email__Port`, `Email__Username`, `Email__Password`, `Email__From`, `Email__EnableSsl` — optional SMTP for password-reset / email-verification mail. Without SMTP, reset/verification links are logged and (in Development) returned in the API response.
- `Auth__RequireEmailVerification` — set `true` to block sign-in until email is verified (default `false`).

## Optional settings

- `Exam:DefaultMaxAttempts` — system-wide default max attempts for exams when a trainer doesn't set one (default `3`).
