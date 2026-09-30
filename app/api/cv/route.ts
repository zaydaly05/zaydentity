import { NextResponse } from 'next/server';
import { cleanPDFNoise, parseCVText } from '@/lib/ai-engine';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const webhook = process.env.N8N_CV_WEBHOOK_URL;

  try {
    const contentType = request.headers.get('content-type') || '';

    // Handle raw text / JSON body (Direct text paste)
    if (contentType.includes('application/json')) {
      const { text, rawText } = await request.json();
      const cvText = text || rawText || '';
      if (!cvText.trim()) {
        return NextResponse.json({ error: 'CV text cannot be empty.' }, { status: 400 });
      }
      const portfolioData = parseCVText(cvText);
      return NextResponse.json({ portfolio: portfolioData, source: 'ai-parser-local' });
    }

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

    // Smart Local Fallback Extractor with pdf-parse node entry
    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = '';

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') || buffer.slice(0, 5).toString() === '%PDF-';

    if (isPdf) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { parse } = require('pdf-parse/node');
        const pdfData = await parse(buffer);
        extractedText = pdfData.text || pdfData.content || '';
      } catch {
        // Fallback to pdf-parse main or string cleaning
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

    const portfolioData = parseCVText(extractedText);
    return NextResponse.json({
      portfolio: portfolioData,
      source: webhook ? 'n8n-fallback' : 'local-ai-parser',
      message: 'CV extracted cleanly using FolioForge PDF parser & auto-detection engine.'
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'CV processing failed.' },
      { status: 500 }
    );
  }
}
