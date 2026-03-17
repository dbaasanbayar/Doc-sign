// lib/sendEnvelope.ts
import fs from "fs";
import path from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const docusign = require("docusign-esign");

interface Signer {
  email: string;
  name: string;
}

interface SendEnvelopeParams {
  accountId: string;
  baseUrl: string;
  pdfBuffer: Buffer;
  employer: Signer;
  employee: Signer;
}

async function getJwtAccessToken(): Promise<string> {
  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY!;
  const userId = process.env.DOCUSIGN_USER_ID!;
  const privateKeyPath = path.resolve(process.cwd(), "private.key");
  const privateKey = fs.readFileSync(privateKeyPath);

  const apiClient = new docusign.ApiClient();
  apiClient.setBasePath("https://account-d.docusign.com");
  apiClient.setOAuthBasePath("account-d.docusign.com");

  const results = await apiClient.requestJWTUserToken(
    integrationKey,
    userId,
    ["signature", "impersonation"],
    privateKey,
    3600
  );

  return results.body.access_token;
}

export async function sendEnvelope({
  accountId,
  baseUrl,
  pdfBuffer,
  employer,
  employee,
}: SendEnvelopeParams): Promise<string> {
  const accessToken = await getJwtAccessToken();

  const apiClient = new docusign.ApiClient();
  apiClient.setBasePath(baseUrl);
  apiClient.addDefaultHeader("Authorization", `Bearer ${accessToken}`);

  const document = new docusign.Document();
  document.documentBase64 = pdfBuffer.toString("base64");
  document.name = "Employment Contract";
  document.fileExtension = "pdf";
  document.documentId = "1";

  // ── Employer tabs
  // Anchor: "Employer Representative Name:" — unique, only appears once in signature block
  const employerSignHere = docusign.SignHere.constructFromObject({
    anchorString: "Employer Representative Name:",
    anchorYOffset: "20",
    anchorXOffset: "10",
    anchorUnitsMetric: "points",
    anchorIgnoreIfNotPresent: "false",
    anchorMatchWholeWord: "true",
  });

  const employerDateSigned = docusign.DateSigned.constructFromObject({
    anchorString: "Employer Representative Name:",
    anchorYOffset: "20",
    anchorXOffset: "200",
    anchorUnitsMetric: "points",
    anchorIgnoreIfNotPresent: "false",
    anchorMatchWholeWord: "true",
  });

  // ── Employee tabs
  // Anchor: "Employee Name:" — unique, only appears once in signature block
  const employeeSignHere = docusign.SignHere.constructFromObject({
    anchorString: "Employee Name:",
    anchorYOffset: "20",
    anchorXOffset: "10",
    anchorUnitsMetric: "points",
    anchorIgnoreIfNotPresent: "false",
    anchorMatchWholeWord: "true",
  });

  const employeeDateSigned = docusign.DateSigned.constructFromObject({
    anchorString: "Employee Name:",
    anchorYOffset: "20",
    anchorXOffset: "200",
    anchorUnitsMetric: "points",
    anchorIgnoreIfNotPresent: "false",
    anchorMatchWholeWord: "true",
  });

  // ── Recipients (sequential)
  const employerSigner = docusign.Signer.constructFromObject({
    email: employer.email,
    name: employer.name,
    recipientId: "1",
    routingOrder: "1",
    tabs: docusign.Tabs.constructFromObject({
      signHereTabs: [employerSignHere],
      dateSignedTabs: [employerDateSigned],
    }),
  });

  const employeeSigner = docusign.Signer.constructFromObject({
    email: employee.email,
    name: employee.name,
    recipientId: "2",
    routingOrder: "2",
    tabs: docusign.Tabs.constructFromObject({
      signHereTabs: [employeeSignHere],
      dateSignedTabs: [employeeDateSigned],
    }),
  });

  // ── Envelope
  const envelopeDefinition = new docusign.EnvelopeDefinition();
  envelopeDefinition.emailSubject = "Employment Contract - Signature Required";
  envelopeDefinition.emailBlurb =
    "Please review and sign the attached Employment Contract at your earliest convenience.";
  envelopeDefinition.documents = [document];
  envelopeDefinition.recipients = docusign.Recipients.constructFromObject({
    signers: [employerSigner, employeeSigner],
  });
  envelopeDefinition.status = "sent";

  const envelopesApi = new docusign.EnvelopesApi(apiClient);
  const result = await envelopesApi.createEnvelope(accountId, {
    envelopeDefinition,
  });

  return result.envelopeId!;
}