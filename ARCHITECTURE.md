# FolioForge v2 Architecture

```text
                    Next.js / React
                           |
             +-------------+-------------+
             |                           |
        Visual Editor                API routes
             |                           |
       Portfolio JSON              +----+----+
             |                     |         |
             |                    n8n       n8n
             |                    CV        AI
             |                     |         |
             +---------------------+---------+
                           |
                     Local Browser
                     localStorage
                           |
                     Static Export
                           |
                         Vercel
```

## Principles

1. **No DB in v2.** The browser is the local workspace.
2. **Content is independent from design.** Portfolio JSON is the source of truth.
3. **n8n is the orchestration layer.** It handles CV extraction and AI workflows.
4. **AI returns structured data.** The editor controls the final rendering.
5. **User approval is required.** AI output is never silently treated as verified fact.
6. **Static publishing.** Generated portfolios do not require a backend.
7. **Provider agnostic.** The n8n HTTP Request node can point to an OpenAI-compatible endpoint or be replaced with a native provider node.
