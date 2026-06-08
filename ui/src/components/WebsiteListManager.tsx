import React, { useState } from 'react';
import './WebsiteListManager.css';

interface Website {
  id: string;
  url: string;
  selected: boolean;
}

interface WebsiteListManagerProps {
  websites: Website[];
  onWebsitesChange: (websites: Website[]) => void;
  onRunTests: (selectedUrls: string[]) => void;
  loading: boolean;
}

const WebsiteListManager: React.FC<WebsiteListManagerProps> = ({
  websites,
  onWebsitesChange,
  onRunTests,
  loading,
}) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addWebsite = () => {
    if (!input.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Automatically add https:// if no scheme is present
    let urlToAdd = input.trim();
    if (!urlToAdd.match(/^https?:\/\//i)) {
      urlToAdd = 'https://' + urlToAdd;
    }

    try {
      new URL(urlToAdd);
    } catch {
      setError('Invalid URL format');
      return;
    }

    const newWebsite: Website = {
      id: Date.now().toString(),
      url: urlToAdd,
      selected: true,
    };

    onWebsitesChange([...websites, newWebsite]);
    setInput('');
    setError(null);
  };

  const removeWebsite = (id: string) => {
    onWebsitesChange(websites.filter((w) => w.id !== id));
  };

  const toggleWebsite = (id: string) => {
    onWebsitesChange(
      websites.map((w) => (w.id === id ? { ...w, selected: !w.selected } : w))
    );
  };

  const selectAll = () => {
    onWebsitesChange(websites.map((w) => ({ ...w, selected: true })));
  };

  const deselectAll = () => {
    onWebsitesChange(websites.map((w) => ({ ...w, selected: false })));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addWebsite();
    }
  };

  const selectedCount = websites.filter((w) => w.selected).length;
  const canRunTests = selectedCount > 0 && !loading;

  return (
    <div className="website-list-manager">
      <div className="list-section">
        <h2>Website List</h2>

        {/* Add Website Input */}
        <div className="website-input-group">
          <input
            type="url"
            className="input-field"
            placeholder="https://example.com"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <button
            className="btn btn-secondary"
            onClick={addWebsite}
            disabled={loading}
          >
            Add Website
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}

        {/* Website List */}
        {websites.length > 0 && (
          <>
            <div className="list-controls">
              <div className="control-buttons">
                <button
                  className="btn-control"
                  onClick={selectAll}
                  disabled={loading}
                >
                  Select All
                </button>
                <button
                  className="btn-control"
                  onClick={deselectAll}
                  disabled={loading}
                >
                  Deselect All
                </button>
              </div>
              <p className="selection-count">
                {selectedCount} of {websites.length} selected
              </p>
            </div>

            <div className="website-list">
              {websites.map((website) => (
                <div key={website.id} className="website-item">
                  <input
                    type="checkbox"
                    checked={website.selected}
                    onChange={() => toggleWebsite(website.id)}
                    disabled={loading}
                    className="website-checkbox"
                  />
                  <span className="website-url">
                    {new URL(website.url).hostname}
                  </span>
                  <span className="website-full-url">{website.url}</span>
                  <button
                    className="btn-remove"
                    onClick={() => removeWebsite(website.id)}
                    disabled={loading}
                    title="Remove website"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Run Tests Button */}
            <button
              className="btn btn-primary btn-run-tests"
              onClick={() =>
                onRunTests(websites.filter((w) => w.selected).map((w) => w.url))
              }
              disabled={!canRunTests}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Testing {selectedCount} {selectedCount === 1 ? 'site' : 'sites'}...
                </>
              ) : (
                <>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Run Tests on {selectedCount} {selectedCount === 1 ? 'site' : 'sites'}
                </>
              )}
            </button>
          </>
        )}

        {websites.length === 0 && (
          <div className="empty-list">
            <p>No websites added yet. Add one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebsiteListManager;
