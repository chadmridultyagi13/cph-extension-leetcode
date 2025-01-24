import * as vscode from "vscode";
import { TestCasesPanel } from "./webView";

export async function setupLayout(mainFilePath: string) {
  try {
    const document = await vscode.workspace.openTextDocument(mainFilePath);
    await vscode.window.showTextDocument(document, vscode.ViewColumn.One);

    const panel = TestCasesPanel.createOrShow();
    await panel.updateContent();

    return true;
  } catch (error) {
    vscode.window.showErrorMessage(`Error setting up layout: ${error}`);
    return false;
  }
}