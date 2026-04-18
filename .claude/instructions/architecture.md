# Architecture & Tech Stack

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
