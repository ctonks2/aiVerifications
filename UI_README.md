# Age Verification Compliance Inspector

A minimal, sophisticated web-based UI for testing websites for age verification compliance.

## 🚀 Quick Start

### Install Dependencies

```bash
# Root project dependencies
npm install

# UI dependencies
cd ui && npm install && cd ..
```

### Run Both Services

```bash
npm run dev:all
```

This will start:
- **API Server**: http://localhost:3001 (backend compliance testing)
- **UI**: http://localhost:3000 (frontend interface)

### Run Services Separately

```bash
# Terminal 1: Start API server
npm run api

# Terminal 2: Start UI
npm run ui
```

## 📋 Features

✅ **URL Testing Form** - Enter any website URL to test for age verification  
✅ **Test History** - View all previous test results in a table  
✅ **Real-time Results** - Instant compliance status, confidence level, and provider information  
✅ **Utah Branding** - Beehive blue and gold color scheme  
✅ **Responsive Design** - Works on desktop and mobile  

## 🎨 Design

The UI features a minimal, sophisticated design using Utah state colors:
- **Primary Color**: Beehive Blue (#002868)
- **Accent Color**: Utah Gold (#9B2C1F)
- **Clean Typography**: System font stack
- **Subtle Shadows**: Modern depth without clutter

## 📊 What Gets Tested

The compliance checker runs through 4 stages:

1. **Stage 1**: Network requests & HTML patterns
2. **Stage 2**: DOM text content analysis
3. **Stage 3**: Visual screenshot analysis (vision AI)
4. **Stage 4**: Legal content analysis

Returns:
- **COMPLIANT**: Has age verification
- **NOT_REQUIRED**: Content doesn't need age gating
- **NOT_COMPLIANT**: Needs verification but doesn't have it
- **UNCERTAIN**: Needs human review (e.g., regulatory-only age restrictions)

## 🔍 Example Results

### ✅ Pornhub
- Status: COMPLIANT
- Confidence: 90%
- Detection: Stage 1 (age keywords, consent language, RTA rating)

### 🚩 DraftKings
- Status: UNCERTAIN
- Confidence: 95%
- Issue: Regulatory-only age restriction (gambling laws) - not actual age-gated content

### ✅ Total Wine
- Status: COMPLIANT
- Confidence: 95%
- Detection: Stage 3 (visual modal overlay detection)

## 📁 Project Structure

```
aiVerifications/
├── api.ts                    # Express API server
├── test-5-sites-sequential.ts # Core compliance testing logic
├── ui/                        # React frontend
│   ├── src/
│   │   ├── App.tsx           # Main app component
│   │   ├── App.css           # Styling with Utah colors
│   │   ├── main.tsx          # Entry point
│   │   └── components/
│   │       ├── TestForm.tsx
│   │       ├── ResultsTable.tsx
│   │       └── StatsSummary.tsx
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── index.html
└── package.json
```

## 🛠 Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Plain CSS with Utah color variables
- **HTTP Client**: Axios
- **Process Manager**: Concurrently (for dev)

## 📝 API Endpoints

### POST `/api/test`
Test a single URL

```json
Request:
{
  "url": "https://example.com"
}

Response:
{
  "success": true,
  "result": { /* Full compliance report */ },
  "testResult": { /* Simplified result for history */ }
}
```

### GET `/api/history`
Get all test results

```json
{
  "success": true,
  "data": [/* Array of test results */],
  "count": 5
}
```

### POST `/api/history/clear`
Clear all test history

## ⚙️ Environment

Uses the same environment setup as the main CLI tool:
- Playwright for browser automation
- Claude (Anthropic) API for vision and content analysis
- Ollama (optional) for local LLM analysis

Ensure your `.env` file is configured with required API keys.

## 🎯 Legal Compliance

This tool helps organizations comply with Utah's age verification requirements by detecting:
- Professional age verification services (Verifone, AgeLogix, etc.)
- Age-gated modal overlays
- Age-related consent language
- Content analysis for harmful materials

However, it does NOT mark sites as compliant if they only show regulatory age warnings (gambling, alcohol) without actual content gating.

---

**Utah Regulatory Technology - Age Verification System**
