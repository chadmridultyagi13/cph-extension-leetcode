import axios from "axios";

const graphqlEndpoint = "https://leetcode.com/graphql";

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
    const problemName = extractProblemName(url);
    try {
      const response = await axios.post(graphqlEndpoint, {
        query,
        variables: { titleSlug: problemName },
      });
      const content = response.data.data.question.content;
      const snippet: snippet[] =
        response.data.data.question.codeSnippets.filter(
          (snippet: snippet) =>
            snippet.lang === "C++" || snippet.lang === "Python"
        );

      const testCases = extractTestCases(content);
      return [testCases, snippet];
    } catch (error) {
      console.error(error);
    }
  } catch (error) {
    console.error(error);
  }
}

export function extractProblemName(url: string): string {
  const match = url.match(/https:\/\/leetcode\.com\/problems\/([^\/]+)\//);
  if (match && match[1]) {
    return match[1];
  }
  throw new Error("Invalid LeetCode URL format");
}

export const extractTestCases = (content: string): TestCase[] => {
  const preRegex = /<pre>\s*([\s\S]*?)\s*<\/pre>/g;
  const inputOutputRegex =
    /<strong>Input:<\/strong>\s*([\s\S]*?)\s*<strong>Output:<\/strong>\s*([\s\S]*?)(?=\s*(?:<strong>|$))/g;

  const testCases: TestCase[] = [];
  let preMatch: RegExpExecArray | null;

  while ((preMatch = preRegex.exec(content)) !== null) {
    const preContent: string = preMatch[1];
    let ioMatch: RegExpExecArray | null;

    while ((ioMatch = inputOutputRegex.exec(preContent)) !== null) {
      let input: string = ioMatch[1].trim();
      const output: string = ioMatch[2].trim();

      // Decode HTML entities and process input string
      input = processInput(decodeHTMLEntities(input));

      testCases.push({ input, output });
    }
  }

  return testCases;
};

function processInput(input: string): string {
  // Split the input by comma and process each part
  const parts = input.split(",").map((part) => part.trim());

  // Initialize array to store processed values
  const processedValues: string[] = [];

  for (let part of parts) {
    // If this part is an array (contains '[' and ']')
    if (part.includes("[") && part.includes("]")) {
      processedValues.push(part.trim());
    } else {
      // For non-array values, just add the value
      processedValues.push(part.trim());
    }
  }

  // Join all values with a space
  return processedValues.join(" ");
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

  return text.replace(/&[a-z]+;/g, (entity) => entities[entity] || entity);
}
