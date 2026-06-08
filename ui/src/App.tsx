import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TestForm from './components/TestForm';
import ResultsTable from './components/ResultsTable';
import StatsSummary from './components/StatsSummary';
import DetailModal from './components/DetailModal';
import WebsiteListManager from './components/WebsiteListManager';
import ReportNavigator from './components/ReportNavigator';
import './App.css';

interface Website {
  id: string;
  url: string;
  selected: boolean;
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
  codeEvidence?: Array<{ description: string; code: string; type: string; location?: string }>;
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
  
  // Website list state
  const [websites, setWebsites] = useState<Website[]>([]);
  
  // Batch testing state
  const [batchResults, setBatchResults] = useState<TestResult[]>([]);
  const [isReportNavigatorOpen, setIsReportNavigatorOpen] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

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

  const handleBatchTest = async (urls: string[]) => {
    setBatchLoading(true);
    setError(null);
    setBatchResults([]);

    const results: TestResult[] = [];
    
    for (let i = 0; i < urls.length; i++) {
      try {
        const response = await axios.post(
          `${API_URL}/test`,
          { url: urls[i] },
          { timeout: 5 * 60 * 1000 }
        );
        const testResult = response.data.testResult;
        results.push(testResult);
        
        // Update test history as we go
        setTestHistory((prev) => [testResult, ...prev]);
      } catch (err: any) {
        console.error(`Failed to test ${urls[i]}:`, err);
        // Create an error result for this URL
        results.push({
          id: Date.now().toString() + i,
          url: urls[i],
          timestamp: Date.now(),
          status: 'error',
          confidence: 0,
          ageVerificationFound: false,
          stage: null,
          humanReviewNeeded: false,
          explanation: err.response?.data?.error || 'Failed to test URL',
        });
      }
    }

    setBatchResults(results);
    setIsReportNavigatorOpen(true);
    setBatchLoading(false);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">A.G.N.E.S</h1>
          <p className="app-subtitle">Age Gate Next-Gen Enforcement System</p>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          {/* Website List Manager Section */}
          <section className="section website-list-section">
            <WebsiteListManager
              websites={websites}
              onWebsitesChange={setWebsites}
              onRunTests={handleBatchTest}
              loading={batchLoading}
            />
          </section>

          {/* Divider */}
          {websites.length > 0 && (
            <div style={{ textAlign: 'center', margin: '2rem 0', color: '#9ca3af' }}>
              <p style={{ margin: 0 }}>OR</p>
            </div>
          )}

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
          stage1={selectedResult.fullReport?.allStages?.stage1}
          stage3={selectedResult.fullReport?.allStages?.stage3}
          stage4={selectedResult.fullReport?.allStages?.stage4}
          codeEvidence={selectedResult.codeEvidence}
          investigatorNotes={selectedResult.investigatorNotes}
          isLoading={loading}
        />
      )}

      {/* Report Navigator Modal */}
      <ReportNavigator
        isOpen={isReportNavigatorOpen}
        onClose={() => {
          setIsReportNavigatorOpen(false);
          setBatchResults([]);
        }}
        results={batchResults}
        isLoading={batchLoading}
      />

      <footer className="app-footer">
        <p>Age Gate Next-Gen Enforcement System | Division TBD </p>
      </footer>
    </div>
  );
}

export default App;
