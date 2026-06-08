/**
 * Unified result type for all detection stages
 * Ensures consistent output across Stage 1, 2, 3, and 4
 */

export interface DetectionResult {
  url: string;
  verdict: 'yes' | 'no' | 'undetermined';
  confidence: number; // 0-100
  stage: 1 | 2 | 3 | 4;
  evidence: string[];
  detectionMethod: string;
  rawResponse?: unknown;
}

/**
 * Stage 1 specific result (network + HTML patterns)
 */
export interface Stage1Result extends DetectionResult {
  stage: 1;
  detectionMethod: 'network' | 'html' | 'combined' | 'none';
  details?: {
    networkProviders?: string[];
    htmlPatterns?: string[];
    htmlSnippets?: string[];
    consentSnippets?: string[];
    formFields?: Array<{ name: string; html: string }>;
    metaTags?: string[];
  };
}

/**
 * Stage 2 specific result (Claude DOM analysis)
 */
export interface Stage2Result extends DetectionResult {
  stage: 2;
  detectionMethod: 'claude-dom' | 'claude-vision';
  claudeAnalysis?: {
    hasAgeVerification: boolean | null;
    reasoning?: string;
  };
}

/**
 * Stage 3 specific result (Claude Vision analysis)
 */
export interface Stage3Result extends DetectionResult {
  stage: 3;
  detectionMethod: 'claude-vision';
  claudeAnalysis?: {
    hasAgeVerification: boolean | null;
    reasoning?: string;
  };
  screenshot?: string; // Base64 encoded screenshot
}

/**
 * Stage 4 specific result (Content harm assessment using Utah legal definition)
 */
export interface Stage4Result extends DetectionResult {
  stage: 4;
  detectionMethod: 'content-analysis';
  prong1_analysis: string; // Prurient interest analysis
  prong2_analysis: string; // Offensive depiction analysis
  prong3_analysis: string; // Serious value analysis
  all_prongs_met: boolean; // True only if all three prongs affirmed
}

/**
 * Claude response format for JSON parsing
 */
export interface ClaudeAgeGateResponse {
  hasAgeVerification: boolean | null;
  confidence: number;
  evidence: string[];
  reasoning?: string;
}

/**
 * Final Compliance Report for regulatory purposes
 * This is the output given to the Division of Consumer Protection investigators
 */
export interface ComplianceReport {
  url: string;
  complianceStatus: 'COMPLIANT' | 'NOT_COMPLIANT' | 'NOT_REQUIRED' | 'UNCERTAIN';
  confidence: number; // 0-100
  humanReviewNeeded: boolean;
  
  // Location of age verification if found
  ageVerificationFound: {
    found: boolean;
    stage?: 1 | 2 | 3 | 4;
    location?: string; // e.g., "Network request to ageid.com", "Modal in screenshot", "DOM text"
    details?: string; // Specific details about what was found
  };
  
  // Explanation of why this compliance status was selected
  explanation: string;
  
  // All stage results for detailed investigation
  allStages?: {
    stage0?: any; // Block detection result
    stage1?: DetectionResult & { details?: Record<string, unknown> };
    stage2?: DetectionResult;
    stage3?: DetectionResult;
    stage4?: DetectionResult & { prong1_analysis?: string; prong2_analysis?: string; prong3_analysis?: string };
  };
  
  // Recommendation for investigator
  investigatorNotes?: string;
}
