// lib/generatePdf.ts
// Generates a filled Employment Contract PDF using pdf-lib
// Returns the PDF as a Buffer

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// ── Hardcoded test data ──────────────────────────────────────────────────────
export const CONTRACT_DATA = {
  date: "March 16, 2026",
  employerName: "John Smith",
  employerRole: "Chief Executive Officer",
  employeeName: "Bat-Erdene Gantulga",
  employeeAddress: "Sukhbaatar District, Ulaanbaatar, Mongolia",
  startDate: "April 1, 2026",
  salary: "3,500,000 MNT",
};
// ────────────────────────────────────────────────────────────────────────────

export async function generateContractPdf(): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = height - 60;
  const margin = 60;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const drawText = (
    text: string,
    x: number,
    yPos: number,
    size = 11,
    font = fontRegular,
    color = rgb(0, 0, 0)
  ) => {
    page.drawText(text, { x, y: yPos, size, font, color });
  };

  const drawLine = (yPos: number) => {
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: width - margin, y: yPos },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
  };

  const section = (title: string, yPos: number) => {
    drawText(title, margin, yPos, 11, fontBold);
    return yPos - 18;
  };

  // ── Title ──────────────────────────────────────────────────────────────────
  drawText("EMPLOYMENT CONTRACT", width / 2 - 90, y, 16, fontBold);
  y -= 10;
  drawLine(y);
  y -= 20;

  // ── Preamble ───────────────────────────────────────────────────────────────
  drawText(`This Employment Contract ("Agreement") is made on ${CONTRACT_DATA.date} between:`, margin, y, 10);
  y -= 24;

  drawText("Employer:", margin, y, 10, fontBold);
  y -= 16;
  drawText("ABC LLC", margin + 10, y, 10);
  y -= 14;
  drawText("Registered Address: Ulaanbaatar, Mongolia", margin + 10, y, 10);
  y -= 14;
  drawText(`Represented by: ${CONTRACT_DATA.employerName}, ${CONTRACT_DATA.employerRole}`, margin + 10, y, 10);
  y -= 24;

  drawText("Employee:", margin, y, 10, fontBold);
  y -= 16;
  drawText(`Full Name: ${CONTRACT_DATA.employeeName}`, margin + 10, y, 10);
  y -= 14;
  drawText(`Address: ${CONTRACT_DATA.employeeAddress}`, margin + 10, y, 10);
  y -= 14;
  drawText('The Employer and the Employee are collectively referred to as the "Parties."', margin + 10, y, 10);
  y -= 28;

  drawLine(y);
  y -= 18;

  // ── Clauses ────────────────────────────────────────────────────────────────
  const clauses = [
    {
      num: "1. Position",
      body: "The Employee is hired for the position of Software Developer. The Employee agrees to\nperform the duties and responsibilities assigned by the Employer.",
    },
    {
      num: "2. Start Date",
      body: `The Employee's employment will begin on ${CONTRACT_DATA.startDate}.`,
    },
    {
      num: "3. Compensation",
      body: `The Employer agrees to pay the Employee a monthly salary of ${CONTRACT_DATA.salary}\nin accordance with the company's payroll policies.`,
    },
    {
      num: "4. Working Hours",
      body: "The Employee's regular working hours shall be 40 hours per week, Monday to Friday.",
    },
    {
      num: "5. Confidentiality",
      body: "The Employee agrees not to disclose any confidential or proprietary information\nbelonging to the Employer during or after the employment period.",
    },
    {
      num: "6. Termination",
      body: "Either party may terminate this Agreement by providing 30 days written notice,\nunless otherwise required by law.",
    },
    {
      num: "7. Governing Law",
      body: "This Agreement shall be governed by the laws of Mongolia.",
    },
  ];

  for (const clause of clauses) {
    y = section(clause.num, y);
    const lines = clause.body.split("\n");
    for (const line of lines) {
      drawText(line, margin + 10, y, 10);
      y -= 14;
    }
    y -= 10;
  }

  // ── Signatures ─────────────────────────────────────────────────────────────
  drawLine(y);
  y -= 20;
  drawText("8. Signatures", margin, y, 11, fontBold);
  y -= 16;
  drawText(
    "By signing below, both Parties agree to the terms and conditions of this Employment Contract.",
    margin,
    y,
    10
  );
  y -= 30;

  drawText("Employer Representative Name:", margin, y, 10, fontBold);
  y -= 16;
  drawText(`Name: ${CONTRACT_DATA.employerName}`, margin, y, 10);
  y -= 14;
  drawText(`Position: ${CONTRACT_DATA.employerRole}`, margin, y, 10);
  y -= 20;
  drawText("Signature: ___________________________", margin, y, 10);
  drawText("Date: ___________________________", margin + 260, y, 10);
  y -= 36;

  drawText("Employee Name:", margin, y, 10, fontBold);
  y -= 16;
  drawText(`Name: ${CONTRACT_DATA.employeeName}`, margin, y, 10);
  y -= 20;
  drawText("Signature: ___________________________", margin, y, 10);
  drawText("Date: ___________________________", margin + 260, y, 10);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
