export const formatCodeResponse = (response, dbResults) => {
  const language = detectCodeLanguage(dbResults);
  if (!language) return response;

  // Convert code blocks to markdown format
  return response.replace(
    /(```)?(\s*\b\w+\b[\s\S]*?\n\s*\w+.*)/g,
    (match, hasBackticks, code) => {
      return hasBackticks ? match : `\`\`\`${language}\n${code.trim()}\n\`\`\``;
    }
  );
};

export const detectCodeLanguage = (dbResults) => {
  if (!dbResults.length) return null;
  const content = dbResults[0].content || '';
  
  if (content.includes('def ') && content.includes('import ')) return 'python';
  if (content.includes('function ') || content.includes('const ') || content.includes('let ')) return 'javascript';
  if (content.includes('<?php')) return 'php';
  if (content.includes('<html>') || content.includes('<div>')) return 'html';
  if (content.includes('SELECT ') || content.includes('FROM ')) return 'sql';
  return null;
};

export const checkIfContainsCode = (text) => {
  return /(def |function |class |import |SELECT |<[a-z]+>)/i.test(text);
};