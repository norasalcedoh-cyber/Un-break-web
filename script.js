const pageLoader = document.querySelector(".page-loader");
function revealPage(event) {
  if (event && (event.target !== pageLoader || event.animationName !== "loader-exit")) return;
  document.body.classList.remove("is-loading");
  document.querySelector(".home").inert = false;
  pageLoader?.dispatchEvent(new Event("loaderfinished"));
  pageLoader?.remove();
}
if (pageLoader) {
  document.body.classList.add("is-loading");
  document.querySelector(".home").inert = true;
  pageLoader.addEventListener("animationend", revealPage);
}

const themeToggle = document.querySelector(".theme-toggle");
function updateThemeButton() {
  const isDark = document.documentElement.dataset.theme === "dark";
  themeToggle.setAttribute("aria-checked", String(isDark));
}
themeToggle.addEventListener("click", () => {
  const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem("unbreak-theme", theme); } catch { /* Storage is optional. */ }
  updateThemeButton();
});
updateThemeButton();

const panels = [...document.querySelectorAll(".panel")];
const nextButton = document.querySelector(".axis-symbol");
const topMeta = document.querySelector(".fixed-meta");
const logo = document.querySelector(".logo-organic");
const phases = [...logo.querySelectorAll(".evolution-phase")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Animate SVG primitives directly: CSS cannot interpolate a filter list
// containing url(). Each visible text has its own independent ink animation.
const inkNS = "http://www.w3.org/2000/svg";
const inkSVG = document.createElementNS(inkNS, "svg");
inkSVG.setAttribute("aria-hidden", "true");
inkSVG.setAttribute("width", "0");
inkSVG.setAttribute("height", "0");
inkSVG.style.position = "absolute";
const inkDefs = document.createElementNS(inkNS, "defs");
inkSVG.append(inkDefs);
document.body.append(inkSVG);
const revealTargets = [...document.querySelectorAll(
  ".story .section-title",
)];
const inkAnimations = new Map();
let textObserver;
let inkFrame = 0;
let inkSequence = 0;

function finishInk(element, animation) {
  element.style.removeProperty("filter");
  animation.filter.remove();
  inkAnimations.delete(element);
}

function renderInk(now) {
  inkFrame = 0;
  let hasRunningAnimation = false;
  inkAnimations.forEach((animation, element) => {
    if (!Number.isFinite(animation.start)) return;
    const progress = Math.max(0, Math.min(1, (now - animation.start) / 1400));
    // Smooth start and finish, with most of the definition in the middle.
    const remaining = 1 - progress * progress * (3 - 2 * progress);
    animation.blur.setAttribute("stdDeviation", (animation.size * 0.095 * remaining).toFixed(3));
    animation.warp.setAttribute("scale", (animation.size * 0.22 * remaining).toFixed(3));
    // Fade the alpha threshold back to the identity matrix too. Leaving it
    // strong until cleanup caused the final jump from thick to crisp edges.
    animation.contrast.setAttribute("values",
      `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${1 + 17 * remaining} ${-7 * remaining}`);
    if (progress === 1) finishInk(element, animation);
    else hasRunningAnimation = true;
  });
  if (hasRunningAnimation) inkFrame = requestAnimationFrame(renderInk);
}

function prepareInk(element) {
  const filter = document.createElementNS(inkNS, "filter");
  const id = "ink-reveal-" + inkSequence++;
  filter.setAttribute("id", id);
  filter.setAttribute("x", "-25%");
  filter.setAttribute("y", "-50%");
  filter.setAttribute("width", "150%");
  filter.setAttribute("height", "200%");
  filter.setAttribute("color-interpolation-filters", "sRGB");
  filter.innerHTML = '<feTurbulence type="fractalNoise" baseFrequency="0.025 0.07" numOctaves="2" seed="8" result="noise" />'
    + '<feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />'
    + '<feGaussianBlur stdDeviation="0" />'
    + '<feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" />';
  inkDefs.append(filter);
  const animation = {
    filter,
    blur: filter.querySelector("feGaussianBlur"),
    warp: filter.querySelector("feDisplacementMap"),
    contrast: filter.querySelector("feColorMatrix"),
    size: parseFloat(getComputedStyle(element).fontSize),
    start: Infinity,
  };
  inkAnimations.set(element, animation);
  element.style.filter = "url(#" + id + ")";
  // Set the initial silhouette before the next paint.
  animation.blur.setAttribute("stdDeviation", animation.size * 0.095);
  animation.warp.setAttribute("scale", animation.size * 0.22);
}

function setupTextReveals() {
  textObserver?.disconnect();
  cancelAnimationFrame(inkFrame);
  inkFrame = 0;
  inkAnimations.forEach((animation, element) => finishInk(element, animation));
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;
  textObserver = new IntersectionObserver((entries) => {
    entries.filter((entry) => !entry.isIntersecting).forEach((entry) => {
      const animation = inkAnimations.get(entry.target);
      // Re-arm after leaving the reading area, without restarting on every
      // scroll event while the visitor is reading the same title.
      if (animation && !Number.isFinite(animation.start)) return;
      if (animation) finishInk(entry.target, animation);
      prepareInk(entry.target);
    });
    entries.filter((entry) => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      .forEach((entry, index) => {
        const animation = inkAnimations.get(entry.target);
        if (animation) animation.start = performance.now() + Math.min(index, 3) * 35;
        if (!inkFrame) inkFrame = requestAnimationFrame(renderInk);
      });
  }, { threshold: 0, rootMargin: "0px 0px -3% 0px" });
  revealTargets.forEach((element) => {
      // Prepare before entering the viewport to avoid sharp text suddenly
      // turning into a blob when the observer fires.
      prepareInk(element);
      textObserver.observe(element);
  });
}

// Start after the loader, so it cannot cover the text animation.
function startTextReveals() {
  const ready = document.fonts ? document.fonts.ready : Promise.resolve();
  ready.then(setupTextReveals);
}
if (!pageLoader || reducedMotion.matches) startTextReveals();
else pageLoader.addEventListener("loaderfinished", startTextReveals, { once: true });
reducedMotion.addEventListener("change", setupTextReveals);
window.addEventListener("pageshow", (event) => {
  if (event.persisted) setupTextReveals();
});

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
    maskContentUnits: "userSpaceOnUse",
    x: 0, y: 0, width: 1000, height: 530,
    // Snap only mask edges to pixels: adjacent strips must not leave hairlines.
    // The letter outlines keep their normal antialiasing.
    "shape-rendering": "crispEdges",
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
  topMeta.classList.toggle("fixed-meta--hidden", window.scrollY > 20);
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
