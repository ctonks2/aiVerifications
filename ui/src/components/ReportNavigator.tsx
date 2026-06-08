import React from 'react';
import '../styles/ReportNavigator.css';

interface CodeEvidence {
  description: string;
  code: string;
  type: 'attribute' | 'text' | 'element' | 'href' | 'form';
  location?: string;
}

interface TestResult {
  id: string;
  url: string;
  timestamp: number;
  status: string;
  confidence: number;
  ageVerificationFound: boolean;
  stage: number | null;
  humanReviewNeeded: boolean;
  explanation: string;
  investigatorNotes?: string;
  codeEvidence?: CodeEvidence[];
  fullReport?: any;
}

interface ReportNavigatorProps {
  isOpen: boolean;
  onClose: () => void;
  results: TestResult[];
  isLoading?: boolean;
}

const ReportNavigator: React.FC<ReportNavigatorProps> = ({
  isOpen,
  onClose,
  results,
  isLoading,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  if (!isOpen || results.length === 0) return null;

  const currentResult = results[currentIndex];
  const hasNext = currentIndex < results.length - 1;
  const hasPrev = currentIndex > 0;

  const handleNext = () => {
    if (hasNext) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (hasPrev) {
      setCurrentIndex(currentIndex - 1);
    }
  };

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

  const getStatusColor = (verified: boolean) => {
    return verified ? '#10b981' : '#ef4444';
  };

  return (
    <div className="report-navigator-overlay" onClick={onClose}>
      <div className="report-navigator-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="report-header">
          <div className="report-title">
            <h2>Test Results</h2>
            <span className="report-counter">
              {currentIndex + 1} of {results.length}
            </span>
          </div>
          <button className="report-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="report-body">
          {/* Result Summary */}
          <div className="result-card">
            <div className="result-top">
              <div className="result-domain">
                <h3>{getDomain(currentResult.url)}</h3>
                <p className="result-url">{currentResult.url}</p>
              </div>
              <div className="result-badge">
                <span
                  className="confidence-badge"
                  style={{
                    backgroundColor: getConfidenceColor(currentResult.confidence),
                  }}
                >
                  {Math.round(currentResult.confidence)}% Confidence
                </span>
              </div>
            </div>

            {/* Verification Status */}
            <div className="result-status">
              <div className="status-item">
                <span className="status-label">Age Verification:</span>
                <span
                  className="status-value"
                  style={{
                    color: getStatusColor(currentResult.ageVerificationFound),
                  }}
                >
                  {currentResult.ageVerificationFound ? '✓ FOUND' : '✗ NOT FOUND'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Compliance Status:</span>
                <span className="status-value" style={{ color: '#3b82f6' }}>
                  {currentResult.status || 'Analyzed'}
                </span>
              </div>
              {currentResult.stage && (
                <div className="status-item">
                  <span className="status-label">Detection Stage:</span>
                  <span className="status-value" style={{ color: '#8b5cf6' }}>
                    Stage {currentResult.stage}
                  </span>
                </div>
              )}
            </div>

            {/* Explanation */}
            <div className="result-explanation">
              <h4>Analysis</h4>
              <p>{currentResult.explanation}</p>
            </div>

            {/* Code Evidence */}
            {currentResult.codeEvidence && currentResult.codeEvidence.length > 0 && (
              <div className="result-code-evidence">
                <h4>📝 Code Evidence Detected</h4>
                <div className="evidence-list">
                  {currentResult.codeEvidence.map((evidence, idx) => (
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

            {/* Additional Info */}
            {currentResult.investigatorNotes && (
              <div className="result-notes">
                <h4>Notes</h4>
                <p>{currentResult.investigatorNotes}</p>
              </div>
            )}

            {currentResult.humanReviewNeeded && (
              <div className="result-warning">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                  <path d="M12 6v6m0 4v.01" />
                </svg>
                <span>Human review recommended</span>
              </div>
            )}

            {/* Result Metadata */}
            <div className="result-metadata">
              <p>
                Tested:{' '}
                {new Date(currentResult.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="report-navigation">
          <button
            className="nav-btn nav-btn-prev"
            onClick={handlePrev}
            disabled={!hasPrev}
          >
            ← Back
          </button>

          <div className="nav-progress">
            <div className="progress-dots">
              {results.map((_, idx) => (
                <div
                  key={idx}
                  className={`dot ${idx === currentIndex ? 'active' : ''}`}
                  onClick={() => setCurrentIndex(idx)}
                  title={getDomain(results[idx].url)}
                ></div>
              ))}
            </div>
          </div>

          <button
            className="nav-btn nav-btn-next"
            onClick={handleNext}
            disabled={!hasNext}
          >
            Next →
          </button>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="report-loading">
            <span className="spinner"></span>
            Analyzing test results...
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportNavigator;
