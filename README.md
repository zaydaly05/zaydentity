# FolioForge v2 — Professional AI Portfolio Studio

A privacy-first, database-free AI portfolio studio built with Next.js 16, React 19, and TypeScript. Your working portfolio is persisted locally in the browser and exported as a self-contained static website.

## 🚀 Key Features

### 🎨 Design System
- **11 Layout Templates**: Modern, Minimal, Creative, Terminal, Academic, Bento, Editorial, Brutalist, Glass, Neon, Timeline
- **12 Curated Themes**: Midnight, Paper, Ocean, Forest, Sunset, Monochrome, Violet, Rose, Amber, Slate, Coral, Aurora
- **Independent Content & Design**: Switch templates and themes freely without losing content or re-entering data
- **Responsive Preview Suite**: Instant desktop (1100px), tablet (760px), and mobile (390px) canvas switcher

### 🤖 AI, Automation & Auto-Detection
- **Hybrid AI Engine**: Connects to n8n webhooks or operates with built-in client/server AI fallback engine
- **Auto CV Extraction**: Import PDF/TXT/Markdown CV files or paste raw resume text to auto-detect name, title, contact info, experience, education, and projects
- **Auto Tech Stack Detection**: Scans project and experience descriptions in real time to suggest and auto-add missing tech skills
- **Auto Design Recommendation**: Analyzes candidate profession and skill set to suggest the ideal layout + theme pairing with 1-click application
- **Portfolio Copilot**: AI-assisted bio polishing, metric-oriented project enhancement, and section completeness audits
- **Publishing Health Scorecard**: Dynamic completion meter (0-100%) with 1-click auto-fix capabilities

### 🔒 Privacy & Architecture
- **No Database Needed**: Data stays saved locally in `localStorage`
- **Zero-Dependency Static Exporter**: Embeds images (Base64 data URLs) directly into self-contained HTML/ZIP files
- **Multi-Platform Deploy Wizard**: Step-by-step guidance for Vercel Drop, Netlify Drop, GitHub Pages, and static hosting

## 🛠️ Stack

- **Framework**: Next.js 16 (App Router), React 19
- **Language**: TypeScript (Strict)
- **Styling**: Vanilla CSS (Custom Design Tokens & Utilities)
- **Icons**: Lucide React
- **Orchestration**: n8n workflows (optional) / Built-in AI Engine (fallback)

## 🏁 Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 📄 n8n Configuration (Optional)

Copy `.env.example` to `.env.local`:

```env
N8N_CV_WEBHOOK_URL=http://localhost:5678/webhook/folioforge-cv-v2
N8N_AI_WEBHOOK_URL=http://localhost:5678/webhook/folioforge-ai-v2
N8N_NOTIFY_WEBHOOK_URL=http://localhost:5678/webhook/folioforge-deploy-v2
```

Import workflows from `n8n/` into your n8n instance. Note: If n8n is not configured, FolioForge automatically uses its built-in local AI engine!

## 📦 Publishing & Deployment

Click **ZIP** or **Deploy** in the top navigation bar. The studio generates a static `index.html` file that can be dropped into Vercel Drop (`vercel.com/drop`) or Netlify Drop with no build steps or backend servers.
