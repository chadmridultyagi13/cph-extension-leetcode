import * as vscode from "vscode";
import {
  extractProblemName,
  testCaseandCodeSnippetFromUrl,
} from "./leetCodeScraper";
import { saveTestCases, createProblemFile } from "./fileHandler";
import { setupLayout } from "./layoutManager";

export async function fetchTestCases() {
  try {
    const link = await vscode.window.showInputBox({
      placeHolder: "https://leetcode.com/problems/two-sum",
      prompt: "Enter LeetCode problem URL.",
    });
    if (!link) {
      vscode.window.showErrorMessage("No URL entered. Try again.");
      return;
    }

    if (!isValidLeetCodeUrl(link)) {
      vscode.window.showErrorMessage("Invalid URL. Try again.");
      return;
    }

    const msg = vscode.window.setStatusBarMessage(`Fetching test cases...`);
    const data = await testCaseandCodeSnippetFromUrl(link);

    if (data && Array.isArray(data)) {
      await saveTestCases(data[0]);
      msg.dispose();

      const lang = await askUserForLanguage();
      if (!lang) return;

      const workspace = vscode.workspace.workspaceFolders?.[0];
      if (!workspace) {
        vscode.window.showErrorMessage("No workspace found.");
        return;
      }
      const path = workspace.uri.fsPath;

      const problem = extractProblemName(link);
      const filePath = await createProblemFile(problem, lang, path);

      await setupLayout(filePath);
    } else {
      vscode.window.showErrorMessage("No test cases found.");
      msg.dispose();
    }
  } catch (err) {
    vscode.window.showErrorMessage(`Error: ${err}`);
  }
}

function isValidLeetCodeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "leetcode.com" &&
      parsed.pathname.startsWith("/problems/")
    );
  } catch {
    return false;
  }
}

async function askUserForLanguage() {
  const lang = await vscode.window.showQuickPick(["C++", "Python"], {
    placeHolder: "Select language",
  });

  if (!lang) {
    vscode.window.showErrorMessage("No language selected. Try again.");
    return;
  }

  vscode.window.showInformationMessage(`Selected: ${lang}`);
  return lang;
}