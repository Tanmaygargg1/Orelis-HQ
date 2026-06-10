# Developer Guide — Orelis HQ

This document covers the full technical setup for Orelis HQ — the monorepo structure, the CMS, and how to work with both the app and content locally.

---

## Repo Structure

```
Orelis HQ/
  app/         Next.js app (the main product)
  content/     Markdown files — the team's knowledge base
  cms/         Next.js CMS (deployed at hq.orelisstudios.com)
```

All three live in the same GitHub repo: `Tanmaygargg1/Orelis-HQ`

The separation is intentional:
- `app/` is the product engineers build
- `content/` is the source of truth for product decisions, readable by Claude and the whole team
- `cms/` is the web interface for the content — non-technical team members never touch the repo directly

---

## Local Setup

### Prerequisites
- Node.js 18+
- Git

### Clone the repo

```bash
git clone https://github.com/Tanmaygargg1/Orelis-HQ.git
cd Orelis-HQ
```

### Run the app

```bash
cd app
npm install
cp .env.local.example .env.local   # fill in your values
npm run dev
```

### Run the CMS

```bash
cd cms
npm install
cp .env.local.example .env.local   # fill in your values
npm run dev   # runs on port 3001
```

---

## CMS Environment Variables

```env
GITHUB_TOKEN=ghp_...          # PAT with repo scope
GITHUB_OWNER=Tanmaygargg1
GITHUB_REPO=Orelis-HQ
CONTENT_PATH=content          # folder within the repo

NEXTAUTH_SECRET=...           # random 32-char string
NEXTAUTH_URL=http://localhost:3001

CMS_PASSWORD=...              # shared team password
```

For production, these are set in Vercel's environment variable dashboard.

---

## Architecture

### Auth
Simple shared password via NextAuth credentials. Stored in `CMS_PASSWORD` env var. No database needed — all auth is stateless JWT.

### Content reading/writing
The CMS uses the **GitHub REST API** (via `@octokit/rest`) to read and write files in the `content/` folder. Every save creates a commit. This means:
- Full history of all changes via git log
- No separate database for content
- Engineers can read/write content the normal way (git)

Relevant file: `cms/lib/github.ts`

### Tasks
Tasks are stored at `data/tasks.json` in the repo root — separate from `content/` so they don't clutter the knowledge base. Same GitHub API read/write approach.

Relevant file: `cms/app/api/tasks/route.ts`

### File routing
```
/content                    → lists root of content/
/content/Folder Name        → lists that folder
/content/My File.md         → opens file editor
```

The catch-all route `app/(dashboard)/content/[...path]/page.tsx` handles all three cases by calling `/api/files/[...path]` which in turn calls `github.ts`.

---

## Adding to the CMS

The CMS is a standard Next.js 14 App Router project. To add a new page:

1. Create `cms/app/(dashboard)/your-page/page.tsx`
2. Add a nav item to `cms/components/Sidebar.tsx`
3. Add an API route at `cms/app/api/your-route/route.ts` if needed

---

## Deployment

The CMS deploys to Vercel:
- **Root directory**: `cms`
- **Build command**: `npm run build`
- **Domain**: `hq.orelisstudios.com`

The app deploys separately (also Vercel) with its own root directory set to `app`.

---

## Working with Claude

Claude can read the entire repo — both `content/` (for product context) and `app/` (for code context). To get the most out of Claude:

- Keep `content/` up to date with decisions, feature specs, and UI notes
- Reference specific files when prompting: "read `content/UI Design Instructions.md` and update the login page"
- Claude commits directly to the repo via the CMS's GitHub API — every edit is tracked

---

## Git workflow

```bash
# Pull latest before starting work
git pull origin main

# After making changes
git add .
git commit -m "your message"
git push origin main
```

The CMS auto-commits content changes with messages like `Update content/My File.md`. Engineers working on `app/` should pull regularly to get the latest content.
