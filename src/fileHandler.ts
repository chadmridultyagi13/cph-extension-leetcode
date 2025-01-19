import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { snippet } from "./leetCodeScraper";

export async function saveTestCases(
  testCases: { input: string; output: string }[]
) {
  try {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage("No workspace folder found.");
      return;
    }

    const folderPath = path.join(workspaceFolder.uri.fsPath, "test_cases");

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    const inputFilePath = path.join(folderPath, "input.txt");
    const outputFilePath = path.join(folderPath, "expected_output.txt");
    const outputPath = path.join(folderPath, "output.txt");

    const inputData = testCases.map((testCase) => testCase.input).join("\n");
    const outputData = testCases.map((testCase) => testCase.output).join("\n");

    fs.writeFileSync(inputFilePath, inputData, "utf-8");
    fs.writeFileSync(outputFilePath, outputData, "utf-8");
    fs.writeFileSync(outputPath, "", "utf-8");

    vscode.window.showInformationMessage("Test cases saved successfully!");
  } catch (error) {
    vscode.window.showErrorMessage(
      `An error occurred while saving files: ${error}`
    );
  }
}

export async function createProblemFile(
  problemName: string,
  language: string,
  workspacePath: string,
  snippet: snippet[]
) {
  const fileName = `${problemName}.${language === "C++" ? "cpp" : "py"}`;
  const langSnippet = `${
    language === "C++" ? snippet[0].code : snippet[1].code
  }`;
  const filePath = path.join(workspacePath, fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, langSnippet, "utf-8");
  }

  return filePath;
}
