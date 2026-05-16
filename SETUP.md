# PEA Assessment Platform - Phase 1 Complete Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account (free tier works)
- PostgreSQL database (via Supabase)

### Installation

1. **Clone and install dependencies**
```bash
cd pea-placement-test
npm install
# or
pnpm install
```

2. **Setup Environment Variables**

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Get these from: https://app.supabase.com/project/[YOUR_PROJECT_ID]/settings/api

3. **Setup Database**

```bash
# Push Prisma schema to database
npx prisma db push

# (Optional) Seed initial data
npx prisma db seed
```

4. **Run Development Server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in browser.

---

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── [locale]/       # Internationalized pages
│   │   ├── login/      # Login page
│   │   ├── signup/     # Signup page
│   │   ├── student/    # Student pages
│   │   ├── teacher/    # Teacher pages
│   │   ├── admin/      # Admin pages
│   │   └── placement/  # Placement test (no auth)
│   └── api/            # API routes
│       ├── tests/      # Test endpoints
│       ├── questions/  # Question endpoints
│       ├── attempts/   # Test attempt endpoints
│       └── analytics/  # Analytics endpoints
├── modules/            # Feature modules (server actions)
│   ├── auth/          # Authentication actions
│   ├── assessment/    # Question bank actions
│   ├── test/          # Test management actions
│   ├── course/        # Course/Class actions
│   └── analytics/     # Analytics calculations
├── lib/               # Shared utilities
│   ├── supabase/     # Supabase client setup
│   ├── prisma.ts     # Prisma client
│   └── utils.ts      # Helper functions
├── components/        # Reusable React components
│   └── ui/           # shadcn/ui components
└── i18n/             # Internationalization
    ├── routing.ts    # i18n routing config
    └── request.ts    # i18n request handler

messages/              # Translation files
├── en.json
└── vi.json
```

---

## 🔐 Authentication Flow

### Email/Password
1. User signs up on `/signup` page
2. Supabase creates auth user
3. `syncUserToDB()` creates database record
4. User can login on `/login`

### Google OAuth
1. Click "Continue with Google" on `/login` or `/signup`
2. Redirect to Google consent screen
3. Callback to `/auth/callback`
4. Auto-sync user to database
5. Redirect to role-based dashboard

### Role-Based Access
Middleware checks user role and redirects:
- `super_admin` / `academic_manager` → `/admin/dashboard`
- `teacher` → `/teacher/dashboard`
- `student` → `/student/dashboard`

---

## 📚 Key Features Implemented

### Phase 1 Complete ✅

#### Authentication & Users
- [x] Email/Password login & signup
- [x] Google OAuth integration
- [x] Role-based access control (RBAC)
- [x] User sync to PostgreSQL

#### Course & Class Management
- [x] Create courses
- [x] Create classes within courses
- [x] Generate class codes
- [x] Join class by code
- [x] Add students to classes

#### Question Bank
- [x] Hierarchical folders
- [x] Question types: MCQ, Fill-in-blank, Essay, True/False, Matching
- [x] 6 skill levels: Listening, Reading, Writing, Speaking, Grammar, Vocabulary
- [x] Difficulty levels: Easy, Medium, Hard
- [x] Question options with correct answer marking
- [x] Media support (audio, images)
- [x] Tagging system

#### Test Builder
- [x] Create tests with multiple sections
- [x] Assign questions to sections
- [x] Set duration per section
- [x] Configure test settings:
  - Allow anonymous attempts
  - Allow retries
  - Max attempts limit
  - Answer visibility modes

#### Test Taking
- [x] Timer per section
- [x] Progress bar
- [x] Sidebar navigation
- [x] Different question types UI
- [x] Auto-save on submit
- [x] Auto-scoring for MCQ/True-False

#### Results & Analytics
- [x] Calculate scores by skill
- [x] Performance breakdown by question type
- [x] Attempt history
- [x] Leaderboard snapshots
- [x] Student skill score tracking

#### Placement Test
- [x] Anonymous test taking (no login required)
- [x] Lead form collection
- [x] Results display
- [x] No account needed

#### Dashboards
- [x] Student dashboard (classes, stats)
- [x] Teacher dashboard (classes, tests)
- [x] Admin dashboard (system overview)

#### Pages & UI
- [x] Login page
- [x] Signup page
- [x] Auth callback page
- [x] Student dashboard
- [x] Teacher dashboard
- [x] Admin dashboard
- [x] Question bank
- [x] Test taker
- [x] Results page
- [x] Placement test
- [x] Error pages (404, 500)

#### API Endpoints
- [x] `GET/POST /api/tests` - Manage tests
- [x] `GET/POST /api/questions` - Manage questions
- [x] `POST /api/attempts` - Start attempt
- [x] `PUT /api/attempts/[id]` - Submit attempt
- [x] `GET /api/attempts/[id]` - Get results
- [x] `GET /api/analytics` - Analytics data

#### Internationalization
- [x] EN / VI languages
- [x] Dynamic locale routing
- [x] Translation messages

---

## 🛠️ Development Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio

# Format code
npx prettier --write .
```

---

## 🗄️ Database Schema

Key models:
- **User** - Users with roles (student, teacher, admin)
- **Course** - Courses created by teachers
- **Class** - Classes within courses
- **ClassStudent** - Student enrollments
- **QuestionFolder** - Hierarchical question organization
- **Question** - Questions with multiple types
- **QuestionOption** - MCQ options
- **QuestionMedia** - Audio/image attachments
- **Test** - Tests/exams
- **TestSection** - Sections within tests
- **TestQuestion** - Questions in sections
- **TestAttempt** - Student test attempts
- **AttemptAnswer** - Student answers
- **StudentSkillScore** - Performance by skill
- **LeaderboardSnapshot** - Class rankings
- **StudyGoal** - Student goals

---

## 🔄 Common Workflows

### Create & Assign Test

```typescript
// 1. Create questions
const question = await createQuestion({
  type: 'mcq',
  skill: 'reading',
  content: 'Question content...',
  options: [
    { content: 'A', isCorrect: true },
    { content: 'B', isCorrect: false }
  ]
})

// 2. Create test
const test = await createTest({
  title: 'English Test 1',
  type: 'normal',
  classId: 'class-id',
  sections: [{
    title: 'Reading',
    skill: 'reading',
    durationMinutes: 30,
    questionIds: [question.id]
  }]
})

// 3. Publish test - students can now see it in class
```

### Student Takes Test

```typescript
// 1. Start attempt
const attempt = await startTestAttempt(testId)

// 2. Answer questions (auto-saved)
// UI updates answers state

// 3. Submit
await submitTestAttempt(attemptId, answers)

// 4. View results
const results = await getAttemptResults(attemptId)
```

### View Analytics

```typescript
// For student
const performance = await getStudentPerformance(studentId)

// For class
const classAnalytics = await getClassAnalytics(classId)

// Get skill breakdown
const skillScores = await getStudentSkillScores(studentId)
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect to Vercel: https://vercel.com/new
3. Set environment variables
4. Deploy

### Other Platforms

```bash
npm run build
npm start
```

Ensure `DATABASE_URL` and `DIRECT_URL` are set in production.

---

## ⚠️ Important Notes

1. **Database Migrations**: Use `npx prisma migrate dev` for local development
2. **Prisma Studio**: `npx prisma studio` to view/edit data in browser
3. **Auth Callback**: Ensure `NEXT_PUBLIC_SITE_URL` matches your deployment URL
4. **Supabase RLS**: Configure Row Level Security policies in Phase 2 for security
5. **Error Handling**: All server actions throw errors that should be caught in UI

---

## 📋 Phase 2 TODO

- [ ] Advanced analytics & reporting
- [ ] Leaderboard UI
- [ ] Study goals UI
- [ ] Export reports (PDF/Excel)
- [ ] Email notifications
- [ ] Anti-cheat measures
- [ ] Teacher feedback UI
- [ ] Speech-to-text for speaking
- [ ] File uploads (audio/images)
- [ ] Supabase RLS policies

---

## 🤝 Support

For issues or questions:
1. Check existing documentation
2. Review Prisma docs: https://www.prisma.io/docs
3. Supabase docs: https://supabase.com/docs
4. Next.js docs: https://nextjs.org/docs

---

## 📝 License

PEA Education Platform - All Rights Reserved
