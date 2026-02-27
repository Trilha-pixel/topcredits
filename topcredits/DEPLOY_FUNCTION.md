
# Deploying the Invite User Function

The "Invite Reseller" functionality requires a backend **Edge Function** to securely call the `inviteUserByEmail` API, which requires administrative privileges (`service_role`).

I have created the function code for you in `supabase/functions/invite-user/index.ts`.

## Deployment Instructions

To make this functionality work, you must deploy the function using the Supabase CLI.

### 1. Install Supabase CLI (if not installed)
See: https://supabase.com/docs/guides/cli

### 2. Login to Supabase
```bash
npx supabase login
```

### 3. Deploy the Function
Run this command in your project root:
```bash
npx supabase functions deploy invite-user --no-verify-jwt
```
*Note: `--no-verify-jwt` is used because we handle the JWT verification manually inside the function to check if the user is an admin.*

### 4. Set Environment Variables (If needed)
The function automatically uses `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` which are injected by the Supabase platform. No manual env setting is required for these.

## What this function does
1.  Receives `email` and `fullName` from the frontend.
2.  Verifies if the caller is an authenticated **Amin** (via `profiles` table check).
3.  Calls `supabase.auth.admin.inviteUserByEmail(email)`.
4.  The user receives an email with a magic link to set their password.
5.  Upon creation, the user is assigned the `reseller` role automatically.
