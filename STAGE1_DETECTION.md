# Age Verification Detection - Stage 1 (Chunk 2)

## Overview

This module detects age-gated websites through two-stage analysis:

### Stage 1: Network Request Analysis
Intercepts all network requests during page load and checks against known third-party age verification provider domains including:
- Yoti, AgeID, AgeChecker.Net
- AVS, Veriff, BBFC
- Intellicheck, Liveness.id, AuthID, and others

**Confidence**: 95% when a provider is detected

### Stage 2: HTML Pattern Analysis
When network analysis is inconclusive, the system scans the DOM for:

1. **Age-Related Keywords** - "age", "dob", "birthdate", "over 18", "verify age", etc.
2. **Consent Language** - "agree", "acknowledge", "confirm you are"
3. **Form Fields** - Date of birth input fields, birth date selectors
4. **Meta Tags** - Content ratings, adult classifications

**Confidence**: 20-60% depending on number of signals

## Detection Results

Each detection returns a standardized result object:

```typescript
interface AgeDetectionResult {
  verdict: 'yes' | 'no' | 'undetermined';
  confidence: number; // 0-100
  detectionMethod: 'network' | 'html' | 'combined' | 'none';
  signals: string[];
  details: {
    networkProviders?: string[];
    htmlPatterns?: string[];
    formFields?: string[];
    metaTags?: string[];
  };
}
```

### Verdict Thresholds

- **'yes'** (Age-Gated)
  - Network detection: Any age verification provider found (95% confidence)
  - HTML detection: Multiple converging signals (60%+ confidence)

- **'undetermined'**
  - Weak HTML signals present (20-60% confidence)
  - Requires Stage 2 analysis (AI content analysis)

- **'no'** (Not Age-Gated)
  - No signals detected (95% confidence)
  - Safe for unrestricted access

## Usage

### Running Tests

```bash
npm test
```

Tests against safe websites (Example.com, Wikipedia) and validates verdict accuracy.

### Running Main Detection

```bash
npm start
```

Analyzes URLs specified in `src/index.ts` and logs detailed results.

## Examples

### Safe Site (Wikipedia)
```
Verdict: NO
Confidence: 95%
Detection Method: none
Signals Found: (none)
```

### Age-Gated Site (hypothetical)
```
Verdict: YES
Confidence: 95%
Detection Method: network
Signals Found:
  • Detected age verification provider: yoti.com
```

## How to Test with Real Age-Gated Sites

To test the detection system with actual age-gated websites:

1. Open `src/test.ts`
2. Add test cases with URLs (commented out examples provided)
3. Run `npm test`

Example known age-gated sites:
- Adult content sites (require network auth)
- Alcohol brand sites (.com, .co.uk domains often use Yoti/AgeID)
- Gambling platforms
- Tobacco retailers

## Implementation Details

### Network Interception
- Hook set up BEFORE `page.goto()` to capture all requests
- Automatically stores complete request URLs
- Checks against provider domain list (case-insensitive, subdomain-aware)

### HTML Scanning
- Walks entire DOM for form patterns
- Filters out false positives (birthday toggles, user preferences, etc.)
- Uses regex and keyword matching for flexibility

## Known Limitations

1. **False Negatives**: Sites using homegrown age verification without third-party providers may not be detected at network stage
2. **False Positives**: Sites with birthday/date fields for non-age reasons (reduced by improved filtering)
3. **No JavaScript Rendering**: Detection happens after initial page load (networkidle), so dynamically-injected gates may be missed in some cases
4. **Timeout Handling**: Slow sites may timeout before networkidle event

## Next Stage (Stage 2)

Sites returning `'undetermined'` verdict will be passed to:
- AI content analysis (NSFW detection)
- Image/text classification
- Machine learning-based age appropriateness scoring

## Files Modified from Chunk 1

- `src/browser.ts` - Added network request interception before page.goto()
- Returns `requestUrls` array alongside page object

## New Files Created

- `src/constants.ts` - Known providers and keyword patterns
- `src/ageDetector.ts` - Main detection logic and result formatting
- `src/test.ts` - Test suite with multiple test cases
