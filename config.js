// Game configuration
const CONFIG = {
  // Word limits (80 max due to Gemini API output token limits)
  MAX_WORDS: 80,
  MIN_WORDS: 4,

  // Quiz settings
  DEFAULT_QUESTIONS_PER_ROUND: 10,
  OPTIONS_PER_QUESTION: 4,

  // Spaced repetition weights
  WEIGHT_MIN: 0.1,
  WEIGHT_MAX: 10,
  WEIGHT_INITIAL: 1,
  WEIGHT_CORRECT_MULTIPLIER: 0.6,
  WEIGHT_CORRECT_WITH_HINT_MULTIPLIER: 0.85,
  WEIGHT_INCORRECT_MULTIPLIER: 2,
  WEIGHT_MASTERED_THRESHOLD: 0.4,
  WEIGHT_STRUGGLING_THRESHOLD: 2,

  // LocalStorage key for words + weights combined
  STORAGE_KEY: "wordQuizData"
};
