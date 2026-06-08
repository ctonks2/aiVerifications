import React, { useState } from 'react';
import '../styles/DetailModal.css';

interface CodeEvidence {
  description: string;
  code: string;
  type: 'attribute' | 'text' | 'element' | 'href' | 'form';
  location?: string;
}

interface DetectionResult {
  url: string;
  verdict: 'yes' | 'no' | 'undetermined';
  confidence: number;
  stage: 1 | 2 | 3 | 4;
  evidence: string[];
  detectionMethod: string;
  rawResponse?: unknown;
  claudeAnalysis?: {
    hasAgeVerification: boolean | null;
    reasoning?: string;
  };
  screenshot?: string;
  content_category?: 'adult' | 'gambling' | 'alcohol' | 'tobacco' | 'drugs' | 'weapons' | 'services' | 'general' | 'unknown';
  requires_age_verification?: boolean;
  category_analysis?: string;
  content_assessment?: string;
  reasoning_summary?: string;
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  stage1?: DetectionResult;
  stage3?: DetectionResult;
  stage4?: DetectionResult;
  codeEvidence?: CodeEvidence[];
  investigatorNotes?: string;
  isLoading?: boolean;
}

const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  url,
  stage1,
  stage3,
  stage4,
  codeEvidence,
  investigatorNotes,
  isLoading,
}) => {
  const [showScreenshot, setShowScreenshot] = useState(false);

  if (!isOpen) return null;

  const getDomain = (urlStr: string) => {
    try {
      return new URL(urlStr).hostname;
    } catch {
      return urlStr;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#10b981';
    if (confidence >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Detection Details {isLoading ? '(Analyzing...)' : ''}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <h3>URL Tested</h3>
            <p className="url-display">{getDomain(url)}</p>
            <p className="url-full">{url}</p>
          </div>

          {/* Summary Section */}
          <div className="detail-section">
            <h4>Detection Summary</h4>
            {!stage1 && !stage3 && !stage4 ? (
              <div style={{ padding: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                <p>Running analysis... Stage results will appear here.</p>
              </div>
            ) : (
              <p style={{ color: '#374151', lineHeight: '1.6' }}>
                {stage1 ? `Stage 1 detected: ${stage1.verdict.toUpperCase()} (${Math.round(stage1.confidence)}% confidence)` : ''}
                {stage3 ? `Stage 3 detected: ${stage3.verdict.toUpperCase()} (${Math.round(stage3.confidence)}% confidence)` : 'Stage 3 not run'}
                {stage4 ? ` | Stage 4 verdict: ${stage4.verdict === 'yes' ? 'HARMFUL CONTENT' : stage4.verdict === 'no' ? 'NOT HARMFUL' : 'UNDETERMINED'}` : ''}
              </p>
            )}
          </div>

          {/* Stage 1 Section */}
          {stage1 && (
            <div className="detail-section stage-section">
              <div className="stage-header">
                <h3>Stage 1: Network & HTML Pattern Analysis</h3>
                <span className={`method-badge`}>{stage1.detectionMethod}</span>
              </div>

              <div className="analysis-box">
                <div className="verdict-box">
                  <strong>Verdict:</strong>
                  <span
                    className={`verdict-badge verdict-${stage1.verdict}`}
                    style={{
                      backgroundColor:
                        stage1.verdict === 'yes'
                          ? '#10b981'
                          : stage1.verdict === 'no'
                            ? '#gray'
                            : '#f59e0b',
                    }}
                  >
                    {stage1.verdict.toUpperCase()}
                  </span>
                </div>

                <div className="confidence-box">
                  <strong>Confidence:</strong>
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{
                        width: `${stage1.confidence}%`,
                        backgroundColor: getConfidenceColor(stage1.confidence),
                      }}
                    />
                  </div>
                  <span>{Math.round(stage1.confidence)}%</span>
                </div>

                {/* Detection Signals */}
                {stage1.evidence && stage1.evidence.length > 0 && (
                  <div className="evidence-section">
                    <strong>Detection Findings:</strong>
                    <ul className="evidence-list">
                      {stage1.evidence.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Network Providers */}
                {(stage1 as any).details?.networkProviders && (stage1 as any).details.networkProviders.length > 0 && (
                  <div className="prong">
                    <span className="prong-title">🌐 Age Verification Providers Detected:</span>
                    <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
                      {(stage1 as any).details.networkProviders.map((provider: string, idx: number) => (
                        <li key={idx}>{provider}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* HTML Snippets */}
                {(stage1 as any).details?.htmlSnippets && (stage1 as any).details.htmlSnippets.length > 0 && (
                  <div className="prong">
                    <span className="prong-title">📝 Age-Related Text Found:</span>
                    {(stage1 as any).details.htmlSnippets.map((snippet: string, idx: number) => (
                      <div key={idx} style={{ marginTop: '8px', padding: '8px', background: '#f9fafb', borderRadius: '4px', borderLeft: '3px solid #3b82f6' }}>
                        <code style={{ fontSize: '12px', color: '#374151' }}>"{snippet}"</code>
                      </div>
                    ))}
                  </div>
                )}

                {/* Consent Snippets */}
                {(stage1 as any).details?.consentSnippets && (stage1 as any).details.consentSnippets.length > 0 && (
                  <div className="prong">
                    <span className="prong-title">✓ Age Verification Language:</span>
                    {(stage1 as any).details.consentSnippets.map((snippet: string, idx: number) => (
                      <div key={idx} style={{ marginTop: '8px', padding: '8px', background: '#f9fafb', borderRadius: '4px', borderLeft: '3px solid #10b981' }}>
                        <code style={{ fontSize: '12px', color: '#374151' }}>"{snippet}"</code>
                      </div>
                    ))}
                  </div>
                )}

                {/* Form Fields */}
                {(stage1 as any).details?.formFields && (stage1 as any).details.formFields.length > 0 && (
                  <div className="prong">
                    <span className="prong-title">📋 Age Verification Form Fields:</span>
                    {(stage1 as any).details.formFields.map((field: { name: string; html: string }, idx: number) => (
                      <div key={idx} style={{ marginTop: '8px', padding: '8px', background: '#f9fafb', borderRadius: '4px', borderLeft: '3px solid #f59e0b' }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 'bold', color: '#1f2937' }}>Field: {field.name}</p>
                        <code style={{ fontSize: '11px', color: '#4b5563', display: 'block', overflow: 'auto', maxHeight: '80px' }}>{field.html}</code>
                      </div>
                    ))}
                  </div>
                )}

                {/* Meta Tags */}
                {(stage1 as any).details?.metaTags && (stage1 as any).details.metaTags.length > 0 && (
                  <div className="prong">
                    <span className="prong-title">🏷️ Meta Tags (Adult Content Indicators):</span>
                    {(stage1 as any).details.metaTags.map((tag: string, idx: number) => (
                      <div key={idx} style={{ marginTop: '8px', padding: '8px', background: '#f9fafb', borderRadius: '4px', borderLeft: '3px solid #ef4444' }}>
                        <code style={{ fontSize: '11px', color: '#4b5563', display: 'block', overflow: 'auto', maxHeight: '80px' }}>{tag}</code>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Code Evidence Section */}
          {codeEvidence && codeEvidence.length > 0 && (
            <div className="detail-section code-evidence-section">
              <h4>📝 Code Evidence (Stage 0)</h4>
              <div className="evidence-list">
                {codeEvidence.map((evidence, idx) => (
                  <div key={idx} className="evidence-item">
                    <div className="evidence-header">
                      <span className="evidence-desc">{evidence.description}</span>
                      <span className={`evidence-type evidence-type-${evidence.type}`}>
                        {evidence.type}
                      </span>
                    </div>
                    {evidence.location && (
                      <p className="evidence-location">📍 {evidence.location}</p>
                    )}
                    <div className="evidence-code">
                      <code>{evidence.code}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stage 3 Section */}
          {stage3 && (
            <div className="detail-section stage-section">
              <div className="stage-header">
                <h3>Stage 3: Visual Analysis (Screenshots)</h3>
                <span className={`method-badge`}>{stage3.detectionMethod}</span>
              </div>

              {stage3 && stage3.screenshot && (
                <div className="screenshot-dropdown">
                  <button 
                    className="screenshot-toggle"
                    onClick={() => setShowScreenshot(!showScreenshot)}
                  >
                    <span className="toggle-icon">{showScreenshot ? '▼' : '▶'}</span>
                    <span className="toggle-text">View Screenshot</span>
                    <span className="mature-warning">⚠️ May contain sensitive content</span>
                  </button>
                  {showScreenshot && (
                    <div className="screenshot-container">
                      <img
                        src={`data:image/png;base64,${stage3.screenshot}`}
                        alt="Page screenshot"
                        className="screenshot-image"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="analysis-box">
                <div className="verdict-box">
                  <strong>Verdict:</strong>
                  <span
                    className={`verdict-badge verdict-${stage3.verdict}`}
                    style={{
                      backgroundColor:
                        stage3.verdict === 'yes'
                          ? '#10b981'
                          : stage3.verdict === 'no'
                            ? '#gray'
                            : '#f59e0b',
                    }}
                  >
                    {stage3.verdict.toUpperCase()}
                  </span>
                </div>

                <div className="confidence-box">
                  <strong>Confidence:</strong>
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{
                        width: `${stage3.confidence}%`,
                        backgroundColor: getConfidenceColor(stage3.confidence),
                      }}
                    />
                  </div>
                  <span>{Math.round(stage3.confidence)}%</span>
                </div>

                {stage3.claudeAnalysis && (
                  <div className="analysis-section">
                    <strong>Claude Analysis:</strong>
                    <p className="analysis-text">{stage3.claudeAnalysis.reasoning}</p>
                  </div>
                )}

                {stage3.evidence && stage3.evidence.length > 0 && (
                  <div className="evidence-section">
                    <strong>Evidence Found:</strong>
                    <ul className="evidence-list">
                      {stage3.evidence.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stage 4 Section */}
          {stage4 && (
            <div className="detail-section stage-section">
              <div className="stage-header">
                <h3>Stage 4: Legal Content Analysis</h3>
                <span className={`method-badge`}>{stage4.detectionMethod}</span>
              </div>

              <div className="analysis-box">
                <div className="verdict-box">
                  <strong>Verdict:</strong>
                  <span
                    className={`verdict-badge verdict-${stage4.verdict}`}
                    style={{
                      backgroundColor:
                        stage4.verdict === 'yes'
                          ? '#ef4444'
                          : stage4.verdict === 'no'
                            ? '#10b981'
                            : '#f59e0b',
                    }}
                  >
                    {stage4.verdict === 'yes'
                      ? 'HARMFUL CONTENT'
                      : stage4.verdict === 'no'
                        ? 'NOT HARMFUL'
                        : 'UNDETERMINED'}
                  </span>
                </div>

                <div className="confidence-box">
                  <strong>Confidence:</strong>
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{
                        width: `${stage4.confidence}%`,
                        backgroundColor: getConfidenceColor(stage4.confidence),
                      }}
                    />
                  </div>
                  <span>{Math.round(stage4.confidence)}%</span>
                </div>

                {(stage4.category_analysis || stage4.content_assessment) && (
                  <div className="prongs-section">
                    <strong>Content Category Assessment:</strong>
                    
                    {stage4.content_category && (
                      <div className="prong">
                        <span className="prong-title">Content Category:</span>
                        <p style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>
                          {stage4.content_category === 'adult' && '🔞 Adult/Sexual Content'}
                          {stage4.content_category === 'gambling' && '🎰 Gambling/Betting'}
                          {stage4.content_category === 'alcohol' && '🍷 Alcohol/Beverages'}
                          {stage4.content_category === 'tobacco' && '🚬 Tobacco/Vaping'}
                          {stage4.content_category === 'drugs' && '💊 Drugs/Cannabis'}
                          {stage4.content_category === 'weapons' && '🔫 Weapons/Explosives'}
                          {stage4.content_category === 'services' && '⚙️ Age-Restricted Services'}
                          {stage4.content_category === 'general' && '✅ General Audience'}
                          {stage4.content_category === 'unknown' && '❓ Unknown Category'}
                        </p>
                      </div>
                    )}

                    {stage4.requires_age_verification !== undefined && (
                      <div className="prong">
                        <span className="prong-title">Requires Age Verification:</span>
                        <p style={{ 
                          color: stage4.requires_age_verification ? '#ef4444' : '#10b981',
                          fontWeight: 'bold'
                        }}>
                          {stage4.requires_age_verification ? '✗ YES - Age verification required' : '✓ NO - General audience content'}
                        </p>
                      </div>
                    )}

                    {stage4.category_analysis && (
                      <div className="prong">
                        <span className="prong-title">Category Analysis:</span>
                        <p>{stage4.category_analysis}</p>
                      </div>
                    )}

                    {stage4.content_assessment && (
                      <div className="prong">
                        <span className="prong-title">Content Assessment:</span>
                        <p>{stage4.content_assessment}</p>
                      </div>
                    )}

                    {stage4.reasoning_summary && (
                      <div className="prong">
                        <span className="prong-title">Summary:</span>
                        <p style={{ fontStyle: 'italic', color: '#374151' }}>{stage4.reasoning_summary}</p>
                      </div>
                    )}
                  </div>
                )}

                {stage4.evidence && stage4.evidence.length > 0 && (
                  <div className="evidence-section">
                    <strong>Evidence Found:</strong>
                    <ul className="evidence-list">
                      {stage4.evidence.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State if no stage data */}
          {!stage1 && !stage3 && !stage4 && (
            <div className="detail-section" style={{ textAlign: 'center', padding: '32px 16px' }}>
              <p style={{ color: '#6b7280' }}>No detailed stage analysis available yet.</p>
              <p style={{ color: '#9ca3af', fontSize: '13px' }}>Stage results will appear here once analysis completes.</p>
              {/* Debug info */}
              <details style={{ marginTop: '16px', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '12px' }}>Debug Info</summary>
                <pre style={{ background: '#f3f4f6', padding: '8px', borderRadius: '4px', fontSize: '11px', overflow: 'auto' }}>
                  {JSON.stringify({
                    hasStage1: !!stage1,
                    hasStage3: !!stage3,
                    hasStage4: !!stage4,
                    stage1Verdict: stage1 ? (stage1 as any).verdict : 'N/A',
                    stage3Verdict: stage3 ? (stage3 as any).verdict : 'N/A',
                    stage4Verdict: stage4 ? (stage4 as any).verdict : 'N/A',
                    isLoading,
                  }, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {/* Investigator Notes */}
          {investigatorNotes && (
            <div className="detail-section">
              <h3>Investigator Notes</h3>
              <div className="notes-box">
                <p>{investigatorNotes}</p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
