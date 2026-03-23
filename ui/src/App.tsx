import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TestForm from './components/TestForm';
import ResultsTable from './components/ResultsTable';
import StatsSummary from './components/StatsSummary';
import DetailModal from './components/DetailModal';
import './App.css';

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

const API_URL = 'http://localhost:3001/api';

function App() {
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/history`);
      setTestHistory(response.data.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const handleTest = async (url: string) => {
    setLoading(true);
    setError(null);
    setLastResult(null);

    try {
      // Use a long timeout since Stage 3 and 4 analysis can take a while
      const response = await axios.post(`${API_URL}/test`, { url }, { timeout: 5 * 60 * 1000 }); // 5 minutes
      setLastResult(response.data.result);
      const newTestResult = response.data.testResult;
      setTestHistory([newTestResult, ...testHistory]);
      
      // Automatically open details modal with the new test result
      setSelectedResult(newTestResult);
      setIsModalOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to test URL');
      console.error('Test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      try {
        await axios.post(`${API_URL}/history/clear`);
        setTestHistory([]);
        setLastResult(null);
        setError(null);
      } catch (err) {
        console.error('Failed to clear history:', err);
      }
    }
  };

  const handleRowClick = (result: TestResult) => {
    setSelectedResult(result);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedResult(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Age Verification Compliance Inspector</h1>
          <p className="app-subtitle">Utah Regulatory Technology Verification</p>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          {/* Test Form Section */}
          <section className="section form-section">
            <TestForm onTest={handleTest} loading={loading} />
          </section>

          {/* Error Display */}
          {error && (
            <div className="error-banner">
              <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>{error}</p>
              <button className="error-close" onClick={() => setError(null)}>×</button>
            </div>
          )}

          {/* Last Result Summary */}
          {lastResult && (
            <section className="section result-summary">
              <StatsSummary result={lastResult} />
            </section>
          )}

          {/* Test History Section */}
          {testHistory.length > 0 && (
            <section className="section history-section">
              <div className="section-header">
                <h2>Test History</h2>
                <button className="btn-clear" onClick={handleClearHistory}>Clear History</button>
              </div>
              <ResultsTable results={testHistory} onRowClick={handleRowClick} />
            </section>
          )}

          {/* Empty State */}
          {!lastResult && testHistory.length === 0 && !loading && (
            <div className="empty-state">
              <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                <path d="M12 6v6m0 4v.01" />
              </svg>
              <h3>No tests yet</h3>
              <p>Enter a URL above to start testing for age verification compliance</p>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedResult && (
        <DetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          url={selectedResult.url}
          stage3={selectedResult.fullReport?.allStages?.stage3}
          stage4={selectedResult.fullReport?.allStages?.stage4}
          investigatorNotes={selectedResult.investigatorNotes}
          isLoading={loading}
        />
      )}

      <footer className="app-footer">
        <p>Age Verification Compliance Testing System | Utah State Technology</p>
      </footer>
    </div>
  );
}

export default App;
