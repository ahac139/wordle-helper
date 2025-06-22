let wordData;
let guesses = []; // Each guess is { word: 'slate', colors: ['grey','green','yellow',...] }
let possibleAnswers = [];

const guessInput = document.getElementById('guessInput');
const colorSelects = document.querySelectorAll('.colorSelect');
const guessList = document.getElementById('guesses');
const possibleAnswersEl = document.getElementById('possibleAnswers');
const answerCountEl = document.getElementById('answerCount');
const letterFreqEl = document.getElementById('letterFreq');
const clearBtn = document.getElementById('clearBtn');
const addGuessBtn = document.getElementById('addGuess');
const analyzeBtn = document.getElementById('analyze');

fetch('word-data.json')
  .then(res => res.json())
  .then(data => {
    wordData = data;
    possibleAnswers = [...wordData.common, ...wordData.other];
    updateDisplay();
  });

addGuessBtn.addEventListener('click', () => {
  const guess = guessInput.value.toLowerCase();
  if (guess.length === 5 && /^[a-z]+$/.test(guess)) {
    const colors = Array.from(colorSelects).map(sel => sel.value);
    guesses.push({ word: guess, colors });
    guessInput.value = '';
    colorSelects.forEach(sel => sel.value = 'grey');
    updateGuessList();
  }
});

analyzeBtn.addEventListener('click', () => {
  possibleAnswers = [...wordData.common, ...wordData.other];
  filterAnswers();
  updateDisplay();
});

clearBtn.addEventListener('click', () => {
  guesses = [];
  possibleAnswers = [...wordData.common, ...wordData.other];
  updateGuessList();
  updateDisplay();
});

function updateGuessList() {
  guessList.innerHTML = guesses.map(g =>
    `<div><code>${g.word.toUpperCase()}</code> [${g.colors.join(', ')}]</div>`
  ).join('');
}

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


function updateDisplay() {
  const maxShow = 20;
  possibleAnswersEl.innerHTML = possibleAnswers
    .slice(0, maxShow)
    .map(w => `<li>${w}</li>`)
    .join('');
  answerCountEl.textContent = possibleAnswers.length;
  
  const freq = countLetterFrequency();
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const sortedFreq = Object.fromEntries(sorted);
  drawLetterFrequencyChart(sortedFreq)
  letterFreqEl.innerHTML = sorted
    .map(([letter, count]) => `<li>${letter.toUpperCase()}: ${count}</li>`)
    .join('');

    const posFreq = countPositionFrequencies(possibleAnswers);
    drawPositionFrequencies(posFreq);
}
