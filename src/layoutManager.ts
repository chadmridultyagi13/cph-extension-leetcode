import * as vscode from "vscode";
import { WebViewProvider } from "./webView";

export async function setupLayout(mainFilePath: string) {
  try {
    const document = await vscode.workspace.openTextDocument(mainFilePath);
    await vscode.window.showTextDocument(document, vscode.ViewColumn.One);

    const panel = WebViewProvider.createOrShow();
    await panel.updateContent();

    return true;
  } catch (error) {
    vscode.window.showErrorMessage(`Error setting up layout: ${error}`);
    return false;
  }
}
