const names = window.NAME_DATABASE ?? ["תפוחית"];

const nameElement = document.querySelector("#generated-name");
const button = document.querySelector("#generate-button");
const sparkleLayer = document.querySelector("#sparkle-layer");
const rainbowCursor = document.querySelector("#rainbow-cursor");
const themeToggle = document.querySelector("#theme-toggle");
const saveButton = document.querySelector("#save-button");
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

saveButton.addEventListener("click", async () => {
  if (saveButton.dataset.busy === "true") {
    return;
  }

  const name = nameElement.textContent;
  const theme = themesOn ? pickTheme(name) : null;
  const originalLabel = saveButton.textContent;

  saveButton.dataset.busy = "true";
  saveButton.textContent = "💾 רגע...";

  try {
    const canvas = await renderNameCard(name, theme);
    await downloadCanvas(canvas, name);
    saveButton.textContent = "💾 נשמר!!";
  } catch (error) {
    saveButton.textContent = "💾 אופס";
  }

  window.setTimeout(() => {
    saveButton.textContent = originalLabel;
    saveButton.dataset.busy = "false";
  }, 1400);
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

// --- 1:1 image capture ------------------------------------------------------

const CARD_SIZE = 1080;

async function renderNameCard(name, theme) {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_SIZE;
  canvas.height = CARD_SIZE;

  const ctx = canvas.getContext("2d");
  const rand = createSeededRandom(hashText(name));

  const themeImage = theme ? await loadThemeImage(theme.id) : null;

  if (themeImage) {
    drawImageCover(ctx, themeImage);
  } else if (theme) {
    drawThemeBackground(ctx, theme.id, rand);
  } else {
    drawDefaultBackground(ctx, rand);
  }

  drawShimmerDots(ctx, rand);
  drawSparkleStars(ctx, rand);
  drawNameText(ctx, name);

  if (theme) {
    drawVibePill(ctx, `${theme.emoji} וייב: ${theme.label}`);
  }

  return canvas;
}

function downloadCanvas(canvas, name) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("toBlob failed"));
        return;
      }

      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.href = url;
      link.download = `${name.replace(/[\\/:*?"<>|]/g, "")}.png`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      resolve();
    }, "image/png");
  });
}

function hashText(text) {
  let hash = 0;

  for (const char of text) {
    hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  }

  return hash;
}

function createSeededRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function loadThemeImage(themeId) {
  return new Promise((resolve) => {
    const image = new Image();
    const timer = window.setTimeout(() => resolve(null), 1500);

    image.onload = () => {
      window.clearTimeout(timer);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    image.src = `backgrounds/${themeId}.jpg`;
  });
}

function drawImageCover(ctx, image) {
  const scale = Math.max(CARD_SIZE / image.width, CARD_SIZE / image.height);
  const width = image.width * scale;
  const height = image.height * scale;

  ctx.drawImage(image, (CARD_SIZE - width) / 2, (CARD_SIZE - height) / 2, width, height);
}

function diagonalGradient(ctx, stops) {
  const gradient = ctx.createLinearGradient(0, 0, CARD_SIZE, CARD_SIZE);

  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);
}

function drawDefaultBackground(ctx, rand) {
  diagonalGradient(ctx, [
    [0, "#ff5fb8"],
    [0.34, "#ff8ccc"],
    [0.68, "#ffc1e4"],
    [1, "#ff63b8"],
  ]);

  const gloss = ctx.createRadialGradient(
    CARD_SIZE * 0.72,
    CARD_SIZE * 0.24,
    0,
    CARD_SIZE * 0.72,
    CARD_SIZE * 0.24,
    CARD_SIZE * 0.7
  );

  gloss.addColorStop(0, "rgba(255,255,255,0.4)");
  gloss.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gloss;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);
}

function drawThemeBackground(ctx, themeId, rand) {
  const painters = {
    glitter: drawGlitterBackground,
    sequins: drawSequinsBackground,
    leopard: drawLeopardBackground,
    zebra: drawZebraBackground,
    cow: drawCowBackground,
    bubblegum: drawBubblegumBackground,
    choco: drawChocoBackground,
    fruity: drawFruityBackground,
    holo: drawHoloBackground,
    denim: drawDenimBackground,
    disco: drawDiscoBackground,
  };

  (painters[themeId] || drawDefaultBackground)(ctx, rand);
}

function drawGlitterBackground(ctx, rand) {
  diagonalGradient(ctx, [
    [0, "#ff2f9c"],
    [0.52, "#ff77c8"],
    [1, "#ff3fa4"],
  ]);

  const colors = ["rgba(255,255,255,0.95)", "rgba(255,232,120,0.9)", "rgba(150,0,80,0.55)"];

  for (let index = 0; index < 1050; index += 1) {
    ctx.fillStyle = colors[index % colors.length];
    ctx.globalAlpha = 0.35 + rand() * 0.65;
    ctx.beginPath();
    ctx.arc(rand() * CARD_SIZE, rand() * CARD_SIZE, 1 + rand() * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function drawSequinsBackground(ctx) {
  ctx.fillStyle = "#ff8fcf";
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  const step = 42;

  for (let row = 0; row * step < CARD_SIZE + step; row += 1) {
    for (let col = 0; col * step < CARD_SIZE + step; col += 1) {
      const x = col * step + (row % 2 === 1 ? step / 2 : 0);
      const y = row * step;
      const gold = (row + col) % 2 === 0;

      ctx.fillStyle = gold ? "#d98a00" : "#d1447f";
      ctx.beginPath();
      ctx.arc(x, y, 19, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = gold ? "#ffd23e" : "#ff9dd6";
      ctx.beginPath();
      ctx.arc(x, y, 15.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.beginPath();
      ctx.arc(x - 5, y - 5.5, 4.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawLeopardBackground(ctx, rand) {
  ctx.fillStyle = "#eec27c";
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  const stepX = 150;
  const stepY = 135;

  for (let row = -1; row * stepY < CARD_SIZE + stepY; row += 1) {
    for (let col = -1; col * stepX < CARD_SIZE + stepX; col += 1) {
      const x = col * stepX + (row % 2 === 0 ? 0 : stepX / 2) + (rand() - 0.5) * 34;
      const y = row * stepY + (rand() - 0.5) * 30;
      const radius = 26 + rand() * 12;

      ctx.fillStyle = rand() < 0.5 ? "#c98a33" : "#b5762a";
      ctx.beginPath();
      ctx.ellipse(x, y, radius, radius * 0.82, rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#3d1f0a";
      ctx.lineWidth = 9 + rand() * 5;
      ctx.lineCap = "round";

      const segments = 2 + Math.floor(rand() * 2);
      let angle = rand() * Math.PI * 2;

      for (let segment = 0; segment < segments; segment += 1) {
        const sweep = 0.9 + rand() * 1.4;

        ctx.beginPath();
        ctx.arc(x, y, radius + 12, angle, angle + sweep);
        ctx.stroke();
        angle += sweep + 0.55 + rand() * 0.8;
      }
    }
  }
}

function drawZebraBackground(ctx) {
  ctx.fillStyle = "#ffd9ee";
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  ctx.save();
  ctx.translate(CARD_SIZE / 2, CARD_SIZE / 2);
  ctx.rotate((-62 * Math.PI) / 180);
  ctx.fillStyle = "#ff2f9c";

  for (let x = -1200; x < 1200; x += 64) {
    ctx.fillRect(x, -1200, 32, 2400);
  }

  ctx.restore();
}

function drawCowBackground(ctx) {
  ctx.fillStyle = "#fff3fa";
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  const patches = [
    [0.18, 0.22, 95, 70],
    [0.78, 0.12, 120, 85],
    [0.45, 0.58, 105, 78],
    [0.9, 0.66, 90, 110],
    [0.12, 0.88, 130, 80],
    [0.62, 0.94, 85, 65],
    [0.55, 0.03, 80, 55],
    [0.03, 0.5, 75, 90],
  ];

  ctx.fillStyle = "#f0449d";
  patches.forEach(([px, py, rx, ry]) => {
    ctx.beginPath();
    ctx.ellipse(px * CARD_SIZE, py * CARD_SIZE, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBubblegumBackground(ctx) {
  ctx.fillStyle = "#ff8fd0";
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  const step = 108;

  for (let row = 0; row * step < CARD_SIZE + step; row += 1) {
    for (let col = 0; col * step < CARD_SIZE + step; col += 1) {
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.beginPath();
      ctx.arc(col * step, row * step, 23, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255,225,242,0.85)";
      ctx.beginPath();
      ctx.arc(col * step + step / 2, row * step + step / 2, 17, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawChocoBackground(ctx) {
  diagonalGradient(ctx, [
    [0, "#6b3a1d"],
    [1, "#4a2410"],
  ]);

  const bigStep = 132;
  ctx.fillStyle = "rgba(122,66,34,0.85)";

  for (let row = 0; row * bigStep < CARD_SIZE + bigStep; row += 1) {
    for (let col = 0; col * bigStep < CARD_SIZE + bigStep; col += 1) {
      ctx.beginPath();
      ctx.arc(col * bigStep, row * bigStep, 36, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const smallStep = 88;
  ctx.fillStyle = "rgba(255,244,230,0.92)";

  for (let row = 0; row * smallStep < CARD_SIZE + smallStep; row += 1) {
    for (let col = 0; col * smallStep < CARD_SIZE + smallStep; col += 1) {
      ctx.beginPath();
      ctx.arc(col * smallStep + 26, row * smallStep + 34, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawFruityBackground(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, 0, CARD_SIZE);
  gradient.addColorStop(0, "#ff6f8e");
  gradient.addColorStop(0.76, "#ff5f7e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  ctx.fillStyle = "#2e1206";

  const stepX = 76;
  const stepY = 88;

  for (let row = 0; row * stepY < CARD_SIZE * 0.72; row += 1) {
    for (let col = 0; col * stepX < CARD_SIZE + stepX; col += 1) {
      const x = col * stepX + (row % 2 === 1 ? stepX / 2 : 0);
      const y = 40 + row * stepY;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(row % 2 === 0 ? 0.28 : -0.24);
      ctx.beginPath();
      ctx.ellipse(0, 0, 5.5, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.fillStyle = "#ffe1e8";
  ctx.fillRect(0, CARD_SIZE * 0.8, CARD_SIZE, CARD_SIZE * 0.045);
  ctx.fillStyle = "#2f9e44";
  ctx.fillRect(0, CARD_SIZE * 0.845, CARD_SIZE, CARD_SIZE * 0.155);
  ctx.fillStyle = "rgba(20,110,45,0.5)";

  for (let x = 0; x < CARD_SIZE; x += 96) {
    ctx.fillRect(x, CARD_SIZE * 0.845, 34, CARD_SIZE * 0.155);
  }
}

function drawHoloBackground(ctx) {
  diagonalGradient(ctx, [
    [0, "#ffb6ff"],
    [0.22, "#b8e6ff"],
    [0.45, "#c9ffe0"],
    [0.68, "#fff6b8"],
    [1, "#ffb6d9"],
  ]);
}

function drawDenimBackground(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, 0, CARD_SIZE);
  gradient.addColorStop(0, "#4a77c4");
  gradient.addColorStop(1, "#2c4e8c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  const weave = (angleDeg, color, gap) => {
    ctx.save();
    ctx.translate(CARD_SIZE / 2, CARD_SIZE / 2);
    ctx.rotate((angleDeg * Math.PI) / 180);
    ctx.fillStyle = color;

    for (let x = -1200; x < 1200; x += gap) {
      ctx.fillRect(x, -1200, 2, 2400);
    }

    ctx.restore();
  };

  weave(48, "rgba(255,255,255,0.09)", 6);
  weave(-42, "rgba(16,34,70,0.4)", 7);
}

function drawDiscoBackground(ctx) {
  const centerX = CARD_SIZE / 2;
  const centerY = CARD_SIZE * 0.4;
  const wedge = (12 * Math.PI) / 180;

  for (let index = 0; index < 30; index += 1) {
    ctx.fillStyle = index % 2 === 0 ? "#ffd9f2" : "#ff64bb";
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, 1700, index * wedge, (index + 1) * wedge);
    ctx.closePath();
    ctx.fill();
  }

  const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 260);
  glow.addColorStop(0, "rgba(255,255,255,0.92)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);
}

function drawShimmerDots(ctx, rand) {
  ctx.save();

  for (let index = 0; index < 90; index += 1) {
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.12 + rand() * 0.3;
    ctx.beginPath();
    ctx.arc(rand() * CARD_SIZE, rand() * CARD_SIZE, 1 + rand() * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawStar(ctx, x, y, outerRadius, rotation, color, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();

  const innerRadius = outerRadius * 0.36;

  for (let point = 0; point < 8; point += 1) {
    const radius = point % 2 === 0 ? outerRadius : innerRadius;
    const angle = (point * Math.PI) / 4 - Math.PI / 2;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;

    if (point === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSparkleStars(ctx, rand) {
  const colors = ["#ffffff", "#ffe878", "#ffd9f2"];

  for (let index = 0; index < 14; index += 1) {
    const x = 40 + rand() * (CARD_SIZE - 80);
    const y = 40 + rand() * (CARD_SIZE - 80);

    if (x > 150 && x < CARD_SIZE - 150 && y > 330 && y < 760) {
      continue; // keep the name area clean
    }

    drawStar(ctx, x, y, 9 + rand() * 20, rand() * Math.PI, colors[index % colors.length], 0.5 + rand() * 0.5);
  }
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let current = "";

  words.forEach((word) => {
    const candidate = current === "" ? word : `${current} ${word}`;

    if (ctx.measureText(candidate).width <= maxWidth || current === "") {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  });

  if (current !== "") {
    lines.push(current);
  }

  return lines;
}

function drawNameText(ctx, name) {
  const maxWidth = 920;
  let fontSize = 150;
  let lines = [name];

  while (fontSize > 54) {
    ctx.font = `900 ${fontSize}px Arial, "Segoe UI", sans-serif`;
    lines = wrapText(ctx, name, maxWidth);

    const blockHeight = lines.length * fontSize * 1.08;
    const widthOk = lines.every((line) => ctx.measureText(line).width <= maxWidth);

    if (blockHeight <= 560 && widthOk) {
      break;
    }

    fontSize -= 8;
  }

  ctx.save();
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${fontSize}px Arial, "Segoe UI", sans-serif`;

  const lineHeight = fontSize * 1.08;
  const startY = CARD_SIZE / 2 - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, index) => {
    const y = startY + index * lineHeight;

    ctx.shadowColor = "rgba(63,5,41,0.55)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(line, CARD_SIZE / 2, y);

    ctx.shadowColor = "rgba(255,255,255,0.9)";
    ctx.shadowBlur = 42;
    ctx.shadowOffsetY = 0;
    ctx.fillText(line, CARD_SIZE / 2, y);

    ctx.shadowColor = "rgba(255,173,221,0.95)";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 3;
    ctx.fillText(line, CARD_SIZE / 2, y);
  });

  ctx.restore();
}

function tracePill(ctx, x, y, width, height) {
  const radius = height / 2;

  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arc(x + width - radius, y + radius, radius, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(x + radius, y + height);
  ctx.arc(x + radius, y + radius, radius, Math.PI / 2, (3 * Math.PI) / 2);
  ctx.closePath();
}

function drawVibePill(ctx, label) {
  ctx.save();
  ctx.direction = "rtl";
  ctx.font = "700 34px Arial, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const textWidth = ctx.measureText(label).width;
  const pillWidth = textWidth + 76;
  const pillHeight = 64;
  const x = (CARD_SIZE - pillWidth) / 2;
  const y = CARD_SIZE - 118;

  ctx.shadowColor = "rgba(164,21,101,0.3)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  tracePill(ctx, x, y, pillWidth, pillHeight);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = "#d61d86";
  ctx.fillText(label, CARD_SIZE / 2, y + pillHeight / 2 + 2);
  ctx.restore();
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
