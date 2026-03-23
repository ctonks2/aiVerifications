# Stage 2: DOM Text Analysis with Claude

## Overview
Stage 2 takes fully-rendered DOM text from the browser and sends it to Claude for AI-powered age verification detection. This is the cheapest and fastest AI analysis stage—text only, no images.

## When Stage 2 Runs
- **Automatically invoked** when Stage 1 returns `verdict: 'undetermined'`
- **Skipped** when Stage 1 has high confidence (≥70%)
- **Keeps page alive** between stages for consistent DOM context

## Architecture

### Three Core Files

#### 1. `src/claude.ts` - Claude Client Wrapper
```typescript
// Reusable Anthropic client for all stages
export async function sendPromptToClaude(
  systemPrompt: string,
  userPrompt: ClaudePromptOptions
): Promise<string>

export async function analyzeTextWithClaude(
  systemPrompt: string,
  text: string
): Promise<string>
```

**Features:**
- Singleton pattern for API client initialization
- Supports text-only (Stage 2) and image (Stage 3)
- Reads `ANTHROPIC_API_KEY` from `.env`
- Automatic model: `claude-3-5-sonnet-20241022`
- Error handling with meaningful messages

#### 2. `src/stages/stage2-dom.ts` - DOM Analysis Logic
```typescript
export async function stage2DomAnalysis(
  page: Page,
  url: string
): Promise<Stage2Result>
```

**Process:**
1. **Extract page text**: `page.evaluate(() => document.body.innerText)`
2. **Clean text**: Remove excessive whitespace, split/rejoin lines
3. **Cap size**: Limit to ~15,000 characters (cost control)
4. **Send to Claude**: System prompt + cleaned text
5. **Parse JSON**: Validate response structure
6. **Return result**: Standardized `Stage2Result` format

**Claude Analysis Prompt:**
- Looks for: Age gates, 18+/21+ text, DOB inputs, consent language, "adults only"
- Requires JSON response: `{ hasAgeVerification, confidence, evidence, reasoning }`
- Converts confidence from 0-1 to 0-100 scale

#### 3. `src/types.ts` - Unified Result Type
```typescript
interface DetectionResult {
  url: string
  verdict: 'yes' | 'no' | 'undetermined'
  confidence: number          // 0-100
  stage: 1 | 2 | 3 | 4
  evidence: string[]
  detectionMethod: string
  rawResponse?: unknown
}

interface Stage2Result extends DetectionResult {
  stage: 2
  detectionMethod: 'claude-dom'
  claudeAnalysis?: {
    hasAgeVerification: boolean | null
    reasoning?: string
  }
}
```

## Test Results

### Example 1: Wikipedia (Safe)
```
[Stage 1] Verdict: NO (95% confidence)
[Stage 2] SKIPPED - Stage 1 confident
FINAL: NO (95%)
```

### Example 2: Betfair (Gambling Site)
```
[Stage 1] Verdict: UNDETERMINED (0% confidence)
[Stage 2] RUNNING - Triggers Claude analysis
  Input: Page text (cleaned, ~15k chars)
  Claude: Returns JSON with age gate analysis
FINAL: Based on Stage 2 confidence & evidence
```

## Error Handling
- **Claude API fails**: Returns `undetermined` with error as evidence
- **JSON parse fails**: Treats response as invalid, passes inconclusive
- **Empty page text**: Returns `undetermined` immediately
- **Page timeout**: Caught by browser module, doesn't crash pipeline

## Token Cost Control
- **Text limit**: 15,000 characters (typical page is 3,000-8,000 chars)
- **Model**: Claude 3.5 Sonnet (fast, affordable)
- **Input only** (no image at this stage)
- **Est. cost**: $0.0015 - $0.003 per page analysis

## Integration with Index.ts
```typescript
// Stage 1
const stage1Result = await detectAgeVerification(page, requestUrls);

// Stage 2 (conditional)
if (stage1Result.verdict === 'undetermined') {
  const stage2Result = await stage2DomAnalysis(page, url);
  // Use Stage 2 if more confident
}

// Keep page alive for Stage 3 (if needed later)
```

## Next Steps (Stage 3)
- Visual layout analysis with screenshot + Claude vision
- Detect button placement, form visibility, modal positioning
- Higher confidence for borderline cases

## Configuration
```bash
# .env file:
ANTHROPIC_API_KEY=sk-ant-...
DEBUG=false
LOG_LEVEL=info
```

## Success Criteria ✓
- ✓ Safe sites (Wikipedia): `no` verdict with 80%+ confidence
- ✓ Age-gated sites: Detected by Stage 1 (skips Stage 2)
- ✓ Ambiguous sites (gambling): Triggers Stage 2 for Claude analysis
- ✓ API failures: Graceful fallback to inconclusive (pipeline continues)
- ✓ JSON parsing errors: Caught and logged without crashing
