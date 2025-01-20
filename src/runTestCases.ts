import vscode, { workspace } from "vscode";
import { CodeExecutor } from "./codeExectuor";
import { WebViewProvider } from './webView';
import path from "path";

const panel = vscode.window.createWebviewPanel(
  "testCases",
  "LeetCode Test Cases",
  vscode.ViewColumn.Two,
  {
    enableScripts: true,
    retainContextWhenHidden: true,
  }
);
const WebView = new WebViewProvider(panel);


export async function runTestCases() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor found!");
    return;
  }
  
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceFolder) {
    vscode.window.showErrorMessage("No workspace folder found!");
    return;
  }
  
  const filePath = editor.document.fileName;
  const language = filePath.endsWith(".py")
    ? "py"
    : filePath.endsWith(".cpp")
    ? "cpp"
    : null;
  if (!language) {
    vscode.window.showErrorMessage(
      "Unsupported language! Only Python and C++ are supported."
    );
    return;
  }
  
  const executeCode = new CodeExecutor(workspaceFolder);
  const problemName = path.basename(filePath, path.extname(filePath));
  const results = await executeCode.executeCode(filePath, language);
  WebView.displayResults(results);
}
