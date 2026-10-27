const panels = [...document.querySelectorAll(".panel")];
const nextButton = document.querySelector(".axis-symbol");
const logo = document.querySelector(".logo-organic");
const phases = [...logo.querySelectorAll(".evolution-phase")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const svgNS = "http://www.w3.org/2000/svg";
let animationFrame = 0;
function svgElement(name, attributes) {
  const node = document.createElementNS(svgNS, name);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

// Complementary masks replace only the evolving fragments. The underlying
// outlines never translate, stretch, fade, or depend on external image files.
const strips = [0, 95, 185, 255, 340, 430, 530];
const transitions = Array.from({ length: phases.length - 1 }, () => []);
phases.forEach((phase, phaseIndex) => {
  const mask = svgElement("mask", {
    id: `evolution-mask-${phaseIndex}`, maskUnits: "userSpaceOnUse",
    x: 0, y: 0, width: 1000, height: 530,
    style: "mask-type:luminance",
  });
  mask.append(svgElement("rect", {
    width: 1000, height: 530, fill: phaseIndex === 0 ? "white" : "black",
  }));
  if (phaseIndex > 0) {
    strips.slice(0, -1).forEach((top, row) => {
      const rect = svgElement("rect", {
        x: 0, y: top, width: 0, height: strips[row + 1] - top, fill: "white",
      });
      mask.append(rect);
      transitions[phaseIndex - 1][row] = { reveal: rect };
    });
  }
  logo.querySelector("defs").append(mask);
  phase.setAttribute("mask", `url(#${mask.id})`);
});
// Erasures are appended after the reveals so the following phase always wins.
transitions.forEach((rows, phaseIndex) => rows.forEach((pair, row) => {
  const erase = svgElement("rect", {
    x: 0, y: strips[row], width: 0,
    height: strips[row + 1] - strips[row], fill: "black",
  });
  logo.querySelector(`#evolution-mask-${phaseIndex}`).append(erase);
  pair.erase = erase;
}));

function smoothPhase(value, start, end) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function updateLogo() {
  animationFrame = 0;
  const maximum = document.documentElement.scrollHeight - window.innerHeight;
  const progress = reducedMotion.matches || maximum <= 0 ? 0
    : Math.min(1, Math.max(0, window.scrollY / maximum));
  const windows = [[0.08, 0.3], [0.36, 0.6], [0.66, 0.92]];
  transitions.forEach((rows, index) => rows.forEach(({ reveal, erase }, row) => {
    const [start, end] = windows[index];
    const stagger = [0.02, 0, 0.035, 0.01, 0.045, 0.025][row];
    const width = 1000 * smoothPhase(progress, start + stagger, end + stagger);
    reveal.setAttribute("width", width);
    erase.setAttribute("width", width);
  }));
}

function requestLogoUpdate() {
  if (!animationFrame) animationFrame = window.requestAnimationFrame(updateLogo);
}
window.addEventListener("scroll", requestLogoUpdate, { passive: true });
window.addEventListener("resize", requestLogoUpdate);
reducedMotion.addEventListener("change", requestLogoUpdate);
updateLogo();

nextButton.addEventListener("click", () => {
  const currentPanel = panels.findIndex(
    (panel) => panel.getBoundingClientRect().bottom > window.innerHeight * 0.5,
  );
  const nextPanel = panels[currentPanel + 1];
  const behavior = reducedMotion.matches ? "auto" : "smooth";
  if (nextPanel) {
    nextPanel.scrollIntoView({ behavior, block: "start" });
  } else {
    window.scrollTo({ top: 0, behavior });
  }
});
