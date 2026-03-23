# Hybrid LLM Cost Optimization Guide

## Quick Start: Save Money with Ollama + Claude

### Cost Comparison

| Scenario | Ollama Only | Claude Only | Hybrid (Recommended) |
|----------|-----------|------------|-------------------|
| 100 URLs (Stage 2 only) | $0 | ~$1.00 | ~$0.30 |
| 100 URLs (all stages) | N/A (no vision) | ~$3.50 | ~$2.10 |
| 1000 URLs | $0 | $10+ | $3-5 |

**Hybrid savings: 60-70% cost reduction**

---

## Setup

### Step 1: Install Ollama

```bash
# Download from https://ollama.ai
# Then pull a model (choose one based on capability/speed):

ollama pull mistral      # Fast, good for Stage 2 (recommended)
ollama pull neural-chat  # Similar quality to mistral
ollama pull llama2       # Slightly slower, more capable
ollama pull orca-mini    # Tiniest/fastest
```

### Step 2: Start Ollama

```bash
# Ollama runs in background by default after install
# Or manually start:
ollama serve

# Verify it's running:
curl http://localhost:11434/api/tags
```

### Step 3: Update Your `.env`

```env
# Hybrid LLM Setup
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral

USE_HYBRID_LLM=true
PREFER_OLLAMA=true
FALLBACK_TO_CLAUDE=true
TRACK_COSTS=true
```

---

## How It Works

### Stage 2 (DOM Text Analysis) - **Best for Savings**

```
Incoming URL
  ↓
Try Ollama (free)
  ├─ Confident (>70% confidence) → Return, SKIP Claude
  │  Cost: $0 ✓
  └─ Uncertain (≤70%) → Escalate to Claude
     Cost: ~$0.01

Typical savings: 70-80% of Stage 2 calls skip Claude
```

### Stage 3 (Vision Analysis)

```
Vision always uses Claude (limited vision models)
  Cost: ~$0.003 per screenshot
  (Ollama vision is experimental)
```

### Stage 4 (Legal Analysis) - **Medium Savings**

```
First pass: Ollama evaluates content
  ├─ Clear verdict (all prongs met/not met) → Return
  │  Cost: $0 ✓
  └─ Inconclusive prongs → Claude detailed analysis
     Cost: ~$0.01

Typical savings: 30-40% of Stage 4 calls skip Claude
```

---

## Implementation

### Option A: Minimal Change (Stage 2 only)

**File: `src/stages/stage2-dom.ts`**

Replace Claude call with hybrid router:

```typescript
// OLD:
const claudeResponse = await sendPromptToClaude(STAGE2_SYSTEM_PROMPT, {
  text: userPrompt,
});

// NEW:
import { sendPromptHybrid } from '../llm-router';

const { response: claudeResponse, model, cost } = await sendPromptHybrid(
  STAGE2_SYSTEM_PROMPT,
  userPrompt,
  2, // stage 2
);

console.log(`[Stage 2] Used ${model}: ${cost.estimatedCost.toFixed(4)} cost`);
```

### Option B: Full Integration (All Stages)

1. Update `index.ts` to initialize hybrid LLM:

```typescript
import { initHybridLLM, getCostSummary } from './llm-router';

async function run() {
  await initHybridLLM({ preferOllama: true });
  
  // ... run pipeline ...
  
  const costs = getCostSummary();
  console.log(`\nCost Summary:
    Ollama calls: ${costs.ollamaCalls}
    Claude calls: ${costs.claudeCalls}
    Total cost: $${costs.totalEstimatedCost.toFixed(4)}
    Saved by Ollama: $${costs.savedByOllama.toFixed(4)}`);
}
```

2. Update Stage 2 and Stage 4 to use hybrid router

3. Keep Stage 3 on Claude (vision requirement)

---

## Expected Behavior

### When Ollama Works:
```
[Hybrid LLM] ✓ Ollama available - will use for cost savings
[Hybrid LLM] Using Ollama for Stage 2 analysis...
[Stage 2] Used ollama: $0.0000 cost
```

### When Ollama Falls Back to Claude:
```
[Hybrid LLM] Ollama failed: Connection refused
[Hybrid LLM] Falling back to Claude...
[Stage 2] Used claude: $0.0045 cost
```

### When Ollama Unavailable:
```
[Hybrid LLM] ✗ Ollama unavailable - will use Claude only
```

---

## Tuning

### Adjust Escalation Thresholds

In **llm-router.ts**, modify confidence thresholds:

```typescript
// Escalate to Claude only if very uncertain:
if (ollamaConfidence < 0.5) {
  escalateToClaude();
}

// Or always escalate to Claude for critical decisions:
if (stage === 4) { // Legal analysis
  escalateToClaude(); // Double-check with Claude
}
```

### Use Faster Ollama Models

For speed (better throughput):
```bash
ollama pull orca-mini  # ~60M params, very fast
ollama pull phi        # ~2.7B params, fastest reasoning
```

For quality (better accuracy):
```bash
ollama pull neural-chat  # ~13B, better than mistral
ollama pull llama2       # ~7B or ~13B options
```

---

## Cost Breakdown (Typical Usage)

### 100 URLs running full pipeline:

**Ollama Only (can't do vision):**
- Not viable - Stage 3 requires vision

**Claude Only:**
- Stage 1: Free (network/HTML)
- Stage 2: 100 calls × $0.003 = $0.30
- Stage 3: 30 calls × $0.003 = $0.09
- Stage 4: 10 calls × $0.01 = $0.10
- **Total: ~$0.49**

**Hybrid (Ollama + Claude):**
- Stage 1: Free (network/HTML)
- Stage 2: 70 Ollama ($0) + 30 Claude ($0.09) = $0.09
- Stage 3: 30 Claude ($0.09) = $0.09
- Stage 4: 6 Ollama ($0) + 4 Claude ($0.04) = $0.04
- **Total: ~$0.22** ← **55% savings**

---

## Limitations

✅ **Ollama is good at:**
- Text classification (age gate detection)
- Pattern recognition
- Structured reasoning
- JSON parsing

❌ **Ollama struggles with:**
- Vision/images (Stage 3) - use Claude
- Nuanced legal analysis (Stage 4) - escalate to Claude
- Complex reasoning under edge cases

---

## Files to Modify

| File | Purpose | Effort |
|------|---------|--------|
| `src/ollama.ts` | ✓ Created - local LLM wrapper | Done |
| `src/llm-router.ts` | ✓ Created - routing logic | Done |
| `src/stages/stage2-dom.ts` | Replace Claude call | 5 mins |
| `src/stages/stage4-content.ts` | Add Ollama pre-check | 10 mins |
| `src/index.ts` | Initialize hybrid system | 5 mins |
| `.env` | Add Ollama config | 2 mins |

**Total setup time: ~30 minutes**

---

## Monitoring & Debugging

```bash
# Check Ollama models:
curl http://localhost:11434/api/tags | jq

# Monitor Ollama performance:
# Look at Ollama console while requests run

# Enable detailed cost logging:
LOG_LEVEL=debug npm run start
```

---

## Next Steps

1. **Install Ollama** - https://ollama.ai
2. **Pull a model** - `ollama pull mistral`
3. **Update `.env`** - Add OLLAMA_BASE_URL
4. **Modify Stage 2** - Replace Claude with hybrid router
5. **Test** - Run test suite and check cost savings
6. **Expand** - Add to Stage 4 if comfortable

This hybrid approach lets you **keep Claude's power for critical decisions while using free local inference for screening work**.
