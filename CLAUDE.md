# CLAUDE.md — PredictVet AI Companion

## 1. Project Overview

**PredictLab** is a SaaS and BaaS (Backend as a Service) platform focused on intelligence and automation for the veterinary sector (clinics, 24h hospitals, and laboratories).

The primary goal is to eliminate friction during consultations, standardize unstructured medical data, and translate technical jargon for pet owners, thereby saving the veterinarian's time.

---

## 2. Business Objectives (Core Features)

- **Intelligent Guided Anamnesis:** Transform complex clinical decision flows (previously spreadsheet-based) into a dynamic, frictionless interface.
- **Data Structuring (SOAP):** Ingest audio (transcribed) or disorganized consultation text and use AI to automatically categorize it into Subjective, Objective, Assessment, and Plan.
- **B2C Translation:** Convert complex technical reports into welcoming, comprehensible messages for pet owners (with future WhatsApp integration).
- **Scalability (Post-MVP):** The system is designed to eventually provide its intelligence via API (PredictLab Headless), allowing other veterinary ERPs to consume our algorithms.

---

## 3. Technical Architecture (Tech Stack)

The architecture is strictly **Decoupled**, split between the client and the intelligence server:

| Layer | Technology | Role |
|---|---|---|
| Frontend | React | Medical usability, speed, responsiveness |
| Orchestration & Backend | n8n (Docker container) | Webhooks, complex logic, external API integration |
| Artificial Intelligence | Google Gemini API (via n8n) | NLP, SOAP structuring, report translation |
| Database & Auth | Supabase (PostgreSQL) | Single source of truth for clinical data and user management |
| Cache & Queue | Redis | — |
| Production Infrastructure | Ubuntu VPS (Hostinger) + Docker Compose | — |
| Proxy & Security | Nginx Proxy Manager (NPM) | Domain management, SSL via Let's Encrypt |

---

## 4. The Team

- **Anderson** — Tech Lead, Cloud Architect, Infrastructure, Database, n8n AI flows, Frontend (React), UI/UX integration.

---

## 5. Architectural Rules & Coding Guidelines (CRITICAL)

### Authentication
- Account creation (SignUp) and Login **MUST** be handled by React communicating directly with the native Supabase library (`@supabase/supabase-js`).
- **Never** send passwords or create sessions via n8n Webhooks.

### Profile Separation
- Supabase manages credentials in the `auth.users` vault.
- Additional veterinarian data (Name, License/CRMV, Clinic) must be sent during registration via `options.data` so a database Trigger can copy them to the `public.profiles` table.

### React ➡️ n8n Communication
- The frontend communicates with n8n intelligence **exclusively via HTTP Webhooks (REST/JSON)**.
- Never call n8n from server-side routes or bypass the Webhook contract.

### Database Security
- Adhere to **Supabase Row Level Security (RLS)**.
- Queries and inserts from React must be performed within the context of the authenticated user.
- n8n uses the `service_role` key **only** for high-priority backend processing.

### Frontend Clean Code
- Prioritize **functional components** and **custom Hooks**.
- Avoid excessive third-party libraries if Supabase provides the tool natively.
- Keep logs clean — no debug `console.log` left in production code.
