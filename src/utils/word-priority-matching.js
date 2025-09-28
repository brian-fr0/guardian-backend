const { CRIME_WORD_PRIORITIES } = require("../constants/crime-priorities");

/**
 * @param {string} lookingForWord
 * @param {string} word
 * @returns {number}
 */
function levenshteinDistance(lookingForWord, word) {
  const matrix = Array(word.length + 1)
    .fill(null)
    .map(() => Array(lookingForWord.length + 1).fill(null));

  for (let i = 0; i <= lookingForWord.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= word.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= word.length; j++) {
    for (let i = 1; i <= lookingForWord.length; i++) {
      const cost = lookingForWord[i - 1] === word[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost,
      );
    }
  }

  return matrix[word.length][lookingForWord.length];
}

/**
 * @param {string} lookingForWord
 * @param {string} word
 * @returns {number}
 */
function stringMatchPercentage(lookingForWord, word) {
  lookingForWord = lookingForWord.toLowerCase();
  word = word.toLowerCase();

  const distance = levenshteinDistance(lookingForWord, word);
  const maxLength = Math.max(lookingForWord.length, word.length);

  const similarity = Math.max(0, (maxLength - distance) / maxLength);
  return Math.round(similarity * 100) / 100;
}

/**
 * @param {string} lookingForWord
 * @param {string} word
 * @returns {number}
 */
function getWordPriority(lookingForWord, word) {
  lookingForWord = lookingForWord.toLowerCase();
  word = word.toLowerCase();

  const percentage = stringMatchPercentage(lookingForWord, word);
  return Math.floor(CRIME_WORD_PRIORITIES[lookingForWord] * percentage);
}

/**
 * @param {string} string
 * @returns {string}
 */
function removeSpeicalCharactersFromString(string) {
  const replaceRegex = /[,\.?!@£$%^&*()-=_+[\]{};:'"\\|,<>/]/gim;
  return string.replaceAll(replaceRegex, " ");
}

/**
 * @param {string} description
 * @returns {number}
 */
function calculateReportPriorityFromDescription(description) {
  const wordCache = {};
  const keywords = Object.keys(CRIME_WORD_PRIORITIES);
  const MIN_SIMILARITY = 0.5;

  let priority = 0;

  description = removeSpeicalCharactersFromString(description);

  for (const word of description.split(" ")) {
    if (wordCache[word.toLowerCase()]) {
      continue;
    }

    let highestMatchedKeyword = null;
    let highestMatchPercentage = 0;

    for (const keyword of keywords) {
      const keywordMatchPercentage = stringMatchPercentage(keyword, word);

      if (keywordMatchPercentage > highestMatchPercentage) {
        highestMatchedKeyword = keyword;
        highestMatchPercentage = keywordMatchPercentage;
      }
    }

    if (
      highestMatchedKeyword !== null &&
      highestMatchPercentage >= MIN_SIMILARITY
    ) {
      priority += getWordPriority(highestMatchedKeyword, word);
    }
    wordCache[word.toLowerCase()] = true;
  }

  return priority;
}

module.exports = {
  stringMatchPercentage,
  getWordPriority,
  calculateReportPriorityFromDescription,
};
