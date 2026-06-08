import React, { useState } from 'react';
import axios from 'axios';

interface TestFormProps {
  onTest: (url: string) => void;
  loading: boolean;
}

const API_URL = 'http://localhost:3001/api';

const TestForm: React.FC<TestFormProps> = ({ onTest, loading }) => {
  const [url, setUrl] = useState('');
  const [allStagesLoading, setAllStagesLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onTest(url);
      setUrl('');
    }
  };

  const handleAllStagesTest = async () => {
    setAllStagesLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/test-all-stages`,
        { url: 'https://www.pornhub.com/' },
        { timeout: 5 * 60 * 1000 }
      );
      // Reload the page or update history to show the result
      window.location.reload();
    } catch (err: any) {
      console.error('All stages test failed:', err);
      alert(`Error: ${err.response?.data?.error || 'Failed to run all-stages test'}`);
    } finally {
      setAllStagesLoading(false);
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

      {!loading && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.75rem' }}>
            🎬 Deep Analysis:
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={allStagesLoading}
            onClick={handleAllStagesTest}
            style={{
              width: '100%',
              backgroundColor: '#8b5cf6',
              borderColor: '#8b5cf6',
            }}
          >
            {allStagesLoading ? (
              <>
                <span className="spinner"></span>
                Running All Stages...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
                Test All Stages (Pornhub)
              </>
            )}
          </button>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
            Forces all 4 detection stages to run regardless of confidence levels
          </p>
        </div>
      )}
    </form>
  );
};

export default TestForm;
