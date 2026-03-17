# DocuSign Employment Contract — Next.js Integration

## 📁 Where to put each file

```
your-app/                                   ← your project root
├── app/
│   └── api/
│       ├── send-contract/
│       │   └── route.ts                    ← POST: generate PDF + send to DocuSign
│       └── docusign-webhook/
│           └── route.ts                    ← POST: DocuSign completion notification
├── lib/
│   ├── generatePdf.ts                      ← PDF builder (pdf-lib)
│   └── sendEnvelope.ts                     ← DocuSign API wrapper
├── .env.local                              ← your credentials (never commit!)
└── package.json                            ← add dependencies here
```

---

## 📦 Install dependencies

Add to your `package.json` dependencies then run `npm install`:

```json
"docusign-esign": "^6.4.0",
"pdf-lib": "^1.17.1"
```

```bash
npm install docusign-esign pdf-lib
```

For TypeScript types:
```bash
npm install --save-dev @types/docusign-esign
```

---

## 🔑 Fill in `.env.local`

```env
DOCUSIGN_ACCESS_TOKEN=eyJ0eXAiOiJNVCIs...   ← from developer.docusign.com → Apps & Keys → Generate Token
DOCUSIGN_ACCOUNT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx  ← API Account ID
DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi

EMPLOYER_EMAIL=suhee99012017@gmail.com
EMPLOYER_NAME=John Smith
EMPLOYEE_EMAIL=d.baasanbayar@gmail.com
EMPLOYEE_NAME=Bat-Erdene Gantulga
```

⚠️ Access tokens expire after **8 hours** in sandbox. Regenerate if you get 401 errors.

---

## ▶️ Run

```bash
npm run dev
```

### Send the contract
```
POST http://localhost:3000/api/send-contract
```

No body needed — uses hardcoded test data.

**Response:**
```json
{
  "success": true,
  "envelopeId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "message": "Contract sent. Employer will sign first, then employee.",
  "signers": {
    "employer": { "email": "suhee99012017@gmail.com", "routingOrder": 1 },
    "employee": { "email": "d.baasanbayar@gmail.com", "routingOrder": 2 }
  }
}
```

---

## 🔔 Webhook (completion notification)

### 1. Expose your local server
```bash
ngrok http 3000
# → gives you: https://abc123.ngrok.io
```

### 2. Configure in DocuSign sandbox
- Go to: **Settings → Connect → Add Configuration**
- URL: `https://abc123.ngrok.io/api/docusign-webhook`
- Trigger events: ✅ **Envelope Completed**

### 3. What you'll see in console when both sign
```
✅ CONTRACT FULLY SIGNED & SAVED
   Envelope ID : xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   All signatures collected. Document saved in DocuSign.
```

---

## 🔄 Signing Flow

```
POST /api/send-contract
        │
        ▼
generatePdf.ts  →  filled contract PDF
        │
        ▼
sendEnvelope.ts  →  DocuSign envelope (status: "sent")
        │
        ▼
suhee99012017@gmail.com  receives email
Employer (John Smith) signs          ← routingOrder: 1
        │
        ▼
d.baasanbayar@gmail.com  receives email
Employee signs                        ← routingOrder: 2
        │
        ▼
DocuSign fires webhook
POST /api/docusign-webhook
status = "completed"  →  ✅ logged as saved
```
# Doc-sign
