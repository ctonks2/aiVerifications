import React from 'react';

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
  fullReport?: any; // Complete ComplianceReport with all stages
}

interface ResultsTableProps {
  results: TestResult[];
  onRowClick?: (result: TestResult) => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results, onRowClick }) => {
  const getStatusClass = (status: string) => {
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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>URL</th>
            <th>Status</th>
            <th>Confidence</th>
            <th>Age Gate</th>
            <th>Review?</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr key={result.id} onClick={() => onRowClick?.(result)} className="clickable-row">
              <td className="url-cell" title={result.url}>
                {getDomain(result.url)}
              </td>
              <td>
                <span className={`status-badge ${getStatusClass(result.status)}`}>
                  {getStatusLabel(result.status)}
                </span>
              </td>
              <td>
                <div className="confidence-bar">
                  <div className="confidence-fill">
                    <div
                      className="confidence-fill-inner"
                      style={{ width: `${result.confidence}%` }}
                    ></div>
                  </div>
                  <div className="confidence-text">{result.confidence}%</div>
                </div>
              </td>
              <td>
                {result.ageVerificationFound ? (
                  <span style={{ color: '#10b981', fontWeight: '600' }}>
                    ✓ Stage {result.stage}
                  </span>
                ) : (
                  <span style={{ color: '#6b7280' }}>—</span>
                )}
              </td>
              <td>
                <span style={{ color: result.humanReviewNeeded ? '#ef4444' : '#10b981' }}>
                  {result.humanReviewNeeded ? '⚠ Yes' : '✓ No'}
                </span>
              </td>
              <td className="timestamp">{formatDate(result.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
