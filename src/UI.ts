import * as vscode from "vscode";
import * as fs from "fs/promises";
import * as path from "path";

export class TestCasesPanel {
  private static currentPanel: TestCasesPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent();
    this.setupWebviewMessageListener();
  }

  public static reveal() {
    const panel = TestCasesPanel.createOrShow();
    panel.updateContent();
    return panel;
  }

  public static createOrShow() {
    const column = vscode.ViewColumn.Two;

    if (TestCasesPanel.currentPanel) {
      TestCasesPanel.currentPanel._panel.reveal(column, true);
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
      const workspace = vscode.workspace.workspaceFolders?.[0];
      if (!workspace) {
        throw new Error("No workspace folder found");
      }

      const testCasesPath = path.join(workspace.uri.fsPath, "test_cases");

      try {
        await fs.access(testCasesPath);
      } catch {
        throw new Error("Test cases folder not found");
      }

      const inputPath = path.join(testCasesPath, "input.txt");
      const expectedOutputPath = path.join(
        testCasesPath,
        "expected_output.txt"
      );

      let input = "";
      let expectedOutput = "";

      try {
        input = await fs.readFile(inputPath, "utf8");
      } catch {
        throw new Error("input.txt not found in test_cases folder");
      }

      try {
        expectedOutput = await fs.readFile(expectedOutputPath, "utf8");
      } catch {
        throw new Error("expected_output.txt not found in test_cases folder");
      }

      this._panel.webview.postMessage({
        type: "update",
        input,
        expectedOutput,
      });
    } catch (error) {
      this._panel.webview.postMessage({
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async saveInput(input: string) {
    try {
      const workspace = vscode.workspace.workspaceFolders?.[0];
      if (!workspace) {
        throw new Error("No workspace folder found");
      }

      const inputPath = path.join(
        workspace.uri.fsPath,
        "test_cases",
        "input.txt"
      );
      await fs.writeFile(inputPath, input, "utf8");
      vscode.window.showInformationMessage(
        "Input test cases updated successfully!"
      );
    } catch (error) {
      vscode.window.showErrorMessage(`Error saving input: ${error}`);
    }
  }

  private async saveExpectedOutput(expectedOutput: string) {
    try {
      const workspace = vscode.workspace.workspaceFolders?.[0];
      if (!workspace) {
        throw new Error("No workspace folder found");
      }

      const outputPath = path.join(
        workspace.uri.fsPath,
        "test_cases",
        "expected_output.txt"
      );
      await fs.writeFile(outputPath, expectedOutput, "utf8");
      vscode.window.showInformationMessage(
        "Expected outputs updated successfully!"
      );
    } catch (error) {
      vscode.window.showErrorMessage(`Error saving expected outputs: ${error}`);
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
      :root {
        --bg-primary: #2c2c1e;
        --bg-secondary: #3c3c2a;
        --text-primary: #f0f0d0;
        --text-secondary: #ffd700;
        --accent-color: #daa520;
        --accent-hover: #ffb300;
        --border-color: #8b8b00;
        --error-bg: #ffff0033;
        --error-text: #ffd700;
      }

      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: var(--bg-primary);
        color: var(--text-primary);
        line-height: 1.6;
        margin: 0;
        padding: 20px;
      }

      .container { 
        display: flex; 
        flex-direction: column; 
        gap: 20px;
        max-width: 800px;
        margin: 0 auto;
      }

      .section { 
        background: var(--bg-secondary); 
        padding: 20px; 
        border-radius: 8px;
        border: 2px solid var(--border-color);
        box-shadow: 0 4px 6px rgba(139, 139, 0, 0.2);
        transition: transform 0.2s ease;
      }

      .section:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 8px rgba(139, 139, 0, 0.3);
      }

      h3 { 
        margin-top: 0; 
        color: var(--text-secondary);
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid var(--accent-color);
        padding-bottom: 10px;
        font-weight: 600;
      }

      textarea {
        width: 100%;
        min-height: 150px;
        background: var(--bg-primary);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 12px;
        font-family: 'Cascadia Code', 'Fira Code', monospace;
        resize: vertical;
        transition: border-color 0.3s ease;
        outline: none;
      }

      textarea:focus {
        border-color: var(--accent-color);
        box-shadow: 0 0 5px rgba(218, 165, 32, 0.5);
      }

      pre { 
        white-space: pre-wrap; 
        word-wrap: break-word; 
        margin: 0;
        padding: 12px;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
      }

      button {
        background: var(--accent-color);
        color: var(--bg-primary);
        border: 1px solid var(--border-color);
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        transition: background 0.3s ease, transform 0.2s ease;
      }

      button:hover {
        background: var(--accent-hover);
        transform: scale(1.05);
      }

      .button-group {
        display: flex;
        gap: 10px;
      }

      small {
        color: var(--text-secondary);
        opacity: 0.7;
      }

      .error {
        color: var(--error-text);
        background: var(--error-bg);
        padding: 15px;
        border-radius: 6px;
        border: 1px solid var(--error-text);
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .error::before {
        content: '⚠️';
        font-size: 1.5em;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="section">
        <h3>
          Test Cases Input
          <div class="button-group">
            <button id="saveInput">Save Input</button>
          </div>
        </h3>
        <textarea id="input" placeholder="Enter your test cases here..."></textarea>
        <div style="margin-top: 10px;">
          <small>Each line represents a new test case</small>
        </div>
      </div>
      <div class="section">
        <h3>
          Expected Output
          <div class="button-group">
            <button id="saveExpected">Save Expected</button>
          </div>
        </h3>
        <textarea id="expected" placeholder="Enter expected outputs here..."></textarea>
        <div style="margin-top: 10px;">
          <small>Each line corresponds to a test case output</small>
        </div>
      </div>
      <div id="error-message" class="error" style="display: none;"></div>
    </div>
    <script>
      const vscode = acquireVsCodeApi();
      const inputTextarea = document.getElementById('input');
      const expectedTextarea = document.getElementById('expected');
      const saveInputBtn = document.getElementById('saveInput');
      const saveExpectedBtn = document.getElementById('saveExpected');
      const errorMessage = document.getElementById('error-message');

      saveInputBtn.addEventListener('click', () => {
        vscode.postMessage({
          type: 'saveInput',
          value: inputTextarea.value
        });
      });

      saveExpectedBtn.addEventListener('click', () => {
        vscode.postMessage({
          type: 'saveExpected',
          value: expectedTextarea.value
        });
      });

      window.addEventListener('message', event => {
        const message = event.data;
        if (message.type === 'update') {
          inputTextarea.value = message.input;
          expectedTextarea.value = message.expectedOutput;
          errorMessage.style.display = 'none';
        } else if (message.type === 'error') {
          errorMessage.textContent = message.message;
          errorMessage.style.display = 'block';
        }
      });

      const handleTextareaResize = (element) => {
        element.style.height = 'auto';
        element.style.height = (element.scrollHeight) + 'px';
      };

      inputTextarea.addEventListener('input', () => handleTextareaResize(inputTextarea));
      expectedTextarea.addEventListener('input', () => handleTextareaResize(expectedTextarea));
    </script>
  </body>
</html>`;
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
          case "saveExpected":
            await this.saveExpectedOutput(message.value);
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