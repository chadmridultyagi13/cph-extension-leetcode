import * as vscode from "vscode";
import { fetchTestCases } from "./app/fetch";
import { runTestCasesCommand } from "./app/testRun";
import { TestCasesPanel } from "./UI";

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

  // Extra command
  const disposable3 = vscode.commands.registerCommand(
    "cph.revealTestCasesPanel",
    () => {
      TestCasesPanel.reveal();
    }
  );
  context.subscriptions.push(disposable3);
  context.subscriptions.push(disposable);
  context.subscriptions.push(disposable2);
}

// This method is called when your extension is deactivated
export function deactivate() {}