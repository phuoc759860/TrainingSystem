# Guide: Verify Your Email Before Signing In

New accounts must verify their email address before they can sign in to TrainingHub. This guide explains the whole flow.

## 1. Register an account

Go to the Register page and fill in **Name**, **Email**, **Password**, and select a **Role**, then click **Create account**.

A verification email is sent to the address you provided:

- **Subject:** `Verify your TrainingHub account`
- **From:** the account configured in `Email:From` (falls back to the SMTP username)

> The email is sent immediately. If the site has no SMTP configured, the API instead returns a `devVerificationLink` (Development only) that you can open directly.

## 2. Open the verification link

In the email, click **Verify email**. This opens the Verify Email page:

`https://<frontend-url>/verify-email?token=<token>`

The page shows:

- **Success** – "Email verified successfully. You can now sign in."
- **Expired** – the token is only valid for **7 days**.
- **Invalid** – the link was altered, already used, or the token is wrong.

> The verification token is single-use. After it succeeds it is discarded.

## 3. Sign in

Once verified, go to the Login page and enter your email and password.

If you try to sign in **before** verifying, login is blocked with:

```
403 – "Please verify your email address before signing in."
```

This is expected. Verify the email first, then sign in again.

## Troubleshooting

| Problem | Solution |
| --- | --- |
| No email received | Check the **spam / junk** folder. Make sure the email was typed correctly at registration. |
| Link expired (older than 7 days) | Try signing in — the "Email not verified" panel lets you **Resend verification email**, which issues a fresh 7-day token. |
| "Invalid or expired verification token" | Copy the **entire** link from the email — don't retype it. The token is single-use; resend a new one if needed. |
| Still blocked after clicking Verify | Refresh the Login page, confirm the verify page said "Email verified successfully", and try again. |
| Lost the verification email | Sign in → the "Email not verified" panel appears → click **Resend verification email** → check your inbox (and spam). |
| Registration uses a wrong email | There is no "change email" self-service. Contact an admin to fix the account. |

## Notes for admins

- Accounts that existed **before** email verification was enabled are **automatically marked as verified** (no action needed).
- Verification can be turned off entirely by setting `Auth:RequireEmailVerification=false`; the same verification email is still sent on registration, but unverified users can sign in.
- Verified status is stored per user in the `IsEmailVerified` column of the `Users` table.
