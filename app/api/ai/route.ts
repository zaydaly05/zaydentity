import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { runLocalAIAction } from '@/lib/ai-engine';

export const runtime = 'nodejs';

/**
 * Powerful Multi-Agent AI API Route powered by Google Gemini 3.8 Flash & Fallback Engine.
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { action, prompt, portfolio, roleTarget } = payload;

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // Check if Google Gemini API key is configured
    if (apiKey) {
      try {
        const client = new GoogleGenAI({ apiKey });

        let systemInstruction = `You are FolioForge Senior AI Portfolio Architect & Resume Agent. Your goal is to optimize, polish, and structure developer portfolios for maximum impact. Output clean, concise, professional content.`;
        let userPrompt = prompt || action || 'Optimize this portfolio';

        if (roleTarget) {
          systemInstruction += ` Focus on tailoring the portfolio for a ${roleTarget} role.`;
        }

        if (portfolio) {
          userPrompt += `\n\nCurrent Portfolio Context:\nName: ${portfolio.data.personal.name}\nTitle: ${portfolio.data.personal.title}\nAbout: ${portfolio.data.personal.about}\nSkills: ${portfolio.data.skills.join(', ')}`;
        }

        let aiText = '';

        // Try Gemini 3.8 Flash via SDK
        try {
          const interaction = await client.interactions.create({
            model: 'gemini-3.8-flash',
            input: `${systemInstruction}\n\nTask: ${userPrompt}`
          });
          aiText = interaction.output_text || '';
        } catch {
          // Fallback to generateContent or gemini-flash-latest
          try {
            const res = await client.models.generateContent({
              model: 'gemini-flash-latest',
              contents: `${systemInstruction}\n\nTask: ${userPrompt}`
            });
            aiText = res.text || '';
          } catch {
            aiText = '';
          }
        }

        if (aiText && aiText.trim()) {
          // Apply Gemini output to portfolio structure
          const next = JSON.parse(JSON.stringify(portfolio || {}));
          if (next?.data?.personal) {
            if (prompt?.toLowerCase().includes('about') || action?.toLowerCase().includes('about')) {
              next.data.personal.about = aiText.trim().slice(0, 600);
            } else if (prompt?.toLowerCase().includes('title')) {
              next.data.personal.title = aiText.trim().split('\n')[0].slice(0, 60);
            }
          }
          return NextResponse.json({
            portfolio: next,
            message: `⚡ Gemini 3.8 Flash Agent: ${aiText.slice(0, 160)}...`,
            model: 'gemini-3.8-flash',
            aiGeneratedText: aiText
          });
        }
      } catch {
        // Fallback to local AI engine if Gemini call encounters network/key error
      }
    }

    // Fallback to local AI engine if GEMINI_API_KEY is not set or network is offline
    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio data is required.' }, { status: 400 });
    }

    const localResult = runLocalAIAction(action || 'assistant', prompt || '', portfolio);
    return NextResponse.json({
      ...localResult,
      model: 'local-ai-engine-v2'
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI agent execution failed.' },
      { status: 500 }
    );
  }
}
