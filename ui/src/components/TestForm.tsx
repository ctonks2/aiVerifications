import React, { useState } from 'react';

interface TestFormProps {
  onTest: (url: string) => void;
  loading: boolean;
}

const TestForm: React.FC<TestFormProps> = ({ onTest, loading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onTest(url);
      setUrl('');
    }
  };

  const suggestedSites = [
    'https://www.pornhub.com/',
    'https://www.draftkings.com/',
    'https://www.totalwine.com/',
  ];

  return (
    <form onSubmit={handleSubmit} className="test-form">
      <div className="input-group">
        <label className="input-label">Website URL to Test</label>
        <input
          type="url"
          className="input-field"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          required
        />
        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
          Enter the full URL of the website you want to test for age verification compliance
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner"></span>
              Testing...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Start Test
            </>
          )}
        </button>
      </div>

      {!loading && (
        <div className="suggested-sites">
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.75rem' }}>
            Quick test sites:
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {suggestedSites.map((site) => (
              <button
                key={site}
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                onClick={() => {
                  setUrl(site);
                }}
              >
                {new URL(site).hostname}
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
};

export default TestForm;
