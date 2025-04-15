export const extractTechnicalKeywords = (text) => {
    if (!text) return [];

    // Enhanced tokenization with hyphen handling
    return text
        .split(/[\s\-_]+/) // Split on whitespace, hyphens, and underscores
        .map((w) => w.toLowerCase().replace(/[^\w\-]/g, '')) // Preserve hyphens
        .filter((w) => w.length > 2 && !isCommonWord(w));
};

// Expanded list of common words
const COMMON_WORDS = new Set([
    'please', 'can', 'you', 'the', 'for', 'and', 'to', 'a', 'in',
    'is', 'of', 'how', 'what', 'why', 'with', 'this', 'that', 'it'
]);

const isCommonWord = (word) => COMMON_WORDS.has(word);

export const generateKeywordCombinations = (keywords) => {
    if (keywords.length === 1) {
        return keywords; // If there's only one keyword, return it as is
    }

    const combinations = [];
    const maxCombinationLength = 6;

    // Generate combinations from longest to shortest
    for (let i = keywords.length - 1; i >= 0; i--) {
        let phrase = keywords[i];
        combinations.push(phrase);

        for (let j = i - 1; j >= 0; j--) {
            phrase = `${keywords[j]} ${phrase}`;
            combinations.push(phrase);
        }
    }

    // Remove duplicates and return
    return [...new Set(combinations.map(c => c.toLowerCase().trim()))];
};