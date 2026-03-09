# CLAUDE.md — PredictVet AI Companion

## Project Overview

**PredictLab** is a SaaS and BaaS platform focused on intelligence and automation for the veterinary sector (clinics, 24h hospitals, and laboratories).

Goal: eliminate friction during consultations, standardize unstructured medical data, and translate technical jargon for pet owners.

## Core Features
- **Intelligent Guided Anamnesis:** Dynamic clinical decision flows.
- **SOAP Structuring:** Audio/text ingestion → AI categorization (Subjective, Objective, Assessment, Plan).
- **B2C Translation:** Technical reports → comprehensible messages for pet owners (future WhatsApp integration).
- **PredictLab Headless (Post-MVP):** Intelligence via API for third-party veterinary ERPs.

## Team
- **Anderson** — Tech Lead, Cloud Architect, Infrastructure, n8n AI flows, Frontend (React), UI/UX.

---

@.claude/instructions/architecture.md
@.claude/instructions/coding-rules.md

## Frontend Design System

All frontend work MUST follow the PredictLab Design System skill. Before writing any JSX, component, or styling:

```
Use Skill: predictlab-design-system
```

Key references inside the skill:
- Color tokens (HSL palette from the brand logo)
- Typography: Sora (headings) + Nunito Sans (body)
- Component patterns: cards, buttons, forms, badges
- Dark section pattern (navbar, hero, banners)
- Utility classes: `.pl-*` defined in `src/index.css`
- Logo usage rules
