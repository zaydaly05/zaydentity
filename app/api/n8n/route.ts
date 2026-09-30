import { NextResponse } from 'next/server';
import { parseCVText } from '@/lib/ai-engine';

export const runtime = 'nodejs';

/**
 * n8n Integration Webhook Endpoint
 * Allows n8n workflows to push CVs, query portfolio state, or trigger automated portfolio builds.
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let cvText = '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      cvText = body.cvText || body.text || body.content || body.rawText || '';
    } else {
      cvText = await request.text();
    }

    if (!cvText || !cvText.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'No CV text provided in n8n payload. Please supply cvText or raw text in request body.'
        },
        { status: 400 }
      );
    }

    // Process CV text through FolioForge AI Parser
    const portfolioData = parseCVText(cvText);

    // If Kapso WhatsApp notify URL is available, attempt alert
    let whatsappNotified = false;
    const phone = process.env.KAPSO_RECIPIENT_PHONE || '201017741741';
    const kapsoToken = process.env.KAPSO_API_TOKEN;

    if (kapsoToken) {
      try {
        await fetch('https://api.kapso.ai/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${kapsoToken}`
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: {
              body: `🚀 [n8n Automation] New CV processed for ${portfolioData.personal.name} (${portfolioData.personal.title}). Skills: ${portfolioData.skills.slice(0, 5).join(', ')}.`
            }
          })
        });
        whatsappNotified = true;
      } catch {
        whatsappNotified = false;
      }
    }

    return NextResponse.json({
      success: true,
      n8nProcessed: true,
      timestamp: new Date().toISOString(),
      whatsappNotified,
      portfolio: portfolioData,
      meta: {
        engine: 'FolioForge n8n Pipeline v2',
        skillsDetected: portfolioData.skills.length,
        experienceEntries: portfolioData.experience.length,
        projectEntries: portfolioData.projects.length
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'n8n webhook execution failed.'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'FolioForge n8n Automation Node API',
    status: 'online',
    version: '2.0.0',
    capabilities: [
      'cv-parsing',
      'portfolio-generation',
      'whatsapp-dispatch',
      'workflow-blueprint-export'
    ],
    documentation: 'Pass JSON body { "cvText": "..." } to POST /api/n8n to trigger automated workflow execution.'
  });
}
