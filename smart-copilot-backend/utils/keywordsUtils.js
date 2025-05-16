const COMMON_WORDS = new Set([
  // English
  "please", "can", "you", "the", "for", "and", "to", "a", "in", "is", "of",
  "how", "what", "why", "with", "this", "that", "it", "on", "at", "by", "an",
  "be", "or", "as", "if", "are", "was", "we", "do", "does", "did", "not", "but",
  "so", "such", "these", "those", "from", "has", "have", "had", "will", "would",
  "should", "could", "shall", "may", "might", "must", "about", "which", "who",
  "whom", "whose", "where", "when", "then", "there", "here", "also",
  // French
  "s'il vous plaît", "peut", "vous", "le", "pour", "et", "à", "un", "dans", "est",
  "de", "comment", "quoi", "pourquoi", "avec", "ce", "que", "il", "sur", "par",
  "être", "ou", "comme", "si", "sont", "était", "nous", "faire", "faites", "fait",
  "pas", "mais", "donc", "tel", "ces", "ceux", "a", "avons", "avait", "sera",
  "serait", "devrait", "pourrait", "doit", "peut-être", "à propos", "lequel",
  "qui", "dont", "où", "quand", "alors", "là", "ici", "aussi"
]);

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function removeCommonWords(text) {
  // Remove punctuation
  let cleanedText = text.replace(/[.,!?;:()\[\]{}"']/g, '').toLowerCase();

  // Replace multi-word phrases first
  // Only phrases (with space) need regex replace, single words can be filtered later
  const phrases = Array.from(COMMON_WORDS).filter(w => w.includes(' '));
  for (const phrase of phrases) {
    const regex = new RegExp(`\\b${escapeRegex(phrase.toLowerCase())}\\b`, 'gi');
    cleanedText = cleanedText.replace(regex, '');
  }

  // Remove leftover single words
  return cleanedText
    .split(/\s+/)
    .filter(word => word && !COMMON_WORDS.has(word.toLowerCase()))
    .join(' ');
}

// Directory translation logic
const directoryPairs = [
  ["DISBURSEMENT", "DÉCAISSEMENT"],
  ["INTEREST", "INTÉRÊT"],
  ["MANAGEMENT FEES", "FRAIS DE GESTION"],
  ["SIMULATION", "SIMULATION"],
  ["NEW CLAIM", "NOUVELLE RÉCLAMATION"],
  ["INITIALISE SMART CONTRACT", "INITIALISER SMART CONTRAT"],
  ["PARAMETER UPDATE STATUS_CODE", "MISE À JOUR DES PARAMÈTRES CODE STATUT"],
  ["DIRECT_DEBIT", "PRÉLÈVEMENT AUTOMATIQUE"],
  ["INTEREST PAYMENT SCHEDULE", "CALENDRIER DE PAIEMENT DES INTÉRÊTS"]
];

const translated_directories = Object.fromEntries(directoryPairs);
const frenchToEnglish = Object.fromEntries(directoryPairs.map(([en, fr]) => [fr.toUpperCase(), en]));

export function translateDirectories(inputText) {
  let output = inputText;

  const frenchTerms = Object.keys(frenchToEnglish).sort((a, b) => b.length - a.length);

  for (const french of frenchTerms) {
    const regex = new RegExp(escapeRegex(french), 'gi');
    output = output.replace(regex, frenchToEnglish[french]);
  }

  output = removeCommonWords(output);
  return output;
}

const directories = directoryPairs.map(([en]) => en.toLowerCase().replace(/_/g, ' '));

// Sort by length descending so longer multi-word dirs win
const sortedDirs = directories.slice().sort((a, b) => b.length - a.length);

const fileSuffixes = new Set([
  "pre posting",
  "test",
  "code",
  "schedule",
  "fees test",
  "post posting",
  "schedule code",
  "derived parameters"
]);

export function classifyText(originaltext) {
  const text = translateDirectories(originaltext);
  const normalized = text.toLowerCase();

  // 1. File: look for ANYWHERE “<directory> <suffix>”
  for (const dir of sortedDirs) {
    for (const suffix of fileSuffixes) {
      const phrase = `${dir} ${suffix}`;
      if (normalized.includes(phrase)) {
        return { type: "File", value: phrase };
      }
    }
  }

  // 2. Directory: substring match
  for (const dir of sortedDirs) {
    if (normalized.includes(dir)) {
      return { type: "Directory", value: dir };
    }
  }

  // 3. Tag
  return { type: "Tag", value: text };
}
