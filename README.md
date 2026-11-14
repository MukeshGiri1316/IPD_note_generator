# 🏥 IPD Notes Generator & Clinical Documentation System

A clinical documentation web application built with **Next.js 16 (App Router), TypeScript, PostgreSQL (Neon), Prisma ORM, and OpenAI API**. It integrates with the existing high-fidelity Playwright PDF generation pipeline to generate official Inpatient Department (IPD) clinical notes with handwriting typography.

---

## 🌟 Key Features

### 1. Inpatient Clinical Note Generation
- **Patient Management**: Register patient demographics, search by name, patient registration number, or IPD admission number.
- **Admission Management**: Track IPD admission dates, discharge dates, primary and secondary diagnoses, symptoms, clinical history, examination findings, and treatments.
- **Structured AI Generation**: Uses OpenAI API to generate structured clinical sections without fabricating data.
- **Section-Level AI Regeneration**: Regenerate individual sections (e.g. Clinical History, Hospital Course, Discharge Advice) without overwriting the rest of the document.
- **Interactive Document Editor**: Edit sections manually, save drafts, and track revision history.
- **Single-Page A4 Live Preview**: Accurate React document preview matching the hospital stationery layout.
- **Kalam Handwriting Typography**: Embeds locally hosted Kalam font for clinical entries, keeping fixed hospital headings and tables clean and formal.
- **Clinician Approval Workflow**: Role-based access control where authorized clinicians (Doctors/Admins) review and approve clinical notes before locking them against further edits.
- **Audit Logging**: Full audit trail of user logins, registrations, patient creations, admissions, note generations, edits, and approvals.

### 2. Preserved Lab Report Generator
- Preserves all pre-existing lab report functionality (`/`): Excel/CSV batch uploads, interactive preview, Playwright PDF generation, and multi-file ZIP downloads.

---

## 🏗️ Technology Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** | App Router framework for frontend and server-side API routes |
| **React 19** | UI components and document template rendering |
| **TypeScript 5** | Strict type safety across the entire application |
| **Tailwind CSS v4** | Clean, minimal inline utility styling |
| **PostgreSQL (Neon)** | Cloud relational database with connection pooling |
| **Prisma ORM (v6)** | Database schema management, migrations, and type-safe queries |
| **OpenAI & Google Gemini** | Structured clinical note generation and section regeneration |
| **Playwright** | Chromium browser-based server-side A4 PDF generation |
| **Zod** | Server-side API and AI structured output validation |
| **React Hook Form** | Type-safe form management with validation |

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the project root based on `.env.example`:

```env
# Neon PostgreSQL Connection Strings
DATABASE_URL="postgresql://user:password@ep-xyz-pooler.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require"

# AI Configuration — Select either "openai" or "gemini"
AI_PROVIDER="openai" # Options: "openai" | "gemini"

# OpenAI Configuration (used when AI_PROVIDER="openai")
OPENAI_API_KEY="sk-proj-..."
OPENAI_MODEL="gpt-4o"

# Google Gemini Configuration (used when AI_PROVIDER="gemini")
GEMINI_API_KEY="AIzaSy..."
GEMINI_MODEL="gemini-2.5-flash"

# Application Secret for Session Encryption (HMAC)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AUTH_SECRET="your-64-character-hex-secret-key"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🚀 Database Setup & Migrations

1. Ensure your Neon PostgreSQL database is created and `DATABASE_URL` / `DIRECT_URL` are configured in `.env`.
2. Generate the Prisma Client:
   ```bash
   npx prisma generate
   ```
3. Push the schema to your Neon database:
   ```bash
   npx prisma db push
   ```
4. Seed the default document template (`Discharge Summary`):
   ```bash
   npx tsx prisma/seed.ts
   ```
   *(Note: The application also automatically ensures the default template exists on first document creation).*

---

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build & Start
```bash
npm run build
npm start
```

---

## 📂 Application Navigation & Routes

| Route | Description |
|---|---|
| `/` | **Lab Report Generator** (Batch Excel upload & ZIP download) |
| `/login` | Clinician & staff sign-in |
| `/register` | User registration (first registered user automatically becomes **ADMIN**) |
| `/dashboard` | IPD clinical portal overview with stats & recent admissions |
| `/patients` | Searchable patient registry |
| `/patients/new` | Register a new patient |
| `/patients/[id]` | Patient details & IPD admission history |
| `/admissions/new` | Create an IPD admission for a patient |
| `/admissions/[id]` | Admission details & generated notes |
| `/documents` | List of all clinical notes with status filters |
| `/documents/create` | **IPD Note Generation Wizard** (Select admission → AI generate → Edit → Save) |
| `/documents/[id]` | Note detail, live preview, version history, clinician approval & PDF download |

---

## 🔒 Security & Clinical Safety

- **Server-Side API Keys**: OpenAI and database credentials never leak to client-side code.
- **Strict Role-Based Access Control**:
  - `STAFF`: Can create patients, admissions, and draft clinical notes.
  - `DOCTOR`: Can generate notes, edit drafts, and officially **approve** documents.
  - `ADMIN`: Full administrative control, user management, and template configuration.
- **Immutable Historical Versions**: Every save creates a new `DocumentVersion` snapshot, preserving the original AI-generated text and clinician edits.
- **Clinician Review Required**: All generated notes are labeled as drafts until reviewed and explicitly approved by an authorized clinician.
