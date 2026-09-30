import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Server-side notification handler supporting both Kapso WhatsApp API & n8n webhook.
// Disclosed to users via the privacy note in DeployModal.
export async function POST(request: Request) {
  const n8nWebhook = process.env.N8N_NOTIFY_WEBHOOK_URL;
  const kapsoApiKey = process.env.KAPSO_API_KEY || process.env.WHATSAPP_TOKEN || 'c676aaa27bb56c780e049a192598345c821f11647327cbecafc84686e91c9471';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '1423905784128972';
  const recipientPhone = process.env.WHATSAPP_PHONE || process.env.RECIPIENT_PHONE || '201017741741';
  const kapsoBaseUrl = process.env.KAPSO_BASE_URL || 'https://api.kapso.ai/meta/whatsapp';

  try {
    const { name, url } = await request.json();
    if (typeof name !== 'string' || typeof url !== 'string' || !name.trim() || !url.trim()) {
      return NextResponse.json({ error: 'name and url are required.' }, { status: 400 });
    }

    const cleanName = name.trim().slice(0, 200);
    const cleanUrl = url.trim().slice(0, 500);
    let n8nSuccess = false;
    let whatsappSuccess = false;

    // 1. Send to n8n if webhook is configured
    if (n8nWebhook) {
      try {
        const response = await fetch(n8nWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cleanName, url: cleanUrl, source: 'folioforge-v2' }),
          cache: 'no-store'
        });
        if (response.ok) n8nSuccess = true;
      } catch {
        // Continue to WhatsApp
      }
    }

    // 2. Direct WhatsApp Notification via Kapso Cloud API
    if (kapsoApiKey && phoneNumberId && recipientPhone) {
      try {
        const cleanRecipient = recipientPhone.replace(/[^0-9]/g, '');
        const messageBody = `🚀 *FolioForge Deployment Alert*\n\n` +
          `👤 *Name:* ${cleanName}\n` +
          `🔗 *Live URL:* ${cleanUrl}\n\n` +
          `✨ Your AI portfolio is now live and published!`;

        const waResponse = await fetch(`${kapsoBaseUrl}/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${kapsoApiKey}`,
            'x-api-key': kapsoApiKey
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanRecipient,
            type: 'text',
            text: { preview_url: true, body: messageBody }
          }),
          cache: 'no-store'
        });

        if (waResponse.ok) {
          whatsappSuccess = true;
        }
      } catch {
        // Non-blocking notification
      }
    }

    return NextResponse.json({
      ok: true,
      n8n: n8nSuccess,
      whatsapp: whatsappSuccess,
      message: 'Deployment notification dispatched successfully.'
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Notify failed.' },
      { status: 500 }
    );
  }
}
