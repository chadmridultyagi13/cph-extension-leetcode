import * as vscode from "vscode";
import {
  extractProblemName,
  testCaseandCodeSnippetFromUrl,
} from "./leetCodeScraper";
import { saveTestCases, createProblemFile } from "./fileHandler";
import { setupLayout } from "./layoutManager";

export async function fetchTestCases() {
  try {
    const questionLink = await vscode.window.showInputBox({
      placeHolder: "https://leetcode.com/problems/two-sum",
      prompt: "Please enter the LeetCode problem URL.",
    });
    if (questionLink === "" || questionLink === undefined) {
      vscode.window.showErrorMessage("No URL entered. Please try again.");
      return;
    }

    const validUrl = isValidLeetCodeUrl(questionLink);
    if (!validUrl) {
      vscode.window.showErrorMessage("Invalid LeetCode URL. Please try again.");
      return;
    }

    const fetchingMessage = vscode.window.setStatusBarMessage(
      `Fetching test cases and arranging the view`
    );
    const testCaseandCodeSnippet = await testCaseandCodeSnippetFromUrl(
      questionLink
    );

    if (testCaseandCodeSnippet && Array.isArray(testCaseandCodeSnippet)) {
      await saveTestCases(testCaseandCodeSnippet[0]);
      fetchingMessage.dispose();

      const language = await askUserForLanguage();
      if (!language) {
        return;
      }

      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage("No workspace folder found.");
        return;
      }
      const workspacePath = workspaceFolder.uri.fsPath;

      const problemName = extractProblemName(questionLink);
      const mainFilePath = await createProblemFile(
        problemName,
        language,
        workspacePath,
        testCaseandCodeSnippet[1]
      );

      await setupLayout(mainFilePath);
    } else {
      vscode.window.showErrorMessage("No test cases found.");
      fetchingMessage.dispose();
    }
  } catch (error) {
    vscode.window.showErrorMessage(`An error occurred: ${error}`);
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
  const language = await vscode.window.showQuickPick(["C++", "Python"], {
    placeHolder: "Select your preferred programming language",
  });

  if (!language) {
    vscode.window.showErrorMessage("No language selected. Please try again.");
    return;
  }

  vscode.window.showInformationMessage(`You selected ${language}`);
  return language;
}
