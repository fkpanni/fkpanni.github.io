const TERMINAL_WIDTH = 700;
const TERMINAL_HEIGHT = 540;
const VIEWPORT_PADDING = 24;

const terminal = document.getElementById("terminal");
const bootScreen = document.getElementById("bootScreen");
const destinationScreen = document.getElementById("destinationScreen");

const progressTrack = document.getElementById("progressTrack");
const progressFill = document.getElementById("progressFill");
const progressLabel = document.getElementById("progressLabel");
const progressValue = document.getElementById("progressValue");

const bootMessage = document.getElementById("bootMessage");
const systemStatus = document.getElementById("systemStatus");
const footerHint = document.getElementById("footerHint");

const destinations = Array.from(
  document.querySelectorAll(".destination")
);

const logRows = Array.from(
  document.querySelectorAll(".boot-log > div")
);

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

let activeIndex = 0;
let bootFinished = false;
let animationFrameId = null;

function scaleTerminal() {
  const availableWidth =
    window.innerWidth - VIEWPORT_PADDING * 2;

  const availableHeight =
    window.innerHeight - VIEWPORT_PADDING * 2;

  const widthScale = availableWidth / TERMINAL_WIDTH;
  const heightScale = availableHeight / TERMINAL_HEIGHT;

  const scale = Math.min(widthScale, heightScale, 1);

  terminal.style.transform = `scale(${Math.max(scale, 0.32)})`;
}

function setProgress(value) {
  const safeValue = Math.min(100, Math.max(0, value));

  progressFill.style.width = `${safeValue}%`;
  progressValue.textContent = `${Math.round(safeValue)}%`;

  progressTrack.setAttribute(
    "aria-valuenow",
    String(Math.round(safeValue))
  );
}

function completeLog(index) {
  const status = logRows[index]?.querySelector("span:last-child");

  if (!status) return;

  status.textContent = "OK";
  status.classList.remove("pending");
  status.classList.add("complete");
}

function updateBootState(progress) {
  if (progress < 32) {
    bootMessage.textContent = "initializing system...";
    progressLabel.textContent = "loading identity modules";
    systemStatus.textContent = "initializing launch hub";
  } else if (progress < 65) {
    bootMessage.textContent = "resolving destinations...";
    progressLabel.textContent = "mapping external routes";
    systemStatus.textContent = "resolving destinations";
    completeLog(0);
  } else if (progress < 92) {
    bootMessage.textContent = "building interface...";
    progressLabel.textContent = "preparing selection controls";
    systemStatus.textContent = "building interface";
    completeLog(1);
  } else {
    bootMessage.textContent = "system ready.";
    progressLabel.textContent = "launch hub online";
    systemStatus.textContent = "launch hub online";
    completeLog(2);
  }
}

function finishBoot() {
  if (bootFinished) return;

  bootFinished = true;

  setProgress(100);
  updateBootState(100);

  window.setTimeout(() => {
    bootScreen.classList.add("hidden");
    bootScreen.setAttribute("aria-hidden", "true");

    destinationScreen.classList.add("visible");
    destinationScreen.setAttribute("aria-hidden", "false");

    terminal.classList.add("boot-ready");

    footerHint.textContent =
      "tip: ↑/↓ navigate · enter open · tap select";

    updateActiveDestination(0);
  }, prefersReducedMotion ? 0 : 350);
}

function runBootAnimation() {
  if (prefersReducedMotion) {
    finishBoot();
    return;
  }

  const duration = 2200;
  const startTime = performance.now();

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const rawProgress = Math.min(elapsed / duration, 1);
    const easedProgress = 1 - Math.pow(1 - rawProgress, 2.2);
    const percentage = easedProgress * 100;

    setProgress(percentage);
    updateBootState(percentage);

    if (rawProgress < 1) {
      animationFrameId = requestAnimationFrame(animate);
      return;
    }

    finishBoot();
  }

  animationFrameId = requestAnimationFrame(animate);
}

function skipBoot() {
  if (bootFinished) return;

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  finishBoot();
}

function updateActiveDestination(index) {
  if (!bootFinished) return;

  activeIndex =
    (index + destinations.length) % destinations.length;

  destinations.forEach((destination, destinationIndex) => {
    const isActive = destinationIndex === activeIndex;

    destination.classList.toggle("active", isActive);
    destination.setAttribute(
      "aria-current",
      isActive ? "true" : "false"
    );
  });
}

function openActiveDestination() {
  const destination = destinations[activeIndex];
  if (!destination) return;
  destination.click();
}

function handleKeyboard(event) {
  if (!bootFinished) {
    if (
      event.key === "Enter" ||
      event.key === " " ||
      event.key === "Escape"
    ) {
      event.preventDefault();
      skipBoot();
    }
    return;
  }

  switch (event.key) {
    case "ArrowDown":
    case "j":
    case "J":
      event.preventDefault();
      updateActiveDestination(activeIndex + 1);
      break;

    case "ArrowUp":
    case "k":
    case "K":
      event.preventDefault();
      updateActiveDestination(activeIndex - 1);
      break;

    case "Enter":
      event.preventDefault();
      openActiveDestination();
      break;

    case "1":
      updateActiveDestination(0);
      openActiveDestination();
      break;

    case "2":
      updateActiveDestination(1);
      openActiveDestination();
      break;

    case "3":
      updateActiveDestination(2);
      openActiveDestination();
      break;

    default:
      break;
  }
}

destinations.forEach((destination, index) => {
  destination.addEventListener("mouseenter", () => {
    updateActiveDestination(index);
  });

  destination.addEventListener("focus", () => {
    updateActiveDestination(index);
  });

  destination.addEventListener("pointerdown", () => {
    updateActiveDestination(index);
  });
});

window.addEventListener("resize", scaleTerminal);
window.addEventListener("orientationchange", scaleTerminal);
window.addEventListener("keydown", handleKeyboard);

bootScreen.addEventListener("click", skipBoot);

scaleTerminal();
runBootAnimation();
