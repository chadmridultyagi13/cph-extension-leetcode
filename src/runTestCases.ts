import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import {
  compileCpp,
  execute,
  parseTestCaseLine,
  generateInputString,
} from "./codeExecutor";

export async function runTestCasesCommand(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor");
    return;
  }

  const codePath = editor.document.uri.fsPath;
  const language = codePath.endsWith(".cpp")
    ? "cpp"
    : codePath.endsWith(".py")
    ? "python"
    : null;
  if (!language) {
    vscode.window.showErrorMessage("Unsupported file type");
    return;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceFolder) {
    vscode.window.showErrorMessage("No workspace folder open");
    return;
  }

  const testCasesPath = path.join(workspaceFolder, "test_cases");
  const inputFile = path.join(testCasesPath, "input.txt");
  const expectedOutputFile = path.join(testCasesPath, "expected_output.txt");
  const outputFile = path.join(testCasesPath, "output.txt");

  if (!fs.existsSync(inputFile) || !fs.existsSync(expectedOutputFile)) {
    vscode.window.showErrorMessage("Test cases not found. Fetch them first.");
    return;
  }

  const inputText = fs.readFileSync(inputFile, "utf-8");
  const expectedOutputText = fs.readFileSync(expectedOutputFile, "utf-8");

  const testCaseLines = inputText
    .split("\n")
    .filter((line) => line.trim() !== "");
  const expectedOutputs = expectedOutputText
    .split("\n")
    .filter((line) => line.trim() !== "");

  if (testCaseLines.length !== expectedOutputs.length) {
    vscode.window.showErrorMessage(
      "Input and expected output have different number of test cases"
    );
    return;
  }

  let actualOutputs: string[] = [];
  try {
    if (language === "cpp") {
      const executablePath = await compileCpp(codePath, workspaceFolder);
      for (const line of testCaseLines) {
        const variables = parseTestCaseLine(line);
        const input = generateInputString(variables);
        try {
          const output = await execute(executablePath, input, "cpp");
          actualOutputs.push(output);
        } catch (error) {
          if (error instanceof Error) {
            vscode.window.showErrorMessage(error.message);
            actualOutputs.push("Execution Error");
          }
        }
      }
    } else if (language === "python") {
      for (const line of testCaseLines) {
        const variables = parseTestCaseLine(line);
        const input = generateInputString(variables);
        try {
          const output = await execute(codePath, input, "python");
          actualOutputs.push(output);
        } catch (error) {
          if (error instanceof Error) {
            vscode.window.showErrorMessage(error.message);
            actualOutputs.push("Execution Error");
          }
        }
      }
    }

    fs.writeFileSync(outputFile, actualOutputs.join("\n"));

    const results = [];
    for (let i = 0; i < actualOutputs.length; i++) {
      const actual = actualOutputs[i];
      const expected = expectedOutputs[i].trim();
      results.push({
        testCase: testCaseLines[i],
        actual,
        expected,
        passed: actual === expected,
      });
    }

    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    vscode.window.showInformationMessage(
      `Passed ${passedCount}/${totalCount} test cases.`
    );

    // Display detailed results in webview
    const panel = vscode.window.createWebviewPanel(
      "testResults",
      "Test Results",
      vscode.ViewColumn.Beside,
      {}
    );

    panel.webview.html = getWebviewContent(results);
  } catch (error) {
    if (error instanceof Error) {
      vscode.window.showErrorMessage(error.message);
    }
  }
}

function getWebviewContent(results: any[]): string {
  const rows = results
    .map(
      (result, index) => `
        <tr>
            <td>Test Case ${index + 1}</td>
            <td>${result.passed ? "✅ Passed" : "❌ Failed"}</td>
            <td><pre>${result.actual}</pre></td>
            <td><pre>${result.expected}</pre></td>
        </tr>
    `
    )
    .join("");

  return `
        <html>
        <head>
            <style>
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                pre { margin: 0; }
            </style>
        </head>
        <body>
            <h2>Test Results</h2>
            <table>
                <tr>
                    <th>Test Case</th>
                    <th>Status</th>
                    <th>Actual Output</th>
                    <th>Expected Output</th>
                </tr>
                ${rows}
            </table>
        </body>
        </html>
    `;
}