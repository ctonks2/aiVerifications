import React, { useState } from 'react';
import '../styles/DetailModal.css';

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
  prong1_analysis?: string;
  prong2_analysis?: string;
  prong3_analysis?: string;
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  stage3?: DetectionResult;
  stage4?: DetectionResult;
  investigatorNotes?: string;
  isLoading?: boolean;
}

const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  url,
  stage3,
  stage4,
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
            {!stage3 && !stage4 ? (
              <div style={{ padding: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                <p>Running analysis... Stage 3 and 4 results will appear here.</p>
              </div>
            ) : (
              <p style={{ color: '#374151', lineHeight: '1.6' }}>
                {stage3 ? `Stage 3 detected: ${stage3.verdict.toUpperCase()} (${Math.round(stage3.confidence)}% confidence)` : 'Stage 3 not run'}
                {stage4 ? ` | Stage 4 verdict: ${stage4.verdict === 'yes' ? 'HARMFUL CONTENT' : stage4.verdict === 'no' ? 'NOT HARMFUL' : 'UNDETERMINED'}` : ''}
              </p>
            )}
          </div>

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

                {(stage4.prong1_analysis || stage4.prong2_analysis || stage4.prong3_analysis) && (
                  <div className="prongs-section">
                    <strong>Legal Analysis Prongs:</strong>
                    {stage4.prong1_analysis && (
                      <div className="prong">
                        <span className="prong-title">Prong 1 (Explicit Sexual Material):</span>
                        <p>{stage4.prong1_analysis}</p>
                      </div>
                    )}
                    {stage4.prong2_analysis && (
                      <div className="prong">
                        <span className="prong-title">Prong 2 (Patently Offensive):</span>
                        <p>{stage4.prong2_analysis}</p>
                      </div>
                    )}
                    {stage4.prong3_analysis && (
                      <div className="prong">
                        <span className="prong-title">Prong 3 (Serious Value):</span>
                        <p>{stage4.prong3_analysis}</p>
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
          {!stage3 && !stage4 && (
            <div className="detail-section" style={{ textAlign: 'center', padding: '32px 16px' }}>
              <p style={{ color: '#6b7280' }}>No detailed stage analysis available yet.</p>
              <p style={{ color: '#9ca3af', fontSize: '13px' }}>Stage 3 and 4 results will appear here once analysis completes.</p>
              {/* Debug info */}
              <details style={{ marginTop: '16px', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '12px' }}>Debug Info</summary>
                <pre style={{ background: '#f3f4f6', padding: '8px', borderRadius: '4px', fontSize: '11px', overflow: 'auto' }}>
                  {JSON.stringify({
                    hasStage3: !!stage3,
                    hasStage4: !!stage4,
                    stage3Verdict: stage3?.verdict,
                    stage4Verdict: stage4?.verdict,
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
