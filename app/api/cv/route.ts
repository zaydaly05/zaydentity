import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { cleanPDFNoise, parseCVText } from '@/lib/ai-engine';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const webhook = process.env.N8N_CV_WEBHOOK_URL;
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  try {
    const contentType = request.headers.get('content-type') || '';
    let extractedText = '';

    // Handle raw text / JSON body (Direct text paste)
    if (contentType.includes('application/json')) {
      const { text, rawText } = await request.json();
      extractedText = text || rawText || '';
      if (!extractedText.trim()) {
        return NextResponse.json({ error: 'CV text cannot be empty.' }, { status: 400 });
      }
    } else {
      // Handle multipart form data (File upload)
      const incoming = await request.formData();
      const file = incoming.get('file');
      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'A CV file is required.' }, { status: 400 });
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Maximum CV size is 10 MB.' }, { status: 413 });
      }

      // Try n8n if webhook is configured
      if (webhook) {
        try {
          const body = new FormData();
          body.append('file', file, file.name);
          body.append('source', 'folioforge-v2');
          const response = await fetch(webhook, { method: 'POST', body, cache: 'no-store' });
          const resText = await response.text();
          if (response.ok) {
            try {
              return NextResponse.json(JSON.parse(resText));
            } catch {
              // fallback
            }
          }
        } catch {
          // n8n failed, proceed to local smart parser fallback
        }
      }

      // Smart Local Extractor with pdf-parse node entry
      const buffer = Buffer.from(await file.arrayBuffer());
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') || buffer.slice(0, 5).toString() === '%PDF-';

      if (isPdf) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { parse } = require('pdf-parse/node');
          const pdfData = await parse(buffer);
          extractedText = pdfData.text || pdfData.content || '';
        } catch {
          try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const pdfParse = require('pdf-parse');
            const pdfData = await (pdfParse.default || pdfParse)(buffer);
            extractedText = pdfData.text || '';
          } catch {
            extractedText = cleanPDFNoise(buffer.toString('utf-8'));
          }
        }
      } else {
        extractedText = buffer.toString('utf-8');
      }
    }

    // High-Precision Extraction with Google Gemini 3.8 Flash Agent if key is configured
    if (apiKey && extractedText.trim()) {
      try {
        const client = new GoogleGenAI({ apiKey });
        const prompt = `Extract developer portfolio data from this CV text into JSON format matching these keys:
personal: { name, title, location, email, phone, about },
social: { github, linkedin, website },
skills: string[],
experience: [{ id, company, role, period, description }],
projects: [{ id, title, description, technologies: string[], github, live }],
education: [{ id, institution, degree, period }],
activities: string[],
softSkills: string[],
languages: string[]

CV Content:
${cleanPDFNoise(extractedText.slice(0, 8000))}`;

        let geminiJsonStr = '';

        try {
          const interaction = await client.interactions.create({
            model: 'gemini-3.8-flash',
            input: prompt
          });
          geminiJsonStr = interaction.output_text || '';
        } catch {
          const res = await client.models.generateContent({
            model: 'gemini-flash-latest',
            contents: prompt
          });
          geminiJsonStr = res.text || '';
        }

        if (geminiJsonStr) {
          const jsonMatch = geminiJsonStr.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsedData = JSON.parse(jsonMatch[0]);
            if (parsedData.personal && parsedData.skills) {
              return NextResponse.json({
                portfolio: parsedData,
                source: 'gemini-3.8-flash-agent',
                message: '⚡ High-precision CV extraction completed via Google Gemini 3.8 Flash Agent.'
              });
            }
          }
        }
      } catch {
        // Fallback to local rule-based auto-detection
      }
    }

    // Fallback to FolioForge Rule-Based Auto-Detection Engine
    const portfolioData = parseCVText(extractedText);
    return NextResponse.json({
      portfolio: portfolioData,
      source: 'folioforge-local-ai-engine',
      message: 'CV extracted cleanly using FolioForge auto-detection engine.'
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'CV processing failed.' },
      { status: 500 }
    );
  }
}
