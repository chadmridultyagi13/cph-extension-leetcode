import * as vscode from "vscode";
import * as fs from "fs/promises";
import * as path from "path";

export class TestCasesPanel {
  public static currentPanel: TestCasesPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent();
    this.setupWebviewMessageListener();
  }

  public static createOrShow() {
    const column = vscode.ViewColumn.Two;

    if (TestCasesPanel.currentPanel) {
      TestCasesPanel.currentPanel._panel.reveal(column);
      return TestCasesPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      "testCases",
      "Test Cases",
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    TestCasesPanel.currentPanel = new TestCasesPanel(panel);
    return TestCasesPanel.currentPanel;
  }

  public async updateContent() {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        throw new Error("No workspace folder found");
      }

      const testCasesPath = path.join(workspaceFolder.uri.fsPath, "test_cases");
      const input = await fs.readFile(
        path.join(testCasesPath, "input.txt"),
        "utf8"
      );
      const expectedOutput = await fs.readFile(
        path.join(testCasesPath, "expected_output.txt"),
        "utf8"
      );
      const output = await fs
        .readFile(path.join(testCasesPath, "output.txt"), "utf8")
        .catch(() => "");

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

  private async saveInput(input: string) {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        throw new Error("No workspace folder found");
      }

      const inputPath = path.join(
        workspaceFolder.uri.fsPath,
        "test_cases",
        "input.txt"
      );
      await fs.writeFile(inputPath, input, "utf8");
      vscode.window.showInformationMessage("Test cases updated successfully!");
    } catch (error) {
      vscode.window.showErrorMessage(`Error saving input: ${error}`);
    }
  }

  private _getWebviewContent() {
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
            .test-case {
              margin-bottom: 15px;
              padding: 10px;
              border: 1px solid var(--vscode-input-border);
              border-radius: 3px;
            }
            .test-case-header {
              font-weight: bold;
              margin-bottom: 8px;
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
          </div>
          <script>
            const vscode = acquireVsCodeApi();
            const inputTextarea = document.getElementById('input');
            const saveButton = document.getElementById('saveInput');

            saveButton.addEventListener('click', () => {
              vscode.postMessage({
                type: 'saveInput',
                value: inputTextarea.value
              });
            });

            window.addEventListener('message', event => {
              const message = event.data;
              if (message.type === 'update') {
                inputTextarea.value = message.input;
                document.getElementById('expected-output').textContent = message.expectedOutput;
                document.getElementById('output').textContent = message.output || 'No output yet';
              }
            });

            inputTextarea.addEventListener('input', function() {
              this.style.height = 'auto';
              this.style.height = (this.scrollHeight) + 'px';
            });
          </script>
        </body>
      </html>
    `;
  }

  private setupWebviewMessageListener() {
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
    TestCasesPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}