// app/api/send-contract/route.ts
import { NextResponse } from "next/server";
import { generateContractPdf, CONTRACT_DATA } from "@/lib/generatePdf";
import { sendEnvelope } from "@/lib/sendEnvelope";

export async function POST() {
  try {
    const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
    const baseUrl = process.env.DOCUSIGN_BASE_URL;
    const employerEmail = process.env.EMPLOYER_EMAIL;
    const employerName = process.env.EMPLOYER_NAME;
    const employeeEmail = process.env.EMPLOYEE_EMAIL;
    const employeeName = process.env.EMPLOYEE_NAME;

    if (!accountId || !baseUrl) {
      return NextResponse.json(
        { error: "Missing DOCUSIGN_ACCOUNT_ID or DOCUSIGN_BASE_URL in .env.local" },
        { status: 500 }
      );
    }

    if (!employerEmail || !employeeEmail) {
      return NextResponse.json(
        { error: "Missing EMPLOYER_EMAIL or EMPLOYEE_EMAIL in .env.local" },
        { status: 500 }
      );
    }

    // Step 1: Generate PDF
    const pdfBuffer = await generateContractPdf();
    
    // Step 2: Send envelope (JWT auth handled inside sendEnvelope)
    const envelopeId = await sendEnvelope({
      accountId,
      baseUrl,
      pdfBuffer,
      employer: { email: employerEmail, name: employerName ?? "John Smith" },
      employee: { email: employeeEmail, name: employeeName ?? "Employee Name" },
    });

    console.log(`✅ Envelope sent | ID: ${envelopeId}`);

    return NextResponse.json({
      success: true,
      envelopeId,
      message: "Contract sent. Employer will sign first, then employee.",
      signers: {
        employer: { email: employerEmail, routingOrder: 1 },
        employee: { email: employeeEmail, routingOrder: 2 },
      },
      contractData: CONTRACT_DATA,
    });
  } catch (error: unknown) {
  console.error("❌ send-contract error:", error);
  const dsError = error as { response?: { body?: unknown } };
  console.error("❌ DocuSign details:", JSON.stringify(dsError?.response?.body, null, 2));
  const message = error instanceof Error ? error.message : "Unknown error";
  const details = dsError?.response?.body ?? null;
  return NextResponse.json({ error: message, details }, { status: 500 });
}
}
