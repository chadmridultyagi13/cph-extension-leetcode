// resultDisplay.tsx

import React from 'react';
import * as vscode from 'vscode';

export interface TestCaseResult {
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    executionTime?: number;
}

interface ResultDisplayProps {
    results: TestCaseResult[];
    error?: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ results = [], error }) => {
    // Function to create webview content
    const getStatusIcon = (passed: boolean) => {
        return passed ? '✅' : '❌';
    };

    return (
        <div className="result-display">
            {error ? (
                <div className="error-container">
                    <h3 className="error-title">Error Occurred</h3>
                    <div className="error-message">{error}</div>
                </div>
            ) : (
                <div className="results-container">
                    <h3 className="results-title">Test Case Results</h3>
                    <div className="summary">
                        Total Tests: {results.length} | 
                        Passed: {results.filter(r => r.passed).length} | 
                        Failed: {results.filter(r => !r.passed).length}
                    </div>
                    {results.map((result, index) => (
                        <div key={index} className={`test-case ${result.passed ? 'passed' : 'failed'}`}>
                            <div className="test-header">
                                {getStatusIcon(result.passed)} Test Case {index + 1}
                                {result.executionTime && 
                                    <span className="execution-time">({result.executionTime}ms)</span>
                                }
                            </div>
                            <div className="test-details">
                                <div className="input">
                                    <strong>Input:</strong> {result.input}
                                </div>
                                <div className="expected">
                                    <strong>Expected:</strong> {result.expectedOutput}
                                </div>
                                <div className="actual">
                                    <strong>Actual:</strong> {result.actualOutput}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ResultDisplay;