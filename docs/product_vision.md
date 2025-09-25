# LifeHub Product Vision & Delivery Plan

## 1. Overview
LifeHub is an all-in-one digital hub that unifies the academic, professional, and personal lives of Australian students and young professionals. The app consolidates calendars, school portals such as Sentral and Canvas, assignments, exams, personal goals, and extracurricular activities into a single, intuitive workspace. LifeHub emphasizes automation, rich integrations, and AI-guided planning so that users can focus on execution instead of administrative busywork.

## 2. Core Value Proposition
- **One app instead of ten:** Replace fragmented workflows across Sentral, Google Calendar, Outlook, Notion, and various reminder apps with a single dashboard.
- **Unified data model:** Seamlessly combine school timetables, work rosters, extracurricular events, and personal goals with consistent categorization and visualization.
- **Automation-first:** Automatically ingest timetables, due dates, and announcements from school portals and calendars, minimizing manual entry.
- **Intelligent assistance:** Provide AI-driven summaries, nudges, and schedule optimizations that reflect each user’s unique academic and personal commitments.

## 3. Target Segments
1. **Primary – Australian high school students (Years 7–12):** Prioritizes Sentral integration, parent collaboration features, and straightforward progress tracking.
2. **Secondary – University students:** Focuses on LMS integrations (Canvas, Moodle), study planning, and group collaboration tools.
3. **Tertiary – Busy professionals and carers:** Offers blended work/personal calendars, flexible goal tracking, and smart availability sharing for families.

## 4. Experience Pillars
### 4.1 Dashboard
- Aggregated “Today” view with classes, events, tasks, and reminders ordered by urgency and importance.
- Quick-glance insights: weather, motivational quote, and next critical milestone.
- Shareable calendars that support parent/guardian visibility with configurable privacy controls.

### 4.2 Calendar & Scheduling
- Multi-source synchronization across Google, Outlook, Apple, and Sentral timetables.
- Category-based color coding (school, personal, work, extracurricular) and clash detection.
- Auto-import pipelines for rotating timetables, exam blocks, and room changes.

### 4.3 Academic Integrations
- Single sign-on to Sentral and university LMS platforms.
- Automatic assignment ingestion with due dates, marking rubrics, and teacher feedback.
- Grade analytics dashboard with per-subject trends, cumulative GPA, and alerts for at-risk courses.

### 4.4 Productivity & Motivation
- Task breakdown templates (e.g., “Plan → Draft → Edit”) with smart defaults by subject.
- Reminders and streak mechanics tied to consistent task completion.
- AI-generated weekly planning suggestions and revision prompts.

### 4.5 Communication Hub
- Consolidated announcements feed from Sentral and LMS bulletin boards.
- Opt-in federation with WhatsApp, Discord, or Microsoft Teams study groups via deep links.
- Lightweight study session scheduling with RSVP tracking.

### 4.6 Personal Life Sync
- Import gym classes, work shifts, or club practices via ICS/CalDAV feeds or CSV uploads.
- Personal goal tracking (fitness, reading, finance) with progress visualizations.
- Optional finance tracker that syncs with supported banks to surface allowance and spending trends.

## 5. System Architecture
### 5.1 Platform Stack
- **Frontend:** Cross-platform Flutter app for iOS/Android parity, plus a responsive Next.js web client for desktop-first interactions.
- **State management:** Use a unified GraphQL schema backed by Apollo or URQL clients to ensure consistent data access across platforms.
- **Backend:** Supabase (PostgreSQL + Auth) for rapid development, augmented by serverless functions (Vercel / Cloudflare Workers) to handle API orchestration.
- **AI Services:** Fine-tuned GPT models hosted via OpenAI or Azure OpenAI for natural-language summaries and scheduling suggestions.

### 5.2 Integration Layer
- OAuth 2.0 connectors for Google Workspace, Outlook, Microsoft Teams, and Canvas.
- Sentral data acquisition via two-tier strategy:
  1. **Partnerships:** Seek official API or data exports with school approval.
  2. **Scraping fallback:** Headless browser workers that mimic mobile app requests, rotated via secure proxies and audited for compliance.
- Data normalization service that converts external events/assignments into a canonical “commitment” object with consistent metadata (category, urgency, estimated effort).

### 5.3 Security & Privacy
- Zero-trust architecture with role-based access controls for students, parents, and school administrators.
- Encryption at rest (PostgreSQL TDE) and in transit (TLS 1.3).
- Region-specific data residency to satisfy Australian privacy regulations (Australian Privacy Principles).
- Granular consent management for data sharing between students, guardians, and institutions.

## 6. Monetization Model
- **Free Tier:** Core calendar aggregation, basic Sentral sync, to-do list, and limited AI summaries.
- **Pro Tier ($5/month or $40/year):** Unlimited AI planning, grade analytics, advanced clash detection, and premium integrations (finance tracker, Teams/Discord bridging).
- **Institutional Plans:** Volume pricing for schools to unlock administrative dashboards, bulk provisioning, and priority support.
- **Student-friendly stance:** No ads, optional referral rewards, and transparent data policies.

## 7. Delivery Roadmap
| Phase | Timeline | Focus | Key Deliverables |
| --- | --- | --- | --- |
| **Foundations** | Months 0–2 | Research & infrastructure | User interviews, technical discovery for Sentral access, Supabase project, authentication scaffold |
| **MVP Build** | Months 2–4 | Core experience | Unified dashboard, Google Calendar sync, Sentral timetable import (scraper), task manager, push notifications |
| **Growth** | Months 4–8 | Intelligence & expansion | AI weekly summaries, assignment auto-sync, announcements feed, parent sharing, basic analytics |
| **Scale** | Months 8–12 | Integrations & monetization | Canvas/Moodle connectors, premium subscription, admin portal, compliance hardening |
| **Beyond** | 12+ months | Ecosystem & partnerships | School contracts, university pilots, financial integrations, third-party developer APIs |

## 8. Success Metrics
- **Engagement:** Daily active users / monthly active users (DAU/MAU) ratio above 35% for high school cohort.
- **Adoption:** 50% of invited parents/guardians accept calendar sharing within first three months of rollout.
- **Retention:** 60% of users return week-over-week after first month.
- **Automation impact:** 70% of assignments and exams ingested automatically (vs. manual creation).
- **Revenue:** Convert 10% of active students to Pro tier within six months of paid launch.

## 9. Risks & Mitigations
- **Sentral integration uncertainty:** Maintain active dialogue with Sentral while investing in compliant scraping fallback that can be easily disabled if official APIs become available.
- **Data privacy concerns:** Implement clear consent flows and transparent data handling documentation; pursue ASD Essential Eight alignment for enterprise trust.
- **User trust in AI recommendations:** Provide explainability ("why this suggestion?") and give users control to adjust or mute AI nudges.
- **Complex onboarding:** Offer templated setups (e.g., “NSW HSC student”) and guided tours to configure integrations quickly.

## 10. Next Steps
1. Conduct design sprints to storyboard the mobile and web dashboard experiences.
2. Prototype Sentral timetable ingestion using a small group of consenting students and validate reliability.
3. Build a closed alpha with Google Calendar sync, manual task creation, and AI weekly digest to gather qualitative feedback.
4. Formalize school partnership outreach with a privacy and compliance brief.

