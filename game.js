// Game state
let WORDS = {};
let wordList = [];
let allDefinitions = [];
let allSynonyms = [];
let allAntonyms = [];
let currentQuestionType = 'def';
let score = 0;
let total = 0;
let currentWord = '';
let correctIndex = -1;
let answered = false;
let questionsPerRound = CONFIG.DEFAULT_QUESTIONS_PER_ROUND;
let hintUsedThisQuestion = false;
let highlightedOption = -1;
let focusMode = null;
let questionModes = ['def', 'syn', 'ant'];
let wordWeights = {};

// Storage functions
function loadData() {
  const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  return null;
}

function saveData() {
  const data = { words: WORDS, weights: wordWeights };
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
}

function initializeWeights() {
  wordList.forEach(word => {
    if (!(word in wordWeights)) {
      wordWeights[word] = CONFIG.WEIGHT_INITIAL;
    }
  });
}

// Initialize game with words data
function initializeGame(wordsData) {
  WORDS = wordsData;
  wordList = Object.keys(WORDS);
  allDefinitions = Object.values(WORDS).map(w => w.def);
  allSynonyms = Object.values(WORDS).map(w => w.syn);
  allAntonyms = Object.values(WORDS).map(w => w.ant);
  initializeWeights();
  saveData();
  updateStatsDisplay();
}


// Spaced repetition functions
function pickWeightedWord() {
  let pool = getWordsByMode(focusMode);
  if (pool.length === 0) pool = wordList;

  let totalWeight = 0;
  pool.forEach(word => {
    totalWeight += wordWeights[word] || CONFIG.WEIGHT_INITIAL;
  });

  let random = Math.random() * totalWeight;
  let cumulative = 0;

  for (const word of pool) {
    cumulative += wordWeights[word] || CONFIG.WEIGHT_INITIAL;
    if (random <= cumulative) {
      return word;
    }
  }
  return pool[pool.length - 1];
}

function updateWeight(word, correct) {
  if (correct) {
    if (hintUsedThisQuestion) {
      wordWeights[word] = Math.max(CONFIG.WEIGHT_MIN, (wordWeights[word] || CONFIG.WEIGHT_INITIAL) * CONFIG.WEIGHT_CORRECT_WITH_HINT_MULTIPLIER);
    } else {
      wordWeights[word] = Math.max(CONFIG.WEIGHT_MIN, (wordWeights[word] || CONFIG.WEIGHT_INITIAL) * CONFIG.WEIGHT_CORRECT_MULTIPLIER);
    }
  } else {
    wordWeights[word] = Math.min(CONFIG.WEIGHT_MAX, (wordWeights[word] || CONFIG.WEIGHT_INITIAL) * CONFIG.WEIGHT_INCORRECT_MULTIPLIER);
  }
  saveData();
}

function resetProgress() {
  wordList.forEach(word => wordWeights[word] = CONFIG.WEIGHT_INITIAL);
  saveData();
  updateStatsDisplay();
}

function getStats() {
  let mastered = 0, learning = 0, struggling = 0;
  wordList.forEach(word => {
    const w = wordWeights[word] || CONFIG.WEIGHT_INITIAL;
    if (w <= CONFIG.WEIGHT_MASTERED_THRESHOLD) mastered++;
    else if (w >= CONFIG.WEIGHT_STRUGGLING_THRESHOLD) struggling++;
    else learning++;
  });
  return { mastered, learning, struggling };
}

function getWordsByMode(mode) {
  if (mode === 'learned') {
    return wordList.filter(word => (wordWeights[word] || CONFIG.WEIGHT_INITIAL) <= CONFIG.WEIGHT_MASTERED_THRESHOLD);
  } else if (mode === 'unlearned') {
    return wordList.filter(word => (wordWeights[word] || CONFIG.WEIGHT_INITIAL) > CONFIG.WEIGHT_MASTERED_THRESHOLD);
  } else if (mode === 'struggling') {
    return wordList.filter(word => (wordWeights[word] || CONFIG.WEIGHT_INITIAL) >= CONFIG.WEIGHT_STRUGGLING_THRESHOLD);
  }
  return wordList;
}

function updateStatsDisplay() {
  const stats = getStats();
  const statsEl = document.getElementById('stats-display');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stats-row">
        <span class="stat-option ${focusMode === null ? 'active' : ''}" onclick="setFocusMode(null)">All (${wordList.length})</span>
        <span class="stat-option ${focusMode === 'learned' ? 'active' : ''}" onclick="setFocusMode('learned')">Learned (${stats.mastered})</span>
        <span class="stat-option ${focusMode === 'unlearned' ? 'active' : ''}" onclick="setFocusMode('unlearned')">Unlearned (${wordList.length - stats.mastered})</span>
        <span class="stat-option ${focusMode === 'struggling' ? 'active' : ''}" onclick="setFocusMode('struggling')">Needs work (${stats.struggling})</span>
      </div>
      <div>
        <span class="stat-option ${questionModes.includes('def') ? 'active' : ''}" onclick="toggleQuestionMode('def')">Definition</span>
        <span class="stat-option ${questionModes.includes('syn') ? 'active' : ''}" onclick="toggleQuestionMode('syn')">Synonym</span>
        <span class="stat-option ${questionModes.includes('ant') ? 'active' : ''}" onclick="toggleQuestionMode('ant')">Antonym</span>
      </div>
    `;
  }
}

function setFocusMode(mode) {
  const words = getWordsByMode(mode);
  if (words.length === 0) {
    alert('No words in this category!');
    return;
  }
  focusMode = mode;
  updateStatsDisplay();
}

function toggleQuestionMode(mode) {
  if (questionModes.includes(mode)) {
    if (questionModes.length > 1) {
      questionModes = questionModes.filter(m => m !== mode);
    }
  } else {
    questionModes.push(mode);
  }
  updateStatsDisplay();
}

// Hint functions
function showHint() {
  hintUsedThisQuestion = true;
  const example = WORDS[currentWord].ex;
  const hintDisplay = document.getElementById('hint-display');
  const wordClean = currentWord.replace(/\s*\(.*\)/, '');
  const regex = new RegExp(`(${wordClean})`, 'gi');
  const highlightedExample = example.replace(regex, '<span class="highlight-word">$1</span>');
  hintDisplay.innerHTML = `<div class="hint-label">Example:</div>"${highlightedExample}"`;
  hintDisplay.classList.add('show');
  document.getElementById('hint-btn').classList.add('hidden');
}

function hideHint() {
  document.getElementById('hint-display').classList.remove('show');
  document.getElementById('hint-btn').classList.remove('hidden');
  hintUsedThisQuestion = false;
}

// Utility functions
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Quiz functions
function startQuiz() {
  questionsPerRound = parseInt(document.getElementById('num-questions').value);
  score = 0;
  total = 0;
  updateScore();
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('end-screen').style.display = 'none';
  document.getElementById('quiz-screen').style.display = 'block';
  document.getElementById('score-display').style.display = 'block';
  document.getElementById('progress-bar').style.display = 'block';
  nextQuestion();
}

function updateScore() {
  document.getElementById('score').textContent = score;
  document.getElementById('total').textContent = total;
  const pct = total > 0 ? (score / total) * 100 : 0;
  document.getElementById('progress').style.width = pct + '%';
}

function nextQuestion() {
  if (total >= questionsPerRound) {
    endQuiz();
    return;
  }

  answered = false;
  highlightedOption = -1;
  document.getElementById('feedback').classList.remove('show', 'correct', 'incorrect');
  document.getElementById('next-btn').classList.remove('show');
  hideHint();

  currentWord = pickWeightedWord();
  currentQuestionType = questionModes[Math.floor(Math.random() * questionModes.length)];

  let correctAnswer, wrongAnswers, questionLabel;

  if (currentQuestionType === 'def') {
    correctAnswer = WORDS[currentWord].def;
    wrongAnswers = allDefinitions.filter(d => d !== correctAnswer);
    questionLabel = 'What does this word mean?';
  } else if (currentQuestionType === 'syn') {
    correctAnswer = WORDS[currentWord].syn;
    wrongAnswers = allSynonyms.filter(s => s !== correctAnswer);
    questionLabel = 'SYNONYM';
  } else {
    correctAnswer = WORDS[currentWord].ant;
    wrongAnswers = allAntonyms.filter(a => a !== correctAnswer);
    questionLabel = 'ANTONYM';
  }

  const numWrongOptions = Math.min(CONFIG.OPTIONS_PER_QUESTION - 1, wrongAnswers.length);
  const shuffledWrong = shuffle(wrongAnswers).slice(0, numWrongOptions);
  let options = [correctAnswer, ...shuffledWrong];
  options = shuffle(options);
  correctIndex = options.indexOf(correctAnswer);

  document.getElementById('word-label').textContent = questionLabel;
  document.getElementById('current-word').textContent = currentWord.toLowerCase();

  const optionsContainer = document.getElementById('options');
  optionsContainer.innerHTML = '';

  options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.textContent = opt;
    btn.onclick = () => selectAnswer(i);
    optionsContainer.appendChild(btn);
  });
}

function selectAnswer(index) {
  if (answered) return;
  answered = true;
  total++;

  const options = document.querySelectorAll('.option');
  options.forEach(opt => opt.classList.add('disabled'));

  const feedback = document.getElementById('feedback');
  const wordInfo = WORDS[currentWord];
  const isCorrect = index === correctIndex;
  const wordClean = currentWord.replace(/\s*\(.*\)/, '');
  const regex = new RegExp(`(${wordClean})`, 'gi');
  const highlightedEx = wordInfo.ex.replace(regex, '<span class="highlight-word">$1</span>');
  const wordDetails = `<div class="word-details ${isCorrect ? 'correct' : 'incorrect'}">
    <div class="detail-row"><span class="detail-label">Meaning:</span> ${wordInfo.def}</div>
    <div class="detail-row"><span class="detail-label">Example:</span> <span class="detail-example">"${highlightedEx}"</span></div>
  </div>`;

  if (isCorrect) {
    score++;
    options[index].classList.add('correct');
    updateWeight(currentWord, true);
  } else {
    options[index].classList.add('incorrect');
    options[correctIndex].classList.add('correct');
    updateWeight(currentWord, false);
  }
  feedback.innerHTML = wordDetails;
  updateStatsDisplay();
  document.getElementById('hint-btn').classList.add('hidden');
  document.getElementById('hint-display').classList.remove('show');

  feedback.classList.add('show');
  updateScore();
  document.getElementById('next-btn').classList.add('show');
}

function endQuiz() {
  document.getElementById('quiz-screen').style.display = 'none';
  document.getElementById('end-screen').style.display = 'block';

  const pct = Math.round((score / total) * 100);
  document.getElementById('final-score').textContent = `${score}/${total} (${pct}%)`;

  let msg = '';
  if (pct === 100) msg = 'Perfect score! Amazing!';
  else if (pct >= 80) msg = 'Great job! Keep practicing!';
  else if (pct >= 60) msg = 'Good effort! A bit more practice will help.';
  else msg = 'Keep studying and try again!';

  document.getElementById('end-message').textContent = msg;
}

// Keyboard navigation
function updateHighlight() {
  const options = document.querySelectorAll('.option');
  options.forEach((opt, i) => {
    if (i === highlightedOption) {
      opt.classList.add('highlighted');
    } else {
      opt.classList.remove('highlighted');
    }
  });
}

document.addEventListener('keydown', function(e) {
  const quizScreen = document.getElementById('quiz-screen');
  if (!quizScreen || quizScreen.style.display !== 'block') return;

  if (e.key === 'Escape') {
    e.preventDefault();
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'block';
    updateStatsDisplay();
    return;
  }

  const numOptions = CONFIG.OPTIONS_PER_QUESTION;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (!answered) {
      highlightedOption = (highlightedOption + 1) % numOptions;
      updateHighlight();
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (!answered) {
      highlightedOption = (highlightedOption - 1 + numOptions) % numOptions;
      updateHighlight();
    }
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (answered) {
      nextQuestion();
    } else if (highlightedOption >= 0) {
      selectAnswer(highlightedOption);
    }
  } else if (e.key === 'Shift' && !answered && !hintUsedThisQuestion) {
    e.preventDefault();
    showHint();
  }
});
