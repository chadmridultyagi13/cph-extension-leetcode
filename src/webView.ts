// webView.ts

import * as vscode from "vscode";
import * as fs from "fs/promises";
import * as path from "path";

export interface TestCaseResult {
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    executionTime?: number;
}

export class WebViewProvider {
    public static currentPanel: WebViewProvider | undefined;
    public readonly _panel: vscode.WebviewPanel;
    public _disposables: vscode.Disposable[] = [];

    public constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getWebviewContent();
        this.setupWebviewMessageListener();
    }

    public static createOrShow() {
        const column = vscode.ViewColumn.Two;

        if (WebViewProvider.currentPanel) {
            WebViewProvider.currentPanel._panel.reveal(column);
            return WebViewProvider.currentPanel;
        }

        const panel = vscode.window.createWebviewPanel(
            "testCases",
            "LeetCode Test Cases",
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        WebViewProvider.currentPanel = new WebViewProvider(panel);
        return WebViewProvider.currentPanel;
    }

    // Function to update test case content
    public async updateContent() {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error("No workspace folder found");
            }

            const testCasesPath = path.join(workspaceFolder.uri.fsPath, "test_cases");
            const input = await fs.readFile(path.join(testCasesPath, "input.txt"), "utf8");
            const expectedOutput = await fs.readFile(path.join(testCasesPath, "expected_output.txt"), "utf8");
            const output = await fs.readFile(path.join(testCasesPath, "output.txt"), "utf8").catch(() => "");

            this._panel.webview.postMessage({
                type: "update",
                input,
                expectedOutput,
                output,
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Error updating test cases: ${error}`);
        }
    }

    // Function to display test results
    public displayResults(results: TestCaseResult[]) {
        this._panel.webview.postMessage({
            type: "updateResults",
            results,
        });
    }

    // Function to save input test cases
    public async saveInput(input: string) {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error("No workspace folder found");
            }

            const inputPath = path.join(workspaceFolder.uri.fsPath, "test_cases", "input.txt");
            await fs.writeFile(inputPath, input, "utf8");
            vscode.window.showInformationMessage("Test cases updated successfully!");
        } catch (error) {
            vscode.window.showErrorMessage(`Error saving input: ${error}`);
        }
    }

    // Function to get webview content
    public _getWebviewContent() {
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { 
                            font-family: var(--vscode-font-family); 
                            padding: 20px; 
                            color: var(--vscode-foreground);
                        }
                        .container { 
                            display: flex; 
                            flex-direction: column; 
                            gap: 20px; 
                        }
                        .section { 
                            background: var(--vscode-editor-background); 
                            padding: 15px; 
                            border-radius: 5px;
                        }
                        h3 { 
                            margin-top: 0; 
                            color: var(--vscode-foreground);
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        }
                        textarea {
                            width: 100%;
                            min-height: 100px;
                            background: var(--vscode-input-background);
                            color: var(--vscode-input-foreground);
                            border: 1px solid var(--vscode-input-border);
                            padding: 8px;
                            font-family: var(--vscode-editor-font-family);
                            resize: vertical;
                        }
                        pre { 
                            white-space: pre-wrap; 
                            word-wrap: break-word; 
                            margin: 0;
                            padding: 8px;
                            background: var(--vscode-input-background);
                            border: 1px solid var(--vscode-input-border);
                        }
                        button {
                            background: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                            border: none;
                            padding: 4px 12px;
                            border-radius: 3px;
                            cursor: pointer;
                        }
                        button:hover {
                            background: var(--vscode-button-hoverBackground);
                        }
                        .test-results {
                            margin-top: 20px;
                        }
                        .test-case {
                            margin-bottom: 15px;
                            padding: 10px;
                            border: 1px solid var(--vscode-input-border);
                            border-radius: 3px;
                            background: var(--vscode-editor-background);
                        }
                        .test-case.passed {
                            border-left: 4px solid var(--vscode-testing-iconPassed, #73c991);
                        }
                        .test-case.failed {
                            border-left: 4px solid var(--vscode-testing-iconFailed, #f14c4c);
                        }
                        .test-case-header {
                            font-weight: bold;
                            margin-bottom: 8px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        }
                        .test-case-content {
                            margin-left: 10px;
                        }
                        .execution-time {
                            font-size: 0.9em;
                            color: var(--vscode-descriptionForeground);
                        }
                        .status-icon {
                            margin-right: 8px;
                        }
                        .results-summary {
                            padding: 10px;
                            margin-bottom: 15px;
                            background: var(--vscode-editor-background);
                            border-radius: 3px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="section">
                            <h3>
                                Test Cases Input
                                <button id="saveInput">Save Changes</button>
                            </h3>
                            <textarea id="input" placeholder="Enter your test cases here..."></textarea>
                            <div style="margin-top: 10px;">
                                <small>Each line represents a new test case. Save changes to update the test file.</small>
                            </div>
                        </div>
                        <div class="section">
                            <h3>Expected Output</h3>
                            <pre id="expected-output"></pre>
                        </div>
                        <div class="section">
                            <h3>Your Output</h3>
                            <pre id="output"></pre>
                        </div>
                        <div id="results-container" class="section" style="display: none;">
                            <h3>Test Results</h3>
                            <div id="results-summary"></div>
                            <div id="test-results"></div>
                        </div>
                    </div>
                    <script>
                        const vscode = acquireVsCodeApi();
                        const inputTextarea = document.getElementById('input');
                        const saveButton = document.getElementById('saveInput');

                        // Save input handler
                        saveButton.addEventListener('click', () => {
                            vscode.postMessage({
                                type: 'saveInput',
                                value: inputTextarea.value
                            });
                        });

                        // Message handler
                        window.addEventListener('message', event => {
                            const message = event.data;
                            switch (message.type) {
                                case 'update':
                                    handleUpdate(message);
                                    break;
                                case 'updateResults':
                                    handleResults(message.results);
                                    break;
                            }
                        });

                        // Update handler
                        function handleUpdate(message) {
                            inputTextarea.value = message.input;
                            document.getElementById('expected-output').textContent = message.expectedOutput;
                            document.getElementById('output').textContent = message.output || 'No output yet';
                        }

                        // Results handler
                        function handleResults(results) {
                            const container = document.getElementById('results-container');
                            const summary = document.getElementById('results-summary');
                            const resultsDiv = document.getElementById('test-results');
                            
                            container.style.display = 'block';
                            
                            const passedCount = results.filter(r => r.passed).length;
                            const totalTime = results.reduce((sum, r) => sum + (r.executionTime || 0), 0);
                            
                            summary.innerHTML = \`
                                <div class="results-summary">
                                    <div>Total Tests: \${results.length}</div>
                                    <div>Passed: \${passedCount} | Failed: \${results.length - passedCount}</div>
                                    \${totalTime > 0 ? \`<div>Total Time: \${totalTime}ms</div>\` : ''}
                                </div>
                            \`;

                            resultsDiv.innerHTML = results.map((result, index) => \`
                                <div class="test-case \${result.passed ? 'passed' : 'failed'}">
                                    <div class="test-case-header">
                                        <span>
                                            <span class="status-icon">\${result.passed ? '✅' : '❌'}</span>
                                            Test Case \${index + 1}
                                        </span>
                                        \${result.executionTime ? \`
                                            <span class="execution-time">\${result.executionTime}ms</span>
                                        \` : ''}
                                    </div>
                                    <div class="test-case-content">
                                        <div><strong>Input:</strong> \${result.input}</div>
                                        <div><strong>Expected:</strong> \${result.expectedOutput}</div>
                                        <div><strong>Actual:</strong> \${result.actualOutput}</div>
                                    </div>
                                </div>
                            \`).join('');
                        }

                        // Auto-resize textarea
                        inputTextarea.addEventListener('input', function() {
                            this.style.height = 'auto';
                            this.style.height = (this.scrollHeight) + 'px';
                        });
                    </script>
                </body>
            </html>
        `;
    }

    public setupWebviewMessageListener() {
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case "refresh":
                        await this.updateContent();
                        break;
                    case "saveInput":
                        await this.saveInput(message.value);
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    public dispose() {
        WebViewProvider.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}