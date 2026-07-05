// Single source of truth for the name database.
// Runs in the browser (sets window.NAME_DATABASE on load, ~30ms) and in Node
// (module.exports the array; see tools/generate-names.js for a static snapshot).
(function () {
  const targetCount = 5000;

  const seedNames = [
    "צ׳יצ׳ולינה הרדוף כהן",
    "בלולו חכימי",
    "חירגוזית מקסימוב",
    "מוש בן קוף",
    "אנאוולאבל שירזי",
    "מלרוזה",
    "לולבית מסילתי",
    "פיטואז חושינסקי",
    "זינה מלכת החורים",
    "גלי עטרת הפין",
    "עמה בתאלף חזן",
    "בתאל חזן",
    "תפוחית מסלבי",
    "שקמה דרגרי",
    "כוכבה אלמקייס",
    "פיסורה כץ",
    "פילאטיס לוי",
    "אביבה גרמשי",
    "מיכל הר אדם",
    "ליבת הר-שפי",
    "חיימ כהן",
    "חירגוזית בן אפשי",
    "כלבולה",
    "בת רימון",
    "טיטולית אבו שוקרי",
    "לסבית און קי",
    "תפוחית",
    // Dor's batch, 5.7.2026
    "פליצה מרביצה",
    "שקצת נימני",
    "מאריאן מחפוד",
    "מרנינה בורגושווילי",
    "מילאטיס פכשירים",
    "כוסאי חאריגאני",
    "מילעל רבי ברקאי",
    "מאטיה אבו ראמן",
    "אינפלשיה מרטיקובה",
    "אבינדב ברדיסלבה שירחן",
    "שירוזין מרגיזוע",
    "מרצילפת כהן",
    "מאור-ראבי זלמן קידר",
    "אתי - שלג מונטוגמרי",
  ];

  const firstNames = [
    "צ׳יצ׳ולינה", "בלולו", "חירגוזית", "מוש", "אנאוולאבל", "מלרוזה",
    "לולבית", "פיטואז", "זינה", "גלי", "עמה", "בתאל", "תפוחית", "שקמה",
    "כוכבה", "פיסורה", "פילאטיס", "אביבה", "מיכל", "ליבת", "חיימ",
    "כלבולה", "טיטולית", "רימונה", "שניצלה", "פחזנית", "מרמלדה",
    "קוקילידה", "צמרמורה", "במבהלה", "סוכרזית", "שבלולית", "פרפלינה",
    "נוצנוצה", "זיגזוגית", "קצפתה", "פונפונית", "גליטרינה", "שרביטה",
    "צ׳ופצ׳יקית", "בולבולית", "קיסמונית", "גוגלית", "ניילונית",
    "חביתולה", "לחמנינה", "מסטיקית", "צימוקלה", "פריזורה", "קונפטית",
    "שליכטה", "פלאפלית", "סמבוסקית", "זוזובה", "רוזלולה", "חמסיקה",
    "בלינצ׳סה", "טאבולה", "פודינגה", "פלטינה", "לוליקה", "שפכטלה",
    "סלסולה", "פאייטה", "קרמבולית", "אבטיחונה", "צנצנתה", "דובדבנית",
    "ברבורית", "גברתולה", "מושמושה", "פלומבה", "כפתורית", "שטרודלה",
    "בזוקהלה", "קוקוסית", "חצילינה", "מנגולדה", "טופיולה", "פפריקה",
    "מנגינה", "צלופחה", "ג׳חנונה", "קרואסונה", "פיצהלה", "פומלית",
    "סביחית", "עוגיפלצת", "מנגוסטינה", "פטלינה", "ברדקית", "קומקומית",
    "ספונג׳הלה", "גומיגמית", "פומפייה", "דיסקוטקה", "קלמנטינה",
    "שקשוקית",
    // Y2K pop
    "טמגוצ׳ית", "ביפרית", "דיסקמנית", "גלוסית", "סקראנצ׳ית",
    "פלטפורמה", "בלינגה", "פאשניסטה", "אקסטנשנה", "פדיקורה", "מניקורה",
    "סטרפלסית", "וולקמנית", "מילניומה", "מלוואחית", "קובנה", "פסטרמה",
    "חמוצית", "לימונענעית", "בריטנית", "היפהופית", "זוהרייה",
    // Dor-style: plausible-but-off first names
    "פליצה", "שקצת", "מאריאן", "מרנינה", "מילאטיס", "כוסאי", "מילעל",
    "מאטיה", "אבינדב", "שירוזין", "מרצילפת", "אתי", "מאור", "שלג",
    // Dor-style: concepts as first names
    "אינפלשיה", "מוטיבציה", "פרובוקציה", "אינטואיציה", "אינרציה",
    "סובסידיה",
  ];

  const openers = [
    "צ׳י", "צ׳ו", "בלו", "בלי", "חי", "חי׳ר", "מו", "מוש", "אנה", "וולה",
    "מל", "רוז", "לולי", "פיט", "זי", "גלי", "עמה", "בת", "תפו", "שק",
    "כוכ", "פיס", "פיל", "אבי", "מיכ", "ליב", "כלב", "טיט", "במב", "פחז",
    "גליט", "פונ", "קונ", "שני", "מרמ", "סוכר", "צמר", "שבל", "פרפ",
    "קצ", "שרב", "כפת", "פלא", "סמב", "שוקו", "טוטי", "פיצי", "בובה",
    "זהר",
  ];

  const middles = [
    "גוז", "לול", "רוז", "וואל", "חכמ", "מסל", "דרג", "קייס", "שוק",
    "פלט", "שפי", "רימ", "נוצ", "זוג", "פייט", "שניצ", "קוק", "מסט",
    "קרמ", "חציל", "פפר", "קומק", "צנצ", "סלס", "חמס", "טאב", "פוד",
    "שפכט", "פומפ", "גומ", "בלינג", "גלוס", "מוצי",
  ];

  const endings = [
    "ית", "ולה", "ינה", "וזה", "ושה", "וזית", "ונית", "לינה", "זולה",
    "ורה", "יקה", "ונה", "יתוש", "זית", "לולה", "בלה", "ופה", "אבלה",
    "ושקה", "נדרה", "שולה", "ילה", "צ׳יקה", "ינקה", "וטה", "אלה",
  ];

  const cutesyBases = ["לו", "קו", "בו", "זו", "מי", "פו", "גו", "טו", "צ׳י", "מוש", "פיץ", "בים"];

  const surnames = [
    "כהן", "חכימי", "מקסימוב", "שירזי", "מסילתי", "חושינסקי", "מסלבי",
    "דרגרי", "אלמקייס", "כץ", "לוי", "גרמשי", "הר אדם", "הר-שפי",
    "בן אפשי", "אבו שוקרי", "און קי", "הרדוף כהן", "ביטון", "אזולאי",
    "גולן", "שושני", "מלול", "פרץ", "דבש", "חלבי", "בובליל", "זמיר",
    "צרפתי", "סבג", "אוחנה", "טופז", "מזרחי", "ברדוגו", "אשכנזי",
    "שרעבי", "קורקוס", "קקון", "לוגסי", "אבוטבול", "צנעני", "פרג׳י",
    "זילבר", "קמחי", "מועלם", "דודו", "רוזנטל", "קוגל", "שלומוביץ׳",
    "חמסיקה", "בונבונית", "סוכרזדה", "פאייטוב", "גליטרמן", "נוצניצקי",
    "במבלוב", "מרמלדיאן", "קרמבולוב", "צ׳ופצ׳יק", "פומפיאן", "שפכטלוב",
    "קונפטינסקי", "קצפתוב", "קומקומי", "צנצנטי", "פודינגר", "פלאפלוב",
    "סמבוסקין", "שניצלר",
    // Y2K pop
    "גלוסמן", "טמגוצ׳יאן", "ביפרוב", "מילניומסקי", "פיצוצקי", "בלינגר",
    "דיסקוביץ׳", "סושינסקי", "זיגזגלר", "פונפונוב",
    // Dor-style: real-ish surnames with ethnic flavors
    "מרביצה", "נימני", "מחפוד", "בורגושווילי", "פכשירים", "חאריגאני",
    "ברקאי", "מרטיקובה", "שירחן", "מרגיזוע", "קידר", "מונטוגמרי",
    "ברדיסלבה",
  ];

  const relationNouns = [
    "קוף", "אפשי", "אלף", "רימון", "פופקורן", "נצנץ", "מסטיק", "פאייט",
    "שניצל", "צנצנת", "קומקום", "גומייה", "קרמבו", "פלאפל", "כפתור",
    "צימוק", "קונפטי", "שבלול", "פחזנית", "מרמלדה", "פומפייה", "שרביט",
    "סמבוסק", "טופי", "פודינג", "בזוקה", "קוקוס", "חמסה", "טמגוצ׳י",
    "ביפר", "דיסקמן", "גלוס", "סקראנצ׳י", "ג׳קוזי", "סושי", "מילניום",
    "בלינג", "זיגזג", "ראמן",
  ];

  const titles = [
    "מלכת", "נסיכת", "דוכסית", "רוזנת", "גברת", "קיסרית", "כוהנת",
    "עטרת", "מכשפת", "מפקדת", "שרית", "סגנית", "אלופת", "רבנית",
    "נשיאת", "שומרת", "מנהלת", "מדריכת", "כוכבת", "אלילת", "פיית",
    "שגרירת", "מיס",
  ];

  const realms = [
    "הנצנצים", "הפאייטים", "הקונפטי", "הכפתורים", "הפונפונים",
    "הצנצנות", "הפקקים", "הטושים", "המדבקות", "השרוכים", "הקומקומים",
    "הגומיות", "הקרמבואים", "הפחזניות", "המרמלדות", "החורים",
    "השבלולים", "הפלאפלים", "הסמבוסקים", "הטישו", "הברדק", "הסלסולים",
    "הקצפת", "הבזוקה", "הפלומבות", "הפריזורות", "הלק ג׳ל",
    "האקסטנשנים", "הבלינג", "הגלוס", "הסקראנצ׳ים", "הטמגוצ׳ים",
    "הביפרים", "הדיסקוטק", "המילניום", "הפדיקור", "הג׳קוזי",
    "הפיצוציות",
  ];

  const landscapes = [
    "אדם", "שפי", "פאייט", "קצפת", "נצנץ", "קומקום", "מרשמלו", "שניצל",
    "במבה", "שבלול", "צנצנת", "גומייה", "טופי", "כפתור", "קונפטי",
    "פודינג", "גלוס", "בלינג",
  ];

  const nicknames = [
    "הפצצה", "הפקצה", "הדיווה", "הנסיכה", "הבלונדה", "הפנתרה",
    "החתולה", "הטורנדו", "הגננת", "המניקוריסטית", "הבוסית", "המאמי",
    "הזוהרת", "הפצפונת",
  ];

  const honorifics = ["ד״ר", "עו״ד", "פרופ׳", "הרבנית", "די־ג׳יי"];

  const hyphenSeconds = ["לי", "ים", "שיר", "אור", "גל", "פז", "שוש", "ראבי", "שלג"];

  // Dor-style: unexpected middle names ("מילעל רבי ברקאי").
  const middleNames = ["רבי", "זלמן", "ברדיסלבה", "בת ציון"];

  // Dor-style: rhyming pairs ("פליצה מרביצה") — a first name and a
  // feminine-verb surname that share the same suffix.
  const rhymeFirstStems = ["פל", "של", "גל", "בל", "קר", "דל", "שפר", "מרנ"];
  const rhymeVerbStems = ["מרב", "מרג", "מפצ", "מצח", "מבר", "מקפ", "מרת"];
  const rhymeSuffixes = ["יצה", "יזה", "יקה", "ינה"];

  const patterns = [
    (rng) => `${pick(rng, firstNames)} ${pick(rng, surnames)}`,
    (rng) => `${pick(rng, firstNames)} ${pick(rng, surnames)}`,
    (rng) => `${inventFirst(rng)} ${pick(rng, surnames)}`,
    (rng) => `${inventFirst(rng)} ${pick(rng, surnames)}`,
    (rng) => `${pick(rng, firstNames)} ${inventSurname(rng)}`,
    (rng) => `${inventFirst(rng)} ${inventSurname(rng)}`,
    (rng) => `${pick(rng, firstNames)} בן ${pick(rng, relationNouns)}`,
    (rng) => `${pick(rng, firstNames)} בת ${pick(rng, relationNouns)}`,
    (rng) => `${inventFirst(rng)} בת ${pick(rng, relationNouns)}`,
    (rng) => `${pick(rng, firstNames)} אבו ${pick(rng, relationNouns)}`,
    (rng) => `${pick(rng, firstNames)} ${pick(rng, titles)} ${pick(rng, realms)}`,
    (rng) => `${pick(rng, firstNames)} ${pick(rng, titles)} ${pick(rng, realms)}`,
    (rng) => `${inventFirst(rng)} ${pick(rng, titles)} ${pick(rng, realms)}`,
    (rng) => `${pick(rng, firstNames)} הר ${pick(rng, landscapes)}`,
    (rng) => `${inventFirst(rng)} הר-${pick(rng, landscapes)}`,
    (rng) => `${pick(rng, firstNames)} ${pick(rng, surnames)} ${pick(rng, surnames)}`,
    (rng) => `${inventFirst(rng)}`,
    (rng) => `${inventFirst(rng)}`,
    (rng) => `${pick(rng, firstNames)} ״${pick(rng, nicknames)}״ ${pick(rng, surnames)}`,
    (rng) => `${inventFirst(rng)} ״${pick(rng, nicknames)}״ ${pick(rng, surnames)}`,
    (rng) => `${pick(rng, honorifics)} ${pick(rng, firstNames)} ${pick(rng, surnames)}`,
    (rng) => `${pick(rng, firstNames)}-${pick(rng, hyphenSeconds)} ${pick(rng, surnames)}`,
    (rng) => rhymingName(rng),
    (rng) => rhymingName(rng),
    (rng) => `${pick(rng, firstNames)} ${pick(rng, middleNames)} ${pick(rng, surnames)}`,
  ];

  // --- Hebrew flow helpers ---------------------------------------------

  const GERESH = "׳";
  const VOWELISH = new Set(["א", "ה", "ו", "י", "ע"]);
  const TO_SOFIT = { כ: "ך", מ: "ם", נ: "ן", פ: "ף", צ: "ץ" };
  const FROM_SOFIT = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };

  function letterUnits(word) {
    const units = [];

    for (const char of word) {
      if (char === GERESH && units.length > 0) {
        units[units.length - 1] += char;
      } else {
        units.push(char);
      }
    }

    return units;
  }

  function isVowelish(unit) {
    return VOWELISH.has(unit[0]);
  }

  function smoothJoin(a, b, rng) {
    if (!a) {
      return b;
    }

    const aUnits = letterUnits(a);
    const bUnits = letterUnits(b);

    if (aUnits[aUnits.length - 1] === bUnits[0]) {
      return a + bUnits.slice(1).join("");
    }

    let trailing = 0;
    for (let i = aUnits.length - 1; i >= 0 && !isVowelish(aUnits[i]); i -= 1) {
      trailing += 1;
    }

    let leading = 0;
    for (let i = 0; i < bUnits.length && !isVowelish(bUnits[i]); i += 1) {
      leading += 1;
    }

    if (trailing > 0 && leading > 0 && trailing + leading >= 3) {
      return a + (rng() < 0.65 ? "ו" : "י") + b;
    }

    return a + b;
  }

  function polishWord(word) {
    const units = letterUnits(word).map((unit, index, all) => {
      const base = unit[0];
      const tail = unit.slice(1);
      const isLast = index === all.length - 1;

      if (!isLast && FROM_SOFIT[base]) {
        return FROM_SOFIT[base] + tail;
      }

      if (isLast && TO_SOFIT[base]) {
        return TO_SOFIT[base] + tail;
      }

      return unit;
    });

    return units
      .join("")
      .replace(/(.)\1\1+/g, "$1$1")
      .replace(/הה/g, "ה")
      .replace(/יתית/g, "ית")
      .replace(/ולהולה/g, "ולה")
      .replace(/וו(?=ו)/g, "ו");
  }

  function polish(name) {
    return name
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .map((token) =>
        token
          .split("-")
          .map((segment) => (/[א-ת]/.test(segment) ? polishWord(segment) : segment))
          .join("-")
      )
      .join(" ");
  }

  function createRng(seed) {
    let state = seed >>> 0;

    return () => {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(rng, values) {
    return values[Math.floor(rng() * values.length)];
  }

  function inventFirst(rng) {
    const roll = rng();
    let name;

    if (roll < 0.2) {
      name = smoothJoin(pick(rng, openers), pick(rng, endings), rng);
    } else if (roll < 0.36) {
      const base = pick(rng, cutesyBases);
      const doubled = base + base;
      const ending = isVowelish(letterUnits(base).slice(-1)[0])
        ? pick(rng, ["לה", "נה", "קה", "צ׳יקה"])
        : pick(rng, ["ית", "ולה", "ינה"]);
      name = smoothJoin(doubled, ending, rng);
    } else {
      name = smoothJoin(
        smoothJoin(pick(rng, openers), pick(rng, middles), rng),
        pick(rng, endings),
        rng
      );
    }

    return polishWord(name);
  }

  function inventSurname(rng) {
    const surnameEndings = [
      "י", "וב", "סקי", "מן", "זדה", "יאן", "וביץ׳", "אל", "טי",
      // Dor-style flavors: Georgian, Slavic, and the mysterious ־וע.
      "שווילי", "ובה", "גאני", "וע",
    ];
    const name = smoothJoin(pick(rng, middles), pick(rng, surnameEndings), rng);
    return polishWord(name);
  }

  // "פליצה מרביצה", "בליזה מרגיזה" — first and surname share a suffix.
  function rhymingName(rng) {
    const suffix = pick(rng, rhymeSuffixes);
    const first = polish(smoothJoin(pick(rng, rhymeFirstStems), suffix, rng));
    const surname = polish(smoothJoin(pick(rng, rhymeVerbStems), suffix, rng));
    return `${first} ${surname}`;
  }

  function buildNames() {
    const rng = createRng(0x2a2026);
    const names = new Set(seedNames);

    while (names.size < targetCount) {
      const pattern = pick(rng, patterns);
      names.add(polish(pattern(rng)));
    }

    return Array.from(names).slice(0, targetCount);
  }

  const NAME_DATABASE = buildNames();

  if (typeof window !== "undefined") {
    window.NAME_DATABASE = NAME_DATABASE;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = NAME_DATABASE;
  }
})();
