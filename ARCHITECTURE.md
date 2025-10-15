# System Architecture Overview

## 🏗️ Application Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                              │
└─────────────────────────────────────────────────────────────────┘

1. HOMEPAGE (/)
   │
   ├─→ Start Skin Analysis
   │   │
   │   ├─→ 2. PHOTO CAPTURE (/skin-analysis)
   │   │   │
   │   │   ├─→ Take Photo (Mobile Camera)
   │   │   ├─→ Upload File (Desktop/Mobile)
   │   │   └─→ Drag & Drop
   │   │
   │   ├─→ 3. AI ANALYSIS
   │   │   │
   │   │   ├─→ Upload to Supabase Storage
   │   │   ├─→ Create Case Record
   │   │   ├─→ OpenAI Vision API Analysis
   │   │   └─→ Store Analysis Results
   │   │
   │   ├─→ 4. REVIEW RESULTS
   │   │   │
   │   │   ├─→ View AI Confidence Score
   │   │   ├─→ See Detected Conditions
   │   │   ├─→ Read Recommendations
   │   │   └─→ Submit for Professional Review
   │   │
   │   └─→ 5. CASE SUBMITTED
   │       │
   │       └─→ View Case Details (/cases/[caseId])
   │
   └─→ For Professionals (/dermatologist/cases)
       │
       ├─→ View Pending Cases
       ├─→ Review Case Details
       ├─→ Provide Professional Diagnosis
       └─→ Submit Review → Generate User Report

```

## 🗂️ Database Schema

```
┌──────────────────────────────────────────────────────────────────┐
│                      SUPABASE TABLES                             │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│     CASES       │
├─────────────────┤
│ id (UUID)       │◄──┐
│ user_id         │   │
│ status          │   │
│ image_url       │   │
│ thumbnail_url   │   │
│ created_at      │   │
│ updated_at      │   │
└─────────────────┘   │
                      │
                      │
┌─────────────────────┐ │
│ ANALYSIS_RESULTS    │ │
├─────────────────────┤ │
│ id (UUID)           │ │
│ case_id             │─┘
│ ai_confidence_score │
│ detected_conditions │ (JSONB)
│ severity            │
│ recommendations     │
│ analysis_metadata   │ (JSONB)
└─────────────────────┘
      │
      │
      ▼
┌──────────────────────────┐
│ DERMATOLOGIST_REVIEWS    │
├──────────────────────────┤
│ id (UUID)                │
│ case_id                  │
│ dermatologist_id         │
│ status                   │
│ professional_diagnosis   │
│ treatment_recommendations│
│ agrees_with_ai           │
│ notes                    │
│ urgency_level            │
│ reviewed_at              │
└──────────────────────────┘
      │
      │
      ▼
┌─────────────────────┐
│   USER_REPORTS      │
├─────────────────────┤
│ id (UUID)           │
│ case_id             │
│ report_data (JSONB) │
│ created_at          │
└─────────────────────┘
```

## 🔐 Security Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    ROW LEVEL SECURITY (RLS)                      │
└──────────────────────────────────────────────────────────────────┘

CASES TABLE:
├─ Users: Can view/insert/update their own cases
└─ Dermatologists: Can view submitted cases

ANALYSIS_RESULTS TABLE:
├─ Users: Can view results for their cases
├─ Service Role: Can insert results
└─ Dermatologists: Can view all results

DERMATOLOGIST_REVIEWS TABLE:
├─ Users: Can view reviews for their cases
└─ Dermatologists: Can insert/view their own reviews

USER_REPORTS TABLE:
├─ Users: Can view their own reports
└─ Service Role: Can insert reports

STORAGE (skin-images bucket):
├─ Users: Can upload to their folder, view their images
└─ Dermatologists: Can view all images
```

## 🔄 API Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        API ENDPOINTS                              │
└──────────────────────────────────────────────────────────────────┘

USER FLOW:
POST /api/cases/upload
  ├─ Authenticate user
  ├─ Process image with Sharp
  ├─ Upload to Supabase Storage
  ├─ Create case record
  └─ Return case ID
      │
      ▼
POST /api/cases/analyze
  ├─ Authenticate user
  ├─ Fetch case data
  ├─ Call OpenAI Vision API
  ├─ Parse AI response
  ├─ Store analysis results
  ├─ Update case status
  └─ Return analysis
      │
      ▼
POST /api/cases/submit-for-review
  ├─ Authenticate user
  ├─ Validate case status
  ├─ Update status to 'submitted_for_review'
  └─ Return success
      │
      ▼
GET /api/cases/[caseId]
  ├─ Authenticate user
  ├─ Verify ownership
  ├─ Fetch case with relations
  └─ Return complete case data

DERMATOLOGIST FLOW:
GET /api/dermatologist/cases
  ├─ Authenticate user
  ├─ Verify dermatologist role
  ├─ Fetch pending cases
  └─ Return case list
      │
      ▼
POST /api/dermatologist/review
  ├─ Authenticate user
  ├─ Verify dermatologist role
  ├─ Create review record
  ├─ Update case status
  ├─ Generate user report (if approved)
  ├─ Mark case as completed
  └─ Return success
```

## 🎨 Component Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         PAGES                                     │
└──────────────────────────────────────────────────────────────────┘

app/
├── page.tsx                    # Landing page with hero & features
├── layout.tsx                  # Root layout with metadata
│
├── skin-analysis/
│   └── page.tsx               # Main user workflow
│       ├── PhotoCapture       # Photo upload component
│       ├── LoadingSpinner     # Loading states
│       └── Analysis Results   # Display AI analysis
│
├── cases/[caseId]/
│   └── page.tsx               # Case details & report view
│       ├── Image Display
│       ├── AI Analysis Section
│       ├── Dermatologist Review Section
│       └── User Report Section
│
└── dermatologist/cases/
    └── page.tsx               # Dermatologist dashboard
        ├── Case Grid
        ├── ReviewModal
        └── Review Form

┌──────────────────────────────────────────────────────────────────┐
│                       COMPONENTS                                  │
└──────────────────────────────────────────────────────────────────┘

components/
├── PhotoCapture.tsx
│   ├── File input handling
│   ├── Camera capture (mobile)
│   ├── Drag & drop support
│   ├── Image preview
│   └── Validation (type, size)
│
└── LoadingSpinner.tsx
    ├── Size variants (sm, md, lg)
    └── Optional text display
```

## 🎯 State Management

```
┌──────────────────────────────────────────────────────────────────┐
│                     CLIENT STATE                                  │
└──────────────────────────────────────────────────────────────────┘

/skin-analysis (User Workflow):
├── step: 'upload' | 'analyzing' | 'results' | 'submitted'
├── caseId: string | null
├── analysis: AnalysisData | null
├── error: string | null
└── isProcessing: boolean

/cases/[caseId] (Case Details):
├── caseData: CaseData | null
├── loading: boolean
└── error: string | null

/dermatologist/cases (Review Dashboard):
├── cases: Case[]
├── loading: boolean
├── error: string | null
└── selectedCase: Case | null

Review Modal:
├── status: 'approved' | 'requires_resubmission'
├── professionalDiagnosis: string
├── treatmentRecommendations: string
├── agreesWithAi: boolean
├── urgencyLevel: SeverityLevel
├── notes: string
├── isSubmitting: boolean
└── error: string | null
```

## 🔧 Technology Stack

```
┌──────────────────────────────────────────────────────────────────┐
│                       TECH STACK                                  │
└──────────────────────────────────────────────────────────────────┘

Frontend:
├── Next.js 15         → React framework with App Router
├── React 19           → UI library
├── TypeScript         → Type safety
├── Tailwind CSS v4    → Styling
└── Sharp              → Image processing

Backend:
├── Next.js API Routes → Serverless functions
├── Supabase           → Database & Storage & Auth
│   ├── PostgreSQL     → Relational database
│   ├── Storage        → File storage
│   └── Auth           → User authentication
└── OpenAI API         → GPT-4o Vision for analysis

Infrastructure:
├── Vercel             → Hosting (recommended)
├── Supabase Cloud     → Backend infrastructure
└── OpenAI Platform    → AI processing
```

## 📊 Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                                  │
└──────────────────────────────────────────────────────────────────┘

1. IMAGE UPLOAD
   User Device → Next.js API → Sharp Processing → Supabase Storage
                                                        │
                                                        ▼
2. CASE CREATION                                   Image URLs
   Next.js API → Supabase Database (cases table) ← ─ ─ ┘
        │
        ▼
3. AI ANALYSIS
   Next.js API → OpenAI GPT-4o Vision → Parse Response
                                              │
                                              ▼
   Supabase Database (analysis_results table)
        │
        ▼
4. DERMATOLOGIST REVIEW
   Next.js API → Supabase Database (dermatologist_reviews table)
                          │
                          ▼
5. REPORT GENERATION
   Next.js API → Supabase Database (user_reports table)
                          │
                          ▼
6. USER VIEWS REPORT
   Next.js Page ← Supabase Database (all related data)
```

## 🔒 Authentication Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION                                  │
└──────────────────────────────────────────────────────────────────┘

1. User Signs Up/In
   Frontend → Supabase Auth → JWT Token
                                  │
                                  ▼
2. Token Stored                Cookie
   │
   ▼
3. API Requests
   Frontend → Next.js API → Verify JWT → Supabase Client
                                              │
                                              ▼
4. RLS Enforcement                      Check Permissions
   │
   ▼
5. Data Access Granted/Denied
```

## 🚀 Performance Optimizations

```
┌──────────────────────────────────────────────────────────────────┐
│                      OPTIMIZATIONS                                │
└──────────────────────────────────────────────────────────────────┘

Images:
├── Sharp processing    → Optimize before upload
├── Thumbnails          → Faster loading in lists
├── Next.js Image       → Automatic optimization
└── Lazy loading        → Load on demand

Database:
├── Indexes             → Fast queries
├── RLS                 → Security without app logic
└── Single queries      → Fetch related data together

Frontend:
├── Server Components   → Reduce client bundle
├── Client Components   → Only where needed
├── Suspense            → Progressive loading
└── Code splitting      → Faster initial load

API:
├── Serverless          → Auto-scaling
├── Edge deployment     → Low latency
└── Caching             → Reduce redundant calls
```

---

This architecture provides a scalable, secure, and performant foundation for the skin analysis platform.


