const natural = require('natural');
const { removeStopwords } = require('stopword');

// Preprocessing function: prepares user input for NLP
function preprocessText(input) {
  // Lowercase conversion
  let processed = input.toLowerCase();

  // Remove punctuation
  processed = processed.replace(/[^\w\s]/gi, '');

  // Tokenization
  const tokenizer = new natural.WordTokenizer();
  let tokens = tokenizer.tokenize(processed);

  // Remove stop words
  tokens = removeStopwords(tokens);

  // Stemming: convert words to their base form
  const stemmedTokens = tokens.map(token => natural.PorterStemmer.stem(token));

  return stemmedTokens;
}

// Validation helper: ensure meaningful input
function validatePreprocessedData(preprocessedData) {
  if (preprocessedData.length === 0) {
    throw new Error("Input data is too short after preprocessing.");
  }
  // Additional validation checks can be added here
  return true;
}

// Example usage
if (require.main === module) {
  const userInput = "I worked on advanced machine learning and data analytics.";
  const tokens = preprocessText(userInput);
  console.log(tokens); // Expected Output: [ 'work', 'advanc', 'machin', 'learn', 'data', 'analyt' ]
}

module.exports = {
  preprocessText,
  validatePreprocessedData
};
