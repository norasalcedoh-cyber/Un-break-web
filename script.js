const panels = [...document.querySelectorAll(".panel")];
const nextButton = document.querySelector(".axis-symbol");
const logoLines = [...document.querySelectorAll(".logo-line")];
let letterCenters = [];
let animationFrame = 0;

function measureLetterCenters() {
  letterCenters = logoLines.map((line) => {
    const letters = [...line.querySelectorAll(".logo-letter")];
    letters.forEach((letter) => letter.style.setProperty("--letter-x", "0px"));

    const lineBounds = line.getBoundingClientRect();
    const fontSize = Number.parseFloat(getComputedStyle(line).fontSize);
    const center = lineBounds.left + lineBounds.width / 2;

    return letters.map((letter) => {
      const bounds = letter.getBoundingClientRect();
      return (center - (bounds.left + bounds.width / 2)) / fontSize;
    });
  });
}

function updateLogo() {
  animationFrame = 0;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0
    ? Math.min(1, Math.max(0, window.scrollY / maxScroll))
    : 0;
  const compression = progress < 0.52
    ? (progress / 0.52) * 0.62
    : 0.62 + ((progress - 0.52) / 0.48) * 0.32;

  logoLines.forEach((line, lineIndex) => {
    line.querySelectorAll(".logo-letter").forEach((letter, index) => {
      const centerOffset = letterCenters[lineIndex]?.[index] ?? 0;
      letter.style.setProperty("--letter-x", `${centerOffset * compression}em`);
    });
  });
}

function requestLogoUpdate() {
  if (!animationFrame) {
    animationFrame = window.requestAnimationFrame(updateLogo);
  }
}

window.addEventListener("scroll", requestLogoUpdate, { passive: true });
window.addEventListener("resize", () => {
  measureLetterCenters();
  requestLogoUpdate();
});

document.fonts.ready.then(() => {
  measureLetterCenters();
  updateLogo();
});

nextButton.addEventListener("click", () => {
  const currentPanel = panels.findIndex(
    (panel) => panel.getBoundingClientRect().bottom > window.innerHeight * 0.5,
  );
  const nextPanel = panels[currentPanel + 1];

  if (nextPanel) {
    nextPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});
