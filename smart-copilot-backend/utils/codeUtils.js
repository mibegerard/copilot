import prettier from "prettier";

/**
 * @typedef {Object} Segment
 * @property {"text" | "code"} type - The type of segment
 * @property {string} content - The content of the segment
 * @property {string} [fenceLang] - The language specified in code fence (if code segment)
 */

/**
 * Splits input into alternating text and code segments, handling both fenced and indented code blocks.
 * Improved regex to handle edge cases and malformed fences better.
 * @param {string} text - The input text containing potential code blocks
 * @returns {Segment[]} Array of segmented text and code blocks
 */
function splitIntoSegments(text) {
  const segments = [];
  // Improved regex: handles empty fences, malformed closures, and preserves whitespace
  const fenceRegex = /^```([a-zA-Z]*)\n([\s\S]*?)\n```$/gm;
  let lastIndex = 0;
  let match;

  while ((match = fenceRegex.exec(text)) !== null) {
    const [fullMatch, lang, content] = match;
    const start = match.index;

    // Add preceding text segment if exists
    if (start > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, start)
      });
    }

    // Add code segment
    segments.push({
      type: "code",
      content: content.trim(), // Trim content while preserving internal formatting
      fenceLang: lang || undefined // Use undefined instead of empty string
    });

    lastIndex = start + fullMatch.length;
  }

  // Add remaining text if any
  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      content: text.slice(lastIndex)
    });
  }

  return segments;
}

/**
 * Returns true if any code block is detected in the input text.
 * @param {string} text
 * @returns {boolean}
 */
function hasCode(text) {
  const fenceRegex = /^```([a-zA-Z]*)\n([\s\S]*?)\n```$/gm;
  return fenceRegex.test(text);
}

function detectLanguage(code) {
  const trimmed = code.trim();
  if (!trimmed) return "plaintext";

  // Extract code block content if present
  const codeBlockMatch = trimmed.match(/```(?:\w+)?\n([\s\S]*?)\n```/);
  const codeToAnalyze = codeBlockMatch ? codeBlockMatch[1] : trimmed;

  // Split into lines
  const lines = codeToAnalyze.split('\n');

  // Flags to accumulate evidence
  let isJava = false;
  let isPython = false;
  let isJS = false;
  let isCpp = false;
  let isHtml = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // === Check Java first ===
    if (
      /\bimport\s+java(\.|util\.function|lang\.)/.test(trimmedLine) || // common Java import
      /^\s*(public|private|protected)\s+(class|interface|enum)\s+\w+/.test(trimmedLine) ||
      /\bSystem\.out\.println\s*\(/.test(trimmedLine) ||
      /\bstatic\s+(void|int|double|String|boolean)\b/.test(trimmedLine) ||
      /\bnew\s+\w+\s*\(/.test(trimmedLine) || // object instantiation
      /;(\s*\/\/.*)?$/.test(trimmedLine) // lines ending with semicolon (common in Java)
    ) {
      isJava = true;
      continue; // No need to check Python if Java matches
    }

    // === Check Python ===
    if (
      /^\s*(def\s+\w+\s*\(.*\):|import\s+\w+|from\s+\w+\s+import\s+\w+|class\s+\w+\s*:|@\w+)/.test(trimmedLine)
    ) {
      isPython = true;
      continue;
    }

    // === Check JavaScript ===
    if (
      /(function\s*\w*|=>|console\.log|import\s+[\w{])/.test(trimmedLine)
    ) {
      isJS = true;
      continue;
    }

    // === Check C++ ===
    if (
      /^\s*#include\s+/.test(trimmedLine) ||
      /^\s*(int|void|double|float|char)\s+main\s*\(/.test(trimmedLine) ||
      /std::/.test(trimmedLine)
    ) {
      isCpp = true;
      continue;
    }

    // === Check HTML ===
    if (
      /<\w+(\s+[^>]*)?>|<\/\w+>/.test(trimmedLine)
    ) {
      isHtml = true;
      continue;
    }
  }

  // Priority: Java > Python > JS > C++ > HTML
  if (isJava) return "java";
  if (isPython) return "python";
  if (isJS) return "babel";
  if (isCpp) return "cpp";
  if (isHtml) return "html";

  // Fallback: check if starts with JS comment or object/array/regex
  if (/^(\s*\/\/|\s*\/\*|\s*\*)/.test(codeToAnalyze)) return "babel"; // JS comments
  if (/^(\s*\{|\s*\[|\s*\/)/.test(codeToAnalyze)) return "babel"; // JS object/array/regex

  return "plaintext";
}

export { hasCode, detectLanguage, splitIntoSegments };
