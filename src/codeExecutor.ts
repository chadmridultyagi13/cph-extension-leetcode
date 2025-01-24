import * as vscode from "vscode";
import { spawn } from "child_process";
import * as os from "os";
import * as path from "path";

export async function compileCpp(
  codePath: string,
  workspace: string
): Promise<string> {
  const compiler = "g++";
  const outputExe = path.join(workspace, "problem_executable");
  const args = [codePath, "-o", outputExe, "-std=c++17"];

  return new Promise((resolve, reject) => {
    const proc = spawn(compiler, args);

    let err = "";
    proc.stderr.on("data", (data) => {
      err += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(outputExe);
      } else {
        reject(new Error(`Compilation failed: ${err}`));
      }
    });
  });
}

export async function execute(
  execPath: string,
  input: string,
  lang: "cpp" | "python"
): Promise<string> {
  return new Promise((resolve, reject) => {
    let proc;
    const isWin = os.platform() === "win32";
    const pyCmd = isWin ? "python" : "python3";

    if (lang === "cpp") {
      proc = spawn(execPath, [], { stdio: "pipe" });
    } else if (lang === "python") {
      proc = spawn(pyCmd, [execPath], { stdio: "pipe" });
    } else {
      reject(new Error("Unsupported language"));
      return;
    }

    let out = "";
    let err = "";
    proc.stdout.on("data", (data) => {
      out += data.toString();
    });
    proc.stderr.on("data", (data) => {
      err += data.toString();
    });

    proc.stdin.write(input);
    proc.stdin.end();

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Execution error: ${err}`));
      } else {
        resolve(out.trim());
      }
    });
  });
}

export function parseTestCaseLine(
  line: string
): Array<{ key: string; value: any }> {
  const regex = /(\w+)\s*=\s*((?:\[.*?\]|[^=\s])+)/g;
  const vars: Array<{ key: string; value: any }> = [];
  let match;

  while ((match = regex.exec(line)) !== null) {
    const key = match[1];
    let valStr = match[2].trim();

    if (valStr.startsWith("[") && valStr.endsWith("]")) {
      valStr = valStr.slice(1, -1).trim();
      const elems = valStr.split(/\s+/).map((e) => {
        const num = Number(e);
        return isNaN(num) ? e : num;
      });
      vars.push({ key, value: elems });
    } else {
      const num = Number(valStr);
      vars.push({ key, value: isNaN(num) ? valStr : num });
    }
  }

  return vars;
}

export function generateInputString(
  vars: Array<{ key: string; value: any }>
): string {
  return (
    vars
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