# FolioForge v2

A privacy-first AI portfolio studio. **No database.** Your working portfolio is persisted locally in the browser and exported as a self-contained static website.

## What is new in v2

- 7 portfolio layouts: Modern, Minimal, Creative, Terminal, Academic, Bento, Editorial
- 7 themes with independent layout/theme architecture
- CV → structured portfolio through n8n + AI
- AI Portfolio Copilot with custom prompts
- Local autosave with no account and no DB
- Undo / redo history
- Keyboard shortcuts
- Drag-to-reorder sections
- Section visibility controls
- Local profile/project image embedding
- Desktop / tablet / mobile preview
- One-click JSON export
- Dependency-free static ZIP export
- Vercel deployment wizard
- Publishing health checklist
- Privacy-first workflow messaging

## Stack

Next.js 16, React 19, TypeScript, CSS, n8n, your chosen LLM provider.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## n8n

Copy `.env.local.example` to `.env.local` and configure:

```env
N8N_CV_WEBHOOK_URL=http://localhost:5678/webhook/folioforge-cv-v2
N8N_AI_WEBHOOK_URL=http://localhost:5678/webhook/folioforge-ai-v2
FOLIOFORGE_LLM_URL=https://your-provider.example/v1/chat/completions
FOLIOFORGE_LLM_KEY=your-key
FOLIOFORGE_LLM_MODEL=your-model
```

Import both JSON workflows from `n8n/` into your n8n instance. Configure the LLM endpoint and credentials as environment variables in n8n.

## No database

FolioForge deliberately does not use PostgreSQL, Supabase, MongoDB or another DB in v2. The builder stores the current JSON in `localStorage`. Images are kept as data URLs and embedded in the static export.

## Export / deploy

Use **ZIP** in the top bar or the **Deploy** wizard. The exporter creates `index.html` and `README.md`. The generated site is static and can be deployed to Vercel without a backend.

## Important accuracy rule

AI extraction is treated as a draft. The UI explicitly asks the user to review extracted facts before publishing. The AI workflows are instructed not to invent missing employers, degrees, projects, skills or achievements.
