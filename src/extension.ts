import * as vscode from "vscode";
import { fetchTestCases } from "./fetchTestCases";
import { runTestCasesCommand } from "./runTestCases";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "cph-for-leetcode" is now active!'
  );

  const disposable = vscode.commands.registerCommand(
    "cph.FetchTestCases",
    fetchTestCases
  );

  const disposable2 = vscode.commands.registerCommand(
    "cph.RunTestCases",
    runTestCasesCommand
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(disposable2);
}

// This method is called when your extension is deactivated
export function deactivate() {}