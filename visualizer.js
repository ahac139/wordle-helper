const colorMap = {
  g: "#6aaa64", // green
  y: "#c9b458", // yellow
  b: "#787c7e"  // grey
};

// function to draw/update the visualizer
function updateEntropyVisualizer(patternFreq, containerId = "entropyVisualizer") {
  if (!patternFreq || patternFreq.length === 0) return;

  const numLetters = patternFreq[0].pattern.split('-').length;
  const cellWidth = 40;
  const keyWidth = numLetters * cellWidth;
  const svgHeight = 200;
  const totalCount = patternFreq.reduce((s, pf) => s + pf.count, 0);
  const scale = svgHeight / totalCount;

  let svg = `<svg width="${keyWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;

  let yOffset = 0;
  patternFreq.forEach(pf => {
    const segHeight = pf.count * scale;

    // background
    svg += `<rect x="0" y="${yOffset}" width="${keyWidth}" height="${segHeight}" fill="white" stroke="#ccc"/>`;

    // draw cells
    pf.pattern.split("-").forEach((l, i) => {
      svg += `<rect 
                x="${i * cellWidth}" 
                y="${yOffset}" 
                width="${cellWidth}" 
                height="${segHeight}" 
                fill="${colorMap[l]}" />`;
    });

    yOffset += segHeight;
  });

  svg += "</svg>";

  document.getElementById(containerId).innerHTML = svg;
}

// Optional: export if using modules
// export { updateEntropyVisualizer };
