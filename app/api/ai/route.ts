import { NextResponse } from 'next/server';
import { runLocalAIAction } from '@/lib/ai-engine';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const webhookUrl = process.env.N8N_AI_WEBHOOK_URL;

  try {
    const payload = await request.json();
    const { action, prompt, portfolio } = payload;

    if (webhookUrl) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          cache: 'no-store',
        });

        const responseText = await response.text();
        if (response.ok) {
          try {
            return NextResponse.json(JSON.parse(responseText));
          } catch {
            return NextResponse.json({ message: responseText });
          }
        }
      } catch {
        // Fallback to local AI engine
      }
    }

    // Local AI Engine execution fallback
    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio data is required.' }, { status: 400 });
    }

    const result = runLocalAIAction(action || 'assistant', prompt || '', portfolio);
    return NextResponse.json(result);

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI workflow failed.' },
      { status: 500 }
    );
  }
}
