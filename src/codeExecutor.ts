import * as vscode from "vscode";
import { spawn } from "child_process";
import * as os from "os";
import * as path from "path";

export async function compileCpp(
  codePath: string,
  workspaceFolder: string
): Promise<string> {
  const compiler = "g++";
  const outputExe = path.join(workspaceFolder, "problem_executable");
  const args = [codePath, "-o", outputExe, "-std=c++17"];

  return new Promise((resolve, reject) => {
    const process = spawn(compiler, args);

    let stderr = "";
    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve(outputExe);
      } else {
        reject(new Error(`Compilation failed: ${stderr}`));
      }
    });
  });
}

export async function execute(
  executablePath: string,
  input: string,
  language: "cpp" | "python"
): Promise<string> {
  return new Promise((resolve, reject) => {
    let process;
    const isWindows = os.platform() === "win32";
    const pythonCommand = isWindows ? "python" : "python3";

    if (language === "cpp") {
      process = spawn(executablePath, [], { stdio: "pipe" });
    } else if (language === "python") {
      process = spawn(pythonCommand, [executablePath], {
        stdio: "pipe",
      });
    } else {
      reject(new Error("Unsupported language"));
      return;
    }

    let stdout = "";
    let stderr = "";
    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.stdin.write(input);
    process.stdin.end();

    process.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Execution error: ${stderr}`));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

export function parseTestCaseLine(
  line: string
): Array<{ key: string; value: any }> {
  const regex = /(\w+)\s*=\s*((?:\[.*?\]|[^=\s])+)/g;
  const variables: Array<{ key: string; value: any }> = [];
  let match;

  while ((match = regex.exec(line)) !== null) {
    const key = match[1];
    let valueStr = match[2].trim();

    if (valueStr.startsWith("[") && valueStr.endsWith("]")) {
      valueStr = valueStr.slice(1, -1).trim();
      const elements = valueStr.split(/\s+/).map((e) => {
        const num = Number(e);
        return isNaN(num) ? e : num;
      });
      variables.push({ key, value: elements });
    } else {
      const num = Number(valueStr);
      variables.push({ key, value: isNaN(num) ? valueStr : num });
    }
  }

  return variables;
}

export function generateInputString(
  variables: Array<{ key: string; value: any }>
): string {
  return (
    variables
      .map((v) => {
        if (Array.isArray(v.value)) {
          return v.value.join(" ");
        } else {
          return v.value.toString();
        }
      })
      .join("\n") + "\n"
  );
}