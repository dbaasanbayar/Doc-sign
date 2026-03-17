// app/api/docusign-webhook/route.ts
// POST /api/docusign-webhook
// Receives DocuSign Connect webhook events.
// When envelope status = "completed" → both parties have signed → log as saved.
//
// Setup in DocuSign sandbox:
//   Settings → Connect → Add Configuration
//   URL: https://YOUR_NGROK_URL/api/docusign-webhook
//   Trigger events: ✅ Envelope Completed

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text(); // DocuSign sends XML

    // ── Parse key fields from XML ─────────────────────────────────────────────
    // Simple regex is fine for sandbox. In production use a proper XML parser.
    const envelopeIdMatch = body.match(/<EnvelopeID>(.*?)<\/EnvelopeID>/i);
    const statusMatch = body.match(/<Status>(.*?)<\/Status>/i);
    const senderEmailMatch = body.match(/<Email>(.*?)<\/Email>/i);

    const envelopeId = envelopeIdMatch?.[1] ?? "unknown";
    const status = statusMatch?.[1] ?? "unknown";
    const senderEmail = senderEmailMatch?.[1] ?? "unknown";

    console.log(`\n📬 DocuSign Webhook received`);
    console.log(`   Envelope ID  : ${envelopeId}`);
    console.log(`   Status       : ${status}`);
    console.log(`   Sender Email : ${senderEmail}`);

    if (status.toLowerCase() === "completed") {
      // ✅ Both parties have signed — document is fully executed
      console.log(`\n✅ CONTRACT FULLY SIGNED & SAVED`);
      console.log(`   Envelope ID : ${envelopeId}`);
      console.log(`   All signatures collected. Document saved in DocuSign.`);
      console.log(
        `   → Download signed PDF via:\n` +
        `     GET /v2.1/accounts/{accountId}/envelopes/${envelopeId}/documents/combined\n`
      );

      // TODO: Add your save logic here, e.g.:
      // - Download the signed PDF and store to S3 / local disk
      // - Update your database (mark contract as signed)
      // - Send a Slack/email notification to your team
    }

    // DocuSign expects a 200 response to confirm receipt
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new NextResponse("Error", { status: 500 });
  }
}

