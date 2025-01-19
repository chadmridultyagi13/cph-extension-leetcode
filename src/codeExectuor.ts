import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class CodeExecutor {
  constructor(private workspaceRoot: string) {}

  private async compileCpp(filePath: string): Promise<void> {
    const outputPath = path.join(path.dirname(filePath), "solution.exe");
    const compileCommand = `g++ "${filePath}" -o "${outputPath}"`;

    try {
      await execAsync(compileCommand);
    } catch (error: any) {
      // Show compilation error in terminal
      const terminal = vscode.window.createTerminal("Compilation Error");
      terminal.show();
      terminal.sendText(`Compilation Error: ${error.stderr}`);
      throw new Error("Compilation failed");
    }
  }

  private async generateRunner(
    language: string,
    filePath: string,
    inputPath: string
  ): Promise<string> {
    const dir = path.dirname(filePath);
    const runnerPath = path.join(
      dir,
      "runner." + (language === "Python" ? "py" : "cpp")
    );
    const sourceCode = fs.readFileSync(filePath, "utf8");
    const inputs = fs.readFileSync(inputPath, "utf8").trim().split("\n");

    if (language === "Python") {
      const runnerCode = `
import sys
from typing import List

${sourceCode}

def parse_input(line):
    parts = line.strip().split(']')
    arr_str = parts[0].strip('[') + ']'
    target = int(parts[1].strip())
    arr = eval(arr_str)
    return arr, target

def main():
    solution = Solution()
    with open('${path.join(dir, "output.txt")}', 'w') as f:
        for line in sys.stdin:
            if not line.strip():
                continue
            arr, target = parse_input(line)
            result = solution.twoSum(arr, target)
            f.write(str(result) + '\\n')

if __name__ == '__main__':
    main()
`;
      fs.writeFileSync(runnerPath, runnerCode);
    } else {
      const runnerCode = `
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <sstream>
${sourceCode}

std::vector<int> parseArray(const std::string& str) {
    std::vector<int> result;
    std::string cleaned = str.substr(1, str.find(']') - 1); // Remove brackets
    std::stringstream ss(cleaned);
    int num;
    while (ss >> num) {
        result.push_back(num);
    }
    return result;
}

int main() {
    Solution solution;
    std::ofstream outFile("${path.join(dir, "output.txt")}");
    std::string line;
    
    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;
        
        size_t bracketEnd = line.find(']');
        std::string arrStr = line.substr(0, bracketEnd + 1);
        int target;
        std::stringstream(line.substr(bracketEnd + 1)) >> target;
        
        std::vector<int> nums = parseArray(arrStr);
        std::vector<int> result = solution.twoSum(nums, target);
        
        outFile << "[";
        for (size_t i = 0; i < result.size(); ++i) {
            if (i > 0) outFile << ", ";
            outFile << result[i];
        }
        outFile << "]" << std::endl;
    }
    return 0;
}
`;
      fs.writeFileSync(runnerPath, runnerCode);
    }
    return runnerPath;
  }

  public async executeCode(filePath: string, language: string): Promise<void> {
    try {
      const dir = path.dirname(filePath);
      const inputPath = path.join(dir, "test_cases", "input.txt");
      const outputPath = path.join(dir, "test_cases", "output.txt");

      // Generate runner code that handles input/output
      const runnerPath = await this.generateRunner(
        language,
        filePath,
        inputPath
      );

      if (language === "cpp") {
        // Compile the runner
        await this.compileCpp(runnerPath);
        const execPath = path.join(dir, "solution.exe");

        try {
          const { stderr } = await execAsync(`"${execPath}" < "${inputPath}"`);
          if (stderr) {
            throw new Error(stderr);
          }
        } catch (error: any) {
          const terminal = vscode.window.createTerminal("Runtime Error");
          terminal.show();
          terminal.sendText(`Runtime Error: ${error.message}`);
          throw error;
        }
      } else {
        // Execute Python code
        try {
          const { stderr } = await execAsync(
            `python "${runnerPath}" < "${inputPath}"`
          );
          if (stderr) {
            throw new Error(stderr);
          }
        } catch (error: any) {
          const terminal = vscode.window.createTerminal("Runtime Error");
          terminal.show();
          terminal.sendText(`Runtime Error: ${error.message}`);
          throw error;
        }
      }
    } catch (error) {
      throw error;
    }
  }
}

