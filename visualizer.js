const colorMap = {
  g: "#6aaa64", // green
  y: "#c9b458", // yellow
  b: "#787c7e"  // grey
};

// Horizontal visualizer
function updateEntropyVisualizer(patternFreq, solutionCount, containerId = "entropyVisualizer") {
  if (!patternFreq || patternFreq.length === 0) return;

  const numLetters = patternFreq[0].pattern.split('-').length;
  const cellWidth = 40;  // height of each letter row
  const svgHeight = numLetters * cellWidth; // vertical space for letters
  
  const totalCount = patternFreq.reduce((s, pf) => s + pf.count, 0);
  const svgWidth = 1000;  // total width in pixels 
  const scale = svgWidth / totalCount;  // width per count unit

  let svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;

  let xOffset = 0;
  for (const pf of patternFreq) {
    const segWidth = pf.count * scale;

    // background
    svg += `<rect
          x="${xOffset}"
          y="0"
          width="${segWidth}"
          height="${svgHeight}"
          fill="#787c7e" />`;

    // draw cells horizontally
    pf.pattern.split("-").forEach((letter, i) => {
      svg += `<rect
                x="${xOffset}"
                y="${i * cellWidth}"
                width="${segWidth}"
                height="${cellWidth}"
                fill="${colorMap[letter]}" />`;
    });

    xOffset += segWidth; // next segment to the right
  }

  svg += "</svg>";
  document.getElementById(containerId).innerHTML = svg;

  // Use solutionCount (wordData.common for first guess, previous possibleAnswers later)
  const { H, normalized, Hmax } = calculateNormalizedEntropy(patternFreq, solutionCount);

  // Display both raw and normalized entropy below visualizer
  document.getElementById("entropyScore").innerHTML =
  `Entropy: ${H.toFixed(3)} / ${Hmax.toFixed(3)} bits (rough estimate)<br>
   Score: ${(normalized*100).toFixed(1)}%`;
}


// calculate Shannon entropy from pattern frequencies
function calculateEntropy(patternFreq) {
  if (!patternFreq || patternFreq.length === 0) return 0;


  const total = patternFreq.reduce((sum, pf) => sum + pf.count, 0);
  let H = 0;

  for (const pf of patternFreq) {
    const p = pf.count / total;
    if (p > 0) H -= p * Math.log2(p);
  }

  return H; // return total so we know number of words used
}

function calculateNormalizedEntropy(patternFreq, solutionCount) {
  const H = calculateEntropy(patternFreq);

  // Hmax = log2 of number of possible solutions OR 243 patterns max
  // This ensures first guess with full word set is scaled correctly
  console.log(solutionCount)

  const Hmax = Math.log2(Math.min(243, solutionCount));

  const normalized = Hmax > 0 ? H / Hmax : 0;
  return { H, normalized, Hmax };
}
