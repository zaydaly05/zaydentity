# FolioForge v2 Setup

## 1. Requirements

- Node.js 20+
- n8n (local or hosted)
- An LLM endpoint compatible with your n8n HTTP Request node

## 2. Start the builder

```bash
npm install
npm run dev
```

## 3. Start n8n locally

```bash
docker compose up -d
```

Open http://localhost:5678 and import:

- `n8n/cv-to-portfolio.json`
- `n8n/ai-review.json`
- `n8n/deploy-notify.json`

## 4. Configure environment

Create `.env.local`:

```env
N8N_CV_WEBHOOK_URL=http://localhost:5678/webhook/folioforge-cv-v2
N8N_AI_WEBHOOK_URL=http://localhost:5678/webhook/folioforge-ai-v2
N8N_NOTIFY_WEBHOOK_URL=http://localhost:5678/webhook/folioforge-notify-v2
```

Configure these variables in n8n for the AI HTTP Request nodes:

```env
FOLIOFORGE_LLM_URL=https://your-provider.example/v1/chat/completions
FOLIOFORGE_LLM_KEY=...
FOLIOFORGE_LLM_MODEL=...
```

The sample workflow expects an OpenAI-compatible chat-completions shape. Replace the HTTP Request node with your provider's node if needed.

Configure these variables in n8n for the deploy-notify workflow (WhatsApp Cloud API):

```env
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_NOTIFY_TO=+20...
```

When a user fills in their name and deployment link in the app's Deploy modal, that data is POSTed to `/api/notify`, which forwards it to this webhook and on to WhatsApp. This happens automatically in the background (no button, no external app opened on the user's device) and is disclosed in-app via the modal's copy — make sure that stays true if you customize it.

## 5. Test without n8n

The UI works immediately with demo data. Design, content, sections, media, local autosave, preview, JSON export and static ZIP export do not require n8n.

## 6. Vercel

Build the builder itself normally:

```bash
npm run build
```

For a user's generated portfolio, use the built-in ZIP exporter and follow the Vercel deployment wizard.
