const names = window.NAME_DATABASE ?? ["תפוחית"];

const nameElement = document.querySelector("#generated-name");
const button = document.querySelector("#generate-button");
const sparkleLayer = document.querySelector("#sparkle-layer");
const rainbowCursor = document.querySelector("#rainbow-cursor");
const themeToggle = document.querySelector("#theme-toggle");
const vibeTag = document.querySelector("#vibe-tag");
const themeLayers = [
  document.querySelector("#theme-layer-a"),
  document.querySelector("#theme-layer-b"),
];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

let previousName = nameElement.textContent;
let audioContext;
let lastTrailTime = 0;
let themesOn = false;
let activeThemeLayer = 0;

// Every name gets its own vibe: keywords first, deterministic hash as fallback,
// so the same name always lands on the same background.
const THEMES = [
  {
    id: "glitter",
    label: "נצנצים",
    emoji: "💖",
    match: /גליט|נצנצ|נצנץ|זוהר|זהר|כוכב/,
  },
  {
    id: "sequins",
    label: "פאייטים",
    emoji: "✨",
    match: /פאייט|קונפטי|בלינג|גלוס|לק ג|פדיקור|מניקור|אקסטנשן|פאשניסט|סטרפלס|פלטפורמ/,
  },
  {
    id: "leopard",
    label: "מנומר",
    emoji: "🐆",
    match: /שניצל|פלאפל|סמבוסק|שקשוק|ג׳חנונ|חבית|פיצ|קרואסונ|שטרודל|פסטרמ|קובנ|מלוואח|סביח|במב|פנתר|חתול/,
  },
  {
    id: "zebra",
    label: "זברה",
    emoji: "🦓",
    match: /זיגזג|זברה/,
  },
  {
    id: "cow",
    label: "פרה מתוקה",
    emoji: "🐄",
    match: /קצפת|פלומב|מרשמלו/,
  },
  {
    id: "bubblegum",
    label: "מסטיק",
    emoji: "🍬",
    match: /מסטיק|בזוק|סוכר|גומ|בונבונ|טופי/,
  },
  {
    id: "choco",
    label: "שוקו",
    emoji: "🍫",
    match: /קרמבו|שוקו|פודינג|עוגי/,
  },
  {
    id: "fruity",
    label: "אבטיח",
    emoji: "🍉",
    match: /אבטיח|תפוח|דובדבנ|פטל|מנגו|קלמנטינ|רימונ|פומל|צימוק|לימונ|מרמלד|חמוצ/,
  },
  {
    id: "holo",
    label: "הולוגרמה",
    emoji: "💿",
    match: /טמגוצ|ביפר|דיסקמנ|וולקמנ|גוגל|מילניום|ניילונ/,
  },
  {
    id: "denim",
    label: "ג׳ינס",
    emoji: "👖",
    match: /ג׳ינס/,
  },
  {
    id: "disco",
    label: "דיסקו",
    emoji: "🪩",
    match: /דיסקו|היפהופ|מנגינ|סלסול/,
  },
];

if (hasFinePointer.matches) {
  document.body.classList.add("has-rainbow-cursor");
}

initThemeToggle();

button.addEventListener("click", () => {
  const nextName = pickName();
  previousName = nextName;
  nameElement.textContent = nextName;
  applyThemeForName(nextName);
  nameElement.classList.remove("is-changing");
  nameElement.classList.remove("is-sparkling");
  button.classList.remove("button-spark");
  window.requestAnimationFrame(() => {
    nameElement.classList.add("is-changing");
    nameElement.classList.add("is-sparkling");
    button.classList.add("button-spark");
  });
  burstSparkles();
  playSparkleSound();
});

window.addEventListener("pointermove", (event) => {
  if (!hasFinePointer.matches) {
    return;
  }

  updateRainbowCursor(event.clientX, event.clientY);
  trailSparkle(event.clientX, event.clientY);
});

window.addEventListener("pointerleave", () => {
  rainbowCursor.classList.remove("is-visible");
});

window.addEventListener("pointerenter", (event) => {
  if (!hasFinePointer.matches) {
    return;
  }

  updateRainbowCursor(event.clientX, event.clientY);
});

nameElement.addEventListener("transitionend", () => {
  nameElement.classList.remove("is-changing");
});

nameElement.addEventListener("animationend", () => {
  nameElement.classList.remove("is-sparkling");
});

button.addEventListener("animationend", () => {
  button.classList.remove("button-spark");
});

function initThemeToggle() {
  let saved = null;

  try {
    saved = window.localStorage.getItem("y2k-theme-backgrounds");
  } catch (error) {
    saved = null;
  }

  if (saved === "on") {
    setThemesOn(true);
  }

  themeToggle.addEventListener("click", () => {
    setThemesOn(!themesOn);

    try {
      window.localStorage.setItem("y2k-theme-backgrounds", themesOn ? "on" : "off");
    } catch (error) {
      // Private mode: the toggle still works for this visit.
    }
  });
}

function setThemesOn(nextState) {
  themesOn = nextState;
  themeToggle.setAttribute("aria-pressed", String(themesOn));
  themeToggle.classList.toggle("is-on", themesOn);
  document.body.classList.toggle("theme-on", themesOn);

  if (themesOn) {
    applyThemeForName(nameElement.textContent);
  } else {
    themeLayers.forEach((layer) => layer.classList.remove("is-showing"));
    vibeTag.hidden = true;
  }
}

function pickTheme(name) {
  const keywordTheme = THEMES.find((theme) => theme.match.test(name));

  if (keywordTheme) {
    return keywordTheme;
  }

  let hash = 0;

  for (const char of name) {
    hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  }

  return THEMES[hash % THEMES.length];
}

function applyThemeForName(name) {
  if (!themesOn) {
    return;
  }

  const theme = pickTheme(name);
  const nextLayer = themeLayers[1 - activeThemeLayer];
  const currentLayer = themeLayers[activeThemeLayer];

  nextLayer.className = `theme-layer theme-${theme.id} is-showing`;
  currentLayer.classList.remove("is-showing");
  activeThemeLayer = 1 - activeThemeLayer;

  vibeTag.textContent = `${theme.emoji} וייב: ${theme.label}`;
  vibeTag.hidden = false;
}

function pickName() {
  if (names.length === 1) {
    return names[0];
  }

  let nextName = previousName;

  while (nextName === previousName) {
    nextName = names[Math.floor(Math.random() * names.length)];
  }

  return nextName;
}

function burstSparkles() {
  if (reducedMotion.matches) {
    return;
  }

  const buttonRect = button.getBoundingClientRect();
  const nameRect = nameElement.getBoundingClientRect();
  const origins = [
    {
      x: buttonRect.left + buttonRect.width / 2,
      y: buttonRect.top + buttonRect.height / 2,
      count: 22,
      spread: 132,
    },
    {
      x: nameRect.left + nameRect.width / 2,
      y: nameRect.top + nameRect.height / 2,
      count: 16,
      spread: 190,
    },
  ];

  origins.forEach((origin) => {
    for (let index = 0; index < origin.count; index += 1) {
      const sparkle = document.createElement("span");
      const angle = Math.random() * Math.PI * 2;
      const distance = origin.spread * (0.35 + Math.random() * 0.75);
      const size = 6 + Math.random() * 16;

      sparkle.className = "sparkle";
      sparkle.style.setProperty("--x", `${origin.x}px`);
      sparkle.style.setProperty("--y", `${origin.y}px`);
      sparkle.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
      sparkle.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
      sparkle.style.setProperty("--rot", `${160 + Math.random() * 520}deg`);
      sparkle.style.setProperty("--size", `${size}px`);
      sparkle.style.setProperty("--hue", `${42 + Math.random() * 310}`);
      sparkleLayer.append(sparkle);

      window.setTimeout(() => {
        sparkle.remove();
      }, 840);
    }
  });
}

function updateRainbowCursor(x, y) {
  rainbowCursor.style.setProperty("--cursor-x", `${x - 6}px`);
  rainbowCursor.style.setProperty("--cursor-y", `${y - 2}px`);
  rainbowCursor.classList.add("is-visible");
}

function trailSparkle(x, y) {
  const now = window.performance.now();

  if (reducedMotion.matches || now - lastTrailTime < 28) {
    return;
  }

  lastTrailTime = now;

  for (let index = 0; index < 2; index += 1) {
    const sparkle = document.createElement("span");
    const angle = Math.random() * Math.PI * 2;
    const distance = 18 + Math.random() * 42;
    const size = 4 + Math.random() * 8;

    sparkle.className = "sparkle is-trail";
    sparkle.style.setProperty("--x", `${x + (Math.random() - 0.5) * 12}px`);
    sparkle.style.setProperty("--y", `${y + (Math.random() - 0.5) * 12}px`);
    sparkle.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
    sparkle.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
    sparkle.style.setProperty("--rot", `${90 + Math.random() * 260}deg`);
    sparkle.style.setProperty("--size", `${size}px`);
    sparkle.style.setProperty("--hue", `${Math.random() * 360}`);
    sparkleLayer.append(sparkle);

    window.setTimeout(() => {
      sparkle.remove();
    }, 680);
  }
}

function playSparkleSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  audioContext ??= new AudioContextClass();

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const now = audioContext.currentTime;
  const master = audioContext.createGain();
  const compressor = audioContext.createDynamicsCompressor();

  master.gain.setValueAtTime(0.16, now);
  master.gain.exponentialRampToValueAtTime(0.001, now + 0.62);
  master.connect(compressor);
  compressor.connect(audioContext.destination);

  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
    playTone(frequency, now + index * 0.045, 0.19, master, "triangle");
  });

  for (let index = 0; index < 8; index += 1) {
    const frequency = 1200 + Math.random() * 1800;
    playTone(frequency, now + 0.03 + Math.random() * 0.25, 0.08, master, "sine");
  }
}

function playTone(frequency, startTime, duration, destination, type) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.08, startTime + duration);

  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.34, startTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}
