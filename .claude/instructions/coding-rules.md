# Architectural Rules & Coding Guidelines (CRITICAL)

## Authentication
- Account creation (SignUp) and Login **MUST** be handled by React communicating directly with the native Supabase library (`@supabase/supabase-js`).
- **Never** send passwords or create sessions via n8n Webhooks.

## Profile Separation
- Supabase manages credentials in the `auth.users` vault.
- Additional veterinarian data (Name, License/CRMV, Clinic) must be sent during registration via `options.data` so a database Trigger can copy them to the `public.profiles` table.

## React ➡️ n8n Communication
- The frontend communicates with n8n intelligence **exclusively via HTTP Webhooks (REST/JSON)**.
- Never call n8n from server-side routes or bypass the Webhook contract.

## Database Security
- Adhere to **Supabase Row Level Security (RLS)**.
- Queries and inserts from React must be performed within the context of the authenticated user.
- n8n uses the `service_role` key **only** for high-priority backend processing.

## Frontend Clean Code
- Prioritize **functional components** and **custom Hooks**.
- Avoid excessive third-party libraries if Supabase provides the tool natively.
- Keep logs clean — no debug `console.log` left in production code.
