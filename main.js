let wordData;
let guesses = []; // Each guess is { word: 'slate', colors: ['grey','green','yellow',...] }
let possibleAnswers = [];

const guessInput = document.getElementById('guessInput');
const colorSelects = document.querySelectorAll('.colorSelect');
const guessList = document.getElementById('guesses');
const possibleAnswersEl = document.getElementById('possibleAnswers');
const answerCountEl = document.getElementById('answerCount');
const clearBtn = document.getElementById('clearBtn');
const addGuessBtn = document.getElementById('addGuess');

fetch('word-data.json')
  .then(res => res.json())
  .then(data => {
    wordData = data;
    possibleAnswers = [...wordData.common, ...wordData.other];
    updateDisplay();
  });

// Add geuss button
addGuessBtn.addEventListener('click', () => {
  const guess = guessInput.value.toLowerCase();
  if (guess.length === 5 && /^[a-z]+$/.test(guess)) {
    const colors = Array.from(colorSelects).map(sel => sel.value);
    guesses.push({ word: guess, colors });
    guessInput.value = '';
    colorSelects.forEach(sel => sel.value = 'grey');
    updateGuessList();

    analyze();
  }
});


// Clear geusses button
clearBtn.addEventListener('click', () => {
  guesses = [];
  possibleAnswers = [...wordData.common, ...wordData.other];
  updateGuessList();

  analyze();

});

// Run analysis
function analyze() {
  possibleAnswers = [...wordData.common, ...wordData.other];
  filterAnswers();
  updateDisplay();
}


// Update "guesses" list based on guessList HTML element
function updateGuessList() {
  guessList.innerHTML = guesses.map(g =>
    `<div><code>${g.word.toUpperCase()}</code> [${g.colors.join(', ')}]</div>`
  ).join('');
}

// Simple filter possible answers, based on guesslist
function filterAnswers() {
  for (const { word, colors } of guesses) {
    possibleAnswers = possibleAnswers.filter(answer => {
      for (let i = 0; i < 5; i++) {
        const letter = word[i];
        const color = colors[i];

        if (color === 'green' && answer[i] !== letter) return false;
        if (color === 'yellow') {
          if (!answer.includes(letter) || answer[i] === letter) return false;
        }
        if (color === 'grey') {
          // If the letter appears multiple times, ensure it's not required in yellow/green
          const isUsed = colors.some((c, j) => j !== i && word[j] === letter && c !== 'grey');
          if (!isUsed && answer.includes(letter)) return false;
        }
      }
      return true;
    });
  }
}

// Count letter frequency in list of answers
function countLetterFrequency() {
  const freq = {};
  for (const word of possibleAnswers) {
    for (const letter of word) {
      freq[letter] = (freq[letter] || 0) + 1;
    }
  }
  return freq;
}

let chart; // global reference to the chart instance

// Letter frequency charts draw
function drawLetterFrequencyChart(freqData) {
  const labels = Object.keys(freqData);
  const counts = Object.values(freqData);

  if (chart) chart.destroy(); // destroy previous chart before drawing new

  const ctx = document.getElementById('letterFreqChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Letter Frequency',
        data: counts,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// Count letter frequencies at each of the 5 positions
function countPositionFrequencies(words) {
  const posFreq = Array.from({ length: 5 }, () => ({}));

  for (const word of words) {
    for (let i = 0; i < 5; i++) {
      const letter = word[i];
      posFreq[i][letter] = (posFreq[i][letter] || 0) + 1;
    }
  }

  return posFreq;
}

// Render the position-based frequency chart
function drawPositionFrequencies(freqData) {
  for (let pos = 0; pos < 5; pos++) {
    const container = document.querySelector(`#pos${pos} .freqList`);
    const freq = freqData[pos];

    // Sort letters by frequency
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    const max = sorted[0]?.[1] || 1; // prevent div by 0

    container.innerHTML = sorted
      .map(([letter, count]) => {
        const barWidth = Math.round((count / max) * 80); // pixels
        return `
          <div class="freqRow">
            <span class="letter">${letter.toUpperCase()}</span>
            <div class="bar" style="width: ${barWidth}px"></div>
          </div>
        `;
      })
      .join('');
  }
}

// Example new data
const newPatterns = [
  { pattern: "g-g-g-b-b", count: 5 },
  { pattern: "y-y-g-b-b", count: 3 },
  { pattern: "b-b-b-b-g", count: 2 }
];

function generatePatternFrequencies(guess, answers) {
  const freqMap = {};

  for (const answer of answers) {
    const pattern = [];

    // Track letters used for green/yellow to handle duplicates
    const answerLetters = answer.split('');
    const guessLetters = guess.split('');
    const used = Array(5).fill(false);

    // First pass: mark greens
    for (let i = 0; i < 5; i++) {
      if (guessLetters[i] === answerLetters[i]) {
        pattern[i] = 'g';
        used[i] = true;
      } else {
        pattern[i] = null; // placeholder
      }
    }

    // Second pass: mark yellows and greys
    for (let i = 0; i < 5; i++) {
      if (pattern[i]) continue; // already green

      const idx = answerLetters.findIndex((l, j) => l === guessLetters[i] && !used[j]);
      if (idx !== -1) {
        pattern[i] = 'y';
        used[idx] = true;
      } else {
        pattern[i] = 'b';
      }
    }

    const key = pattern.join('-');
    freqMap[key] = (freqMap[key] || 0) + 1;
  }

  // Convert freqMap to sorted array for display
  return Object.entries(freqMap)
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count);
}


// Main update
function updateDisplay() {
  const maxShow = 50; // num of possible answers to show\

  // Setup possible answers HTML element
  possibleAnswersEl.innerHTML = possibleAnswers
    .slice(0, maxShow)
    .map(w => `<span class="answerWord">${w}</span>`)
    .join(' ');

  // Setup answer count
  answerCountEl.textContent = possibleAnswers.length;
  
  // Find frequency of letters, sort alphabetically, then graph
  const freq = countLetterFrequency();
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const sortedFreq = Object.fromEntries(sorted);
  drawLetterFrequencyChart(sortedFreq)


  const posFreq = countPositionFrequencies(possibleAnswers);
  drawPositionFrequencies(posFreq); // Draw frequency graphs

  const lastGuess = guesses[guesses.length - 1].word;
  const patternFrequencies = generatePatternFrequencies(lastGuess, possibleAnswers);

  // Call the visualizer function
  updateEntropyVisualizer(patternFrequencies);
}

