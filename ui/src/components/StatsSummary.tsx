import React from 'react';

interface Result {
  complianceStatus: string;
  confidence: number;
  ageVerificationFound: {
    found: boolean;
    stage?: number;
    details?: string;
  };
  humanReviewNeeded: boolean;
  explanation: string;
}

interface StatsSummaryProps {
  result: Result;
}

const StatsSummary: React.FC<StatsSummaryProps> = ({ result }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return 'status-compliant';
      case 'NOT_COMPLIANT':
        return 'status-not-compliant';
      case 'NOT_REQUIRED':
        return 'status-not-required';
      default:
        return 'status-uncertain';
    }
  };

  const getStatusLabel = (status: string) => status.replace(/_/g, ' ');

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: '#002868' }}>Last Test Result</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Compliance Status</div>
          <div className="stat-value" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            <span className={`status-badge ${getStatusColor(result.complianceStatus)}`}>
              {getStatusLabel(result.complianceStatus)}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Confidence Level</div>
          <div className="stat-value">{result.confidence}%</div>
          <div className="confidence-bar" style={{ marginTop: '0.75rem' }}>
            <div className="confidence-fill">
              <div
                className="confidence-fill-inner"
                style={{ width: `${result.confidence}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Age Verification</div>
          <div className="stat-value" style={{ fontSize: '1.25rem' }}>
            {result.ageVerificationFound.found ? (
              <>
                ✓ Found
                <div className="stat-detail">Stage {result.ageVerificationFound.stage}</div>
              </>
            ) : (
              'Not Found'
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Human Review</div>
          <div className="stat-value" style={{ fontSize: '1.25rem' }}>
            {result.humanReviewNeeded ? '⚠ Required' : '✓ Not Required'}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '1rem',
          background: '#f3f4f6',
          borderRadius: '8px',
          borderLeft: '4px solid #002868',
        }}
      >
        <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#374151' }}>
          <strong>Explanation:</strong> {result.explanation}
        </p>
        {result.ageVerificationFound.found && result.ageVerificationFound.details && (
          <p style={{ fontSize: '0.85rem', lineHeight: '1.5', color: '#6b7280', marginTop: '0.75rem' }}>
            <strong>Provider Details:</strong> {result.ageVerificationFound.details}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatsSummary;
