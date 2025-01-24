import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import {
  compileCpp,
  execute,
  parseTestCaseLine,
  generateInputString,
} from "./executor";

export async function runTestCasesCommand(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor");
    return;
  }

  const codePath = editor.document.uri.fsPath;
  const lang = codePath.endsWith(".cpp")
    ? "cpp"
    : codePath.endsWith(".py")
    ? "python"
    : null;
  if (!lang) {
    vscode.window.showErrorMessage("Unsupported file type");
    return;
  }

  const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspace) {
    vscode.window.showErrorMessage("No workspace folder open");
    return;
  }

  const testCasesDir = path.join(workspace, "test_cases");
  const inputFile = path.join(testCasesDir, "input.txt");
  const expectedOutputFile = path.join(testCasesDir, "expected_output.txt");
  const outputFile = path.join(testCasesDir, "output.txt");

  if (!fs.existsSync(inputFile) || !fs.existsSync(expectedOutputFile)) {
    vscode.window.showErrorMessage("Test cases not found. Fetch them first.");
    return;
  }

  const inputText = fs.readFileSync(inputFile, "utf-8");
  const expectedOutputText = fs.readFileSync(expectedOutputFile, "utf-8");

  const testCases = inputText.split("\n").filter((line) => line.trim() !== "");
  const expectedOutputs = expectedOutputText
    .split("\n")
    .filter((line) => line.trim() !== "");

  let actualOutputs: string[] = [];
  try {
    if (lang === "cpp") {
      const execPath = await compileCpp(codePath, workspace);
      for (const line of testCases) {
        const vars = parseTestCaseLine(line);
        const input = generateInputString(vars);
        try {
          const output = await execute(execPath, input, "cpp");
          actualOutputs.push(output);
        } catch (err) {
          if (err instanceof Error) {
            vscode.window.showErrorMessage(err.message);
            actualOutputs.push("Execution Error");
          }
        }
      }
    } else if (lang === "python") {
      for (const line of testCases) {
        const vars = parseTestCaseLine(line);
        const input = generateInputString(vars);
        try {
          const output = await execute(codePath, input, "python");
          actualOutputs.push(output);
        } catch (err) {
          if (err instanceof Error) {
            vscode.window.showErrorMessage(err.message);
            actualOutputs.push("Execution Error");
          }
        }
      }
    }

    fs.writeFileSync(outputFile, actualOutputs.join("\n"));

    const results = [];
    for (let i = 0; i < actualOutputs.length; i++) {
      const actual = actualOutputs[i];
      const expected =
        i < expectedOutputs.length ? expectedOutputs[i].trim() : "N/A";
      const passed = i < expectedOutputs.length ? actual === expected : null;

      results.push({
        testCase: testCases[i],
        actual,
        expected,
        passed,
      });
    }

    const originalTestCasesCount = expectedOutputs.length;
    const passed = results
      .slice(0, originalTestCasesCount)
      .filter((r) => r.passed).length;
    const totalRun = actualOutputs.length;

    vscode.window.showInformationMessage(
      `Passed ${passed}/${originalTestCasesCount} official test cases. Run ${totalRun} total cases.`
    );

    const panel = vscode.window.createWebviewPanel(
      "testResults",
      "Test Results",
      vscode.ViewColumn.Beside,
      {}
    );
    panel.webview.html = getWebviewContent(results);
  } catch (err) {
    if (err instanceof Error) {
      vscode.window.showErrorMessage(err.message);
    }
  }
}

function getWebviewContent(results: any[]): string {
  const rows = results
    .map(
      (result, index) => `
        <tr>
            <td>Test Case ${index + 1}</td>
            <td>${
              result.passed === null
                ? "🔵 Custom"
                : result.passed
                ? "✅ Passed"
                : "❌ Failed"
            }</td>
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
                .custom { color: #666; }
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
            ${
              results.some((r) => r.passed === null)
                ? '<p style="color: #666; margin-top: 15px;">🔵 Custom test cases - No expected output provided</p>'
                : ""
            }
        </body>
        </html>
    `;
}