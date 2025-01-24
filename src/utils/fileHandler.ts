import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { snippet } from "../app/leetfetch";

export async function saveTestCases(
  testCases: { input: string; output: string }[]
) {
  try {
    const workspace = vscode.workspace.workspaceFolders?.[0];
    if (!workspace) {
      vscode.window.showErrorMessage("No workspace folder found.");
      return;
    }

    const folder = path.join(workspace.uri.fsPath, "test_cases");

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }

    const inputFile = path.join(folder, "input.txt");
    const outputFile = path.join(folder, "expected_output.txt");
    const outputPath = path.join(folder, "output.txt");

    const inputData = testCases.map((tc) => tc.input).join("\n");
    const outputData = testCases.map((tc) => tc.output).join("\n");

    fs.writeFileSync(inputFile, inputData, "utf-8");
    fs.writeFileSync(outputFile, outputData, "utf-8");
    fs.writeFileSync(outputPath, "", "utf-8");

    vscode.window.showInformationMessage("Test cases saved successfully!");
  } catch (err) {
    vscode.window.showErrorMessage(`Error saving files: ${err}`);
  }
}

export async function createProblemFile(
  problemName: string,
  lang: string,
  workspacePath: string
) {
  const file = `${problemName}.${lang === "C++" ? "cpp" : "py"}`;
  const filePath = path.join(workspacePath, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "", "utf-8");
  }

  return filePath;
}