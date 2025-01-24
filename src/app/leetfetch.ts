import axios from "axios";

const graphqlUrl = "https://leetcode.com/graphql";

const query = `
query getQuestionDetail($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    content codeSnippets {
     lang code
    }
  }
}
`;

interface TestCase {
  input: string;
  output: string;
}
export interface snippet {
  lang: string;
  code: string;
}

export async function testCaseandCodeSnippetFromUrl(url: string): Promise<any> {
  try {
    const problem = extractProblemName(url);
    try {
      const res = await axios.post(graphqlUrl, {
        query,
        variables: { titleSlug: problem },
      });
      const content = res.data.data.question.content;
      const snippets: snippet[] = res.data.data.question.codeSnippets.filter(
        (s: snippet) => s.lang === "C++" || s.lang === "Python"
      );

      const testCases = extractTestCases(content);
      return [testCases, snippets];
    } catch (err) {
      console.error(err);
    }
  } catch (err) {
    console.error(err);
  }
}

export function extractProblemName(url: string): string {
  const match = url.match(
    /https:\/\/leetcode\.com\/problems\/([^\/]+)(?:\/|$|\/description\/)/
  );
  if (match && match[1]) {
    return match[1];
  }
  throw new Error("Invalid LeetCode URL");
}

export const extractTestCases = (content: string): TestCase[] => {
  const preRegex = /<pre>\s*([\s\S]*?)\s*<\/pre>/g;
  const ioRegex =
    /<strong>Input:<\/strong>\s*([\s\S]*?)\s*<strong>Output:<\/strong>\s*([\s\S]*?)(?=\s*(?:<strong>|$))/g;

  const testCases: TestCase[] = [];
  let preMatch: RegExpExecArray | null;

  while ((preMatch = preRegex.exec(content)) !== null) {
    const preContent: string = preMatch[1];
    let ioMatch: RegExpExecArray | null;

    while ((ioMatch = ioRegex.exec(preContent)) !== null) {
      let input: string = ioMatch[1].trim();
      const output: string = ioMatch[2].trim();

      input = processInput(decodeHTMLEntities(input));

      testCases.push({ input, output });
    }
  }

  return testCases;
};

function processInput(input: string): string {
  const parts = input.split(",").map((part) => part.trim());
  const values: string[] = [];

  for (let part of parts) {
    if (part.includes("[") && part.includes("]")) {
      values.push(part.trim());
    } else {
      values.push(part.trim());
    }
  }

  return values.join(" ");
}

function decodeHTMLEntities(text: string): string {
  const entities: { [key: string]: string } = {
    "&quot;": '"',
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&nbsp;": " ",
    "&apos;": "'",
  };

  return text.replace(/&[a-z]+;/g, (e) => entities[e] || e);
}