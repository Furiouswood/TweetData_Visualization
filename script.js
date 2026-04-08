const chartGrid = document.getElementById("chart-grid");
const chartPanel = document.querySelector(".chart-panel");
const stoneFlightLayer = document.getElementById("stone-flight-layer");
const commentStream = document.getElementById("comment-stream");
const pondContainer = document.getElementById("pond-container");
const pondSplashLayer = document.getElementById("pond-splash-layer");
const contentWarning = document.getElementById("content-warning");
const uiAnnouncer = document.getElementById("ui-announcer");
const totalComments = document.getElementById("total-comments");
const multipleTargets = document.getElementById("multiple-targets");
const commentTotal = document.getElementById("comment-total");
const chartNote = document.getElementById("chart-note");
const drillDownHeader = document.getElementById("drill-down-header");
const drillDownTitle = document.getElementById("drill-down-title");
const backButton = document.getElementById("back-button");
const STONE_IMAGE_PATH = "./stone.png";
const COMMENT_DATA_PATH = "./data/category_comments.json";
const COUNT_DATA_PATH = "./data/category_counts.json";

const APP_VIEWS = {
  OVERVIEW: "overview",
  BREAKDOWN: "breakdown",
  POND: "pond",
};

const poemStanzaText = document.getElementById("poem-stanza-text");
const poemDotsEl = document.getElementById("poem-dots");
const poemHint = document.getElementById("poem-hint");
const poemExpandBtn = document.getElementById("poem-expand-btn");

const POEM_STANZA_LINES = [
  ["A tweet is a pebble \u2014", "tiny enough to toss,", "light enough to deny.", "But the river remembers every stone,", "and the data shows how the ripples multiply."],
  ["In the dataset, we call it a label:", "gender, religion, ethnicity, age.", "In real life, it is a person", "refreshing a screen", "like a pulse checking itself."],
  ["There are the obvious knives,", "and the \u201cjokes\u201d engineered to bruise.", "We clean the text,", "strip the links,", "remove the noise \u2014", "but the meaning stays in the wounds."],
  ["Because harm is scalable \u2014", "one post becomes a noise,", "then a crowd.", "The spreadsheet calls it \u201cnormal,\u201d", "as if silence isn\u2019t a choice after all."],
  ["A report button is a pixel,", "a plea,", "a question the chart can\u2019t fully hold:", "Will we call this \u201ccontent,\u201d", "or will we call it harm", "before it settles into stone?"],
];

const POEM_REVEAL_COUNT = {
  [APP_VIEWS.OVERVIEW]: 1,
  [APP_VIEWS.BREAKDOWN]: 3,
  [APP_VIEWS.POND]: 5,
};

const numberFormatter = new Intl.NumberFormat("en-US");
const STONE_UNIT = 1000;
const STONE_HEIGHT = 58;
const STONE_GAP = 10;
const CHART_WIDTH = 1080;
const CHART_HEIGHT = 760;
const MARGIN = { top: 52, right: 36, bottom: 126, left: 84 };
const STONE_WIDTHS = [0.9, 0.8, 0.88, 0.78, 0.92, 0.84, 0.86, 0.8];
const MAX_STREAM_COMMENTS = 14;
const STONE_THROW_STEP_DELAY = 70;
const STONE_THROW_DURATION = 900;
const SPLASH_SETTLE_DELAY = 480;

let chartData = null;
let categoryComments = window.HATEXPLAIN_CATEGORY_COMMENTS || null;
let commentDataPromise = null;
let commentDataError = null;
let stoneThrowRunId = 0;
let announcementFrame = null;
let poemMaxRevealed = 0;
let poemCurrentIndex = 0;
let appState = {
  view: APP_VIEWS.OVERVIEW,
  activeCategory: null,
  activeSubcategory: null,
};

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function formatNumber(value) {
  return numberFormatter.format(value);
}

function splitLabel(label) {
  return label.split(" ");
}

function truncateComment(text, maxLength = 100) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3).trimEnd()}...`;
}

const SENSITIVE_WORDS_REGEX = new RegExp(
  "\\b(" +
    [
      // Anti-Black slurs
      "nigger", "niggers", "nigga", "niggas", "negro", "negroes",
      "coon", "coons", "jigaboo", "jigaboos", "spook", "spooks",
      "sambo", "sambos", "porch monkey", "porch monkeys",
      "dindu", "dindus", "darky", "darkie", "darkies",
      "jungle bunny", "jungle bunnies", "junglebunny",
      "mud shark", "mud sharks", "mudshark",
      // Anti-Arab / anti-Muslim / anti-South Asian slurs
      "raghead", "ragheads", "towelhead", "towelheads",
      "sandnigger", "sandniggers", "sand nigger", "sand niggers",
      "camel jockey", "camel jockeys", "goatfucker", "goatfuckers",
      "muzzie", "muzzies", "muzzy",
      "paki", "pakis",
      "curry nigger", "curry niggers",
      "kuffar",
      // Anti-Jewish slurs
      "kike", "kikes", "heeb", "heebs", "yid", "yids", "hymie", "hymies",
      // Anti-Hispanic slurs
      "spic", "spics", "spick", "spicks", "wetback", "wetbacks",
      "beaner", "beaners",
      // Anti-Asian slurs
      "chink", "chinks", "gook", "gooks", "zipperhead", "zipperheads",
      "ching chong", "ching chongs",
      // Anti-Indigenous slurs
      "redskin", "redskins", "injun", "injuns", "squaw", "squaws",
      // Anti-white slurs
      "cracker", "crackers", "white trash", "trailer trash",
      // Homophobic / transphobic slurs
      "faggot", "faggots", "faggotry",
      "fag", "fags", "dyke", "dykes",
      "tranny", "trannies", "homo", "homos",
      "queer", "queers",
      // Misogynistic slurs
      "cunt", "cunts", "whore", "whores", "slut", "sluts",
      "bitch", "bitches", "skank", "skanks",
      "hooker", "hookers", "pussy",
      // Ableist slurs
      "retard", "retards", "retarded",
      // General profanity
      "fuck", "fucks", "fucker", "fuckers", "fucking", "fucked",
      "shit", "shits", "shitty", "shitskin", "shitskins",
      "asshole", "assholes", "bastard", "bastards",
      // Sexual / explicit terms
      "dick", "dicks", "cock", "cocks",
      "penis", "penises", "vagina", "vaginas",
      "cum", "cumming", "cumshot",
      "blowjob", "blowjobs", "blow job", "blow jobs",
      "handjob", "handjobs", "hand job", "hand jobs",
      "porn", "porno", "pornography",
      "rape", "rapes", "raped", "raping", "rapist", "rapists",
      "molest", "molested", "molesting", "molester",
      "masturbate", "masturbating", "masturbation",
    ]
      .map((word) => word.replace(/\s+/g, "\\s+"))
      .join("|") +
    ")\\b",
  "gi"
);

function censorWord(word) {
  return word.length <= 1 ? word : word[0] + "*".repeat(word.length - 1);
}

function censorComment(text) {
  return text.replace(SENSITIVE_WORDS_REGEX, (match) =>
    match.split(/(\s+)/).map((token) => (/\s/.test(token) ? token : censorWord(token))).join("")
  );
}

function createSeededRandom(seedText) {
  let seed = 0;

  for (let index = 0; index < seedText.length; index += 1) {
    seed = (seed * 31 + seedText.charCodeAt(index)) >>> 0;
  }

  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

function fetchJson(path) {
  return fetch(path).then((response) => {
    if (!response.ok) {
      throw new Error(`Could not load ${path}.`);
    }

    return response.json();
  });
}

function renderError(message) {
  chartGrid.innerHTML = `<p class="is-error">${message}</p>`;
  commentTotal.textContent = "Data unavailable";
  hideDrillDownHeader();
  setPondState({
    title: "Data unavailable",
    status: "The chart data could not be loaded.",
    isActive: false,
    isError: true,
  });
  stopCommentStream();
  stopStoneThrow();
  setContentWarningVisible(false);
  announceUiState("Chart data unavailable.");
}

function showDrillDownHeader(title, backLabel) {
  if (!drillDownHeader || !drillDownTitle || !backButton) {
    return;
  }

  drillDownHeader.setAttribute("aria-hidden", "false");
  drillDownTitle.textContent = title;
  backButton.textContent = `← ${backLabel}`;
  backButton.setAttribute("aria-label", backLabel);
  drillDownHeader.classList.add("drill-down-bar--visible");
}

function hideDrillDownHeader() {
  if (!drillDownHeader) {
    return;
  }

  drillDownHeader.setAttribute("aria-hidden", "true");
  drillDownHeader.classList.remove("drill-down-bar--visible");
}

function setPondState({ title, status, isActive, isError = false }) {
  if (!pondContainer) {
    return;
  }

  pondContainer.classList.toggle("pond-container--visible", isActive);
  pondContainer.classList.remove("pond-container--landing");
  pondContainer.setAttribute("aria-hidden", isActive ? "false" : "true");
  pondContainer.setAttribute("aria-label", title || status || "Pond view");
  pondContainer.dataset.state = isError ? "error" : "default";
}

function setContentWarningVisible(isVisible) {
  if (!contentWarning) {
    return;
  }

  contentWarning.hidden = !isVisible;
}

function announceUiState(message) {
  if (!uiAnnouncer) {
    return;
  }

  if (announcementFrame) {
    window.clearTimeout(announcementFrame);
  }

  uiAnnouncer.textContent = "";
  announcementFrame = window.setTimeout(() => {
    uiAnnouncer.textContent = message;
  }, 30);
}

function getCategoryByLabel(label) {
  return chartData?.categories?.find((category) => category.label === label) || null;
}

function updateMetaText() {
  if (!chartData) {
    return;
  }

  totalComments.textContent = formatNumber(chartData.totalComments);
  multipleTargets.textContent = formatNumber(chartData.commentsWithMultipleTargets);

  if (appState.view === APP_VIEWS.OVERVIEW) {
    commentTotal.textContent = `${formatNumber(chartData.totalComments)} rows processed`;
    chartNote.textContent =
      `One comment can contribute to more than one bar because the dataset allows multiple target types per comment. ` +
      `This SVG chart is drawn with D3, and each stone image represents ${formatNumber(STONE_UNIT)} comments.`;
    return;
  }

  if (appState.view === APP_VIEWS.BREAKDOWN && appState.activeCategory) {
    commentTotal.textContent = `${appState.activeCategory.label} breakdown`;
    chartNote.textContent =
      `Distribution within the ${appState.activeCategory.label} category. ` +
      `Each stone represents ${formatNumber(STONE_UNIT)} comments. Click a subcategory to activate the pond and D3 comment stream.`;
    return;
  }

  if (appState.view === APP_VIEWS.POND && appState.activeSubcategory) {
    const sampleCount = categoryComments?.[appState.activeSubcategory.label]?.length || 0;
    commentTotal.textContent =
      sampleCount > 0 ? `${formatNumber(sampleCount)} sampled comments` : "Pond active";
    chartNote.textContent =
      `The chart stays visible while D3 animates sampled ${appState.activeSubcategory.label} comments across the panel from left to right.`;
  }
}

function addWrappedLabel(selection, label, x, y) {
  const lines = splitLabel(label);
  const text = selection
    .append("text")
    .attr("class", "category-label")
    .attr("x", x)
    .attr("y", y)
    .attr("text-anchor", "middle");

  lines.forEach((line, index) => {
    text
      .append("tspan")
      .attr("x", x)
      .attr("dy", index === 0 ? 0 : 18)
      .text(line);
  });
}

function renderChart(drillDown = null) {
  if (!window.d3) {
    renderError("D3 did not load. Connect to the internet and reload the page.");
    return;
  }

  const d3 = window.d3;
  const isBreakdown = Boolean(drillDown && drillDown.breakdown && drillDown.breakdown.length > 0);
  const categories = isBreakdown
    ? [...drillDown.breakdown].sort((a, b) => b.count - a.count)
    : [...chartData.categories].sort((a, b) => b.count - a.count);
  const maxCount = d3.max(categories, (category) => category.count) || STONE_UNIT;
  const yMax = Math.max(STONE_UNIT, Math.ceil(maxCount / STONE_UNIT) * STONE_UNIT);
  const chartLeft = MARGIN.left;
  const chartRight = CHART_WIDTH - MARGIN.right;
  const chartTop = MARGIN.top + 88;
  const chartBottom = CHART_HEIGHT - MARGIN.bottom;

  const x = d3
    .scaleBand()
    .domain(categories.map((category) => category.label))
    .range([chartLeft, chartRight])
    .paddingInner(0.24)
    .paddingOuter(0.14);

  const y = d3.scaleLinear().domain([0, yMax]).range([chartBottom, chartTop]);

  chartGrid.innerHTML = "";

  const svg = d3
    .select(chartGrid)
    .append("svg")
    .attr("class", "chart-svg")
    .attr("width", CHART_WIDTH)
    .attr("height", CHART_HEIGHT)
    .attr("viewBox", `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr(
      "aria-label",
      isBreakdown
        ? `Distribution breakdown for ${drillDown.label}. Click a subcategory bar to activate the pond and streaming comments.`
        : "Vertical D3 bar chart of HateXplain category counts, using stacked stone images where each stone represents one thousand comments. Click a category to see its distribution."
    );

  const defs = svg.append("defs");
  svg
    .append("rect")
    .attr("class", "svg-backdrop")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", CHART_WIDTH)
    .attr("height", CHART_HEIGHT)
    .attr("rx", 30);
  const root = svg.append("g").attr("class", "chart-root");

  root
    .append("rect")
    .attr("class", "plot-shell")
    .attr("x", chartLeft - 18)
    .attr("y", chartTop - 26)
    .attr("width", chartRight - chartLeft + 36)
    .attr("height", chartBottom - chartTop + 42)
    .attr("rx", 28);

  const ticks = d3.range(0, yMax + STONE_UNIT, STONE_UNIT);

  root
    .append("g")
    .attr("class", "y-grid")
    .selectAll("line")
    .data(ticks)
    .enter()
    .append("line")
    .attr("x1", chartLeft)
    .attr("x2", chartRight)
    .attr("y1", (tick) => y(tick))
    .attr("y2", (tick) => y(tick));

  root
    .append("g")
    .attr("class", "y-axis-labels")
    .selectAll("text")
    .data(ticks)
    .enter()
    .append("text")
    .attr("class", "tick-label")
    .attr("x", chartLeft - 16)
    .attr("y", (tick) => y(tick) + 5)
    .attr("text-anchor", "end")
    .text((tick) => formatNumber(tick));

  root
    .append("text")
    .attr("class", "axis-title")
    .attr("x", chartLeft - 58)
    .attr("y", chartTop - 36)
    .text("Comments");

  root
    .append("line")
    .attr("class", "baseline")
    .attr("x1", chartLeft)
    .attr("x2", chartRight)
    .attr("y1", chartBottom)
    .attr("y2", chartBottom);

  const groups = root
    .selectAll(".bar-group")
    .data(categories, (category) => category.label)
    .enter()
    .append("g")
    .attr("class", "bar-group bar-group--clickable")
    .attr("transform", (category) => `translate(${x(category.label)},0)`)
    .attr("role", "button")
    .attr("tabindex", 0)
    .attr("aria-label", (category) =>
      isBreakdown
        ? `Activate the pond for ${category.label} comments`
        : `Click to see ${category.label} distribution`
    )
    .on("click", (event, category) => {
      if (isBreakdown) {
        openPond(category, event.currentTarget);
        return;
      }

      const nextCategory = getCategoryByLabel(category.label);
      if (nextCategory?.breakdown?.length) {
        openBreakdown(nextCategory);
      }
    })
    .on("keydown", (event, category) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();

      if (isBreakdown) {
        openPond(category, event.currentTarget);
        return;
      }

      const nextCategory = getCategoryByLabel(category.label);
      if (nextCategory?.breakdown?.length) {
        openBreakdown(nextCategory);
      }
    });

  groups
    .append("text")
    .attr("class", "value-label")
    .attr("x", x.bandwidth() / 2)
    .attr("y", chartTop - 58)
    .attr("text-anchor", "middle")
    .text((category) => formatNumber(category.count));

  groups
    .append("text")
    .attr("class", "value-sublabel")
    .attr("x", x.bandwidth() / 2)
    .attr("y", chartTop - 34)
    .attr("text-anchor", "middle")
    .text("comments");

  groups
    .append("rect")
    .attr("class", "bar-lane")
    .attr("x", x.bandwidth() * 0.11)
    .attr("y", chartTop - 8)
    .attr("width", x.bandwidth() * 0.78)
    .attr("height", chartBottom - chartTop + 16)
    .attr("rx", 28);

  groups.each(function renderStones(category, groupIndex) {
    const laneWidth = x.bandwidth() * 0.78;
    const centerX = x.bandwidth() / 2;
    const fullStones = Math.floor(category.count / STONE_UNIT);
    const remainder = category.count % STONE_UNIT;
    const totalStones = fullStones + (remainder > 0 ? 1 : 0);
    const group = d3.select(this);

    for (let index = 0; index < totalStones; index += 1) {
      const isPartialStone = remainder > 0 && index === totalStones - 1;
      const fillRatio = isPartialStone ? remainder / STONE_UNIT : 1;
      const stoneWidth = laneWidth * STONE_WIDTHS[index % STONE_WIDTHS.length];
      const stoneX = centerX - stoneWidth / 2;
      const stoneY = chartBottom - STONE_HEIGHT - index * (STONE_HEIGHT + STONE_GAP) - 8;
      const clipId = `stone-clip-${groupIndex}-${index}-${category.label.replace(/\s+/g, "-")}`;

      defs
        .append("clipPath")
        .attr("id", clipId)
        .attr("clipPathUnits", "userSpaceOnUse")
        .append("rect")
        .attr("x", stoneX)
        .attr("y", stoneY + STONE_HEIGHT * (1 - fillRatio))
        .attr("width", stoneWidth)
        .attr("height", STONE_HEIGHT * fillRatio);

      const stoneGroup = group
        .append("g")
        .attr("class", "stone-node")
        .attr("transform", "translate(0, 14)")
        .attr("opacity", 0);

      stoneGroup
        .append("ellipse")
        .attr("class", "stone-shadow")
        .attr("cx", centerX)
        .attr("cy", stoneY + STONE_HEIGHT - 4)
        .attr("rx", stoneWidth * 0.27)
        .attr("ry", 7);

      stoneGroup
        .append("image")
        .attr("class", "stone-image")
        .attr("href", STONE_IMAGE_PATH)
        .attr("x", stoneX)
        .attr("y", stoneY)
        .attr("width", stoneWidth)
        .attr("height", STONE_HEIGHT)
        .attr("preserveAspectRatio", "xMidYMax meet")
        .attr("clip-path", `url(#${clipId})`);

      stoneGroup
        .transition()
        .delay(index * 75)
        .duration(480)
        .ease(d3.easeCubicOut)
        .attr("transform", "translate(0, 0)")
        .attr("opacity", 1);
    }

    group
      .append("title")
      .text(
        `${category.label}: ${formatNumber(category.count)} comments, or about ${totalStones} stones at ${formatNumber(STONE_UNIT)} comments per stone`
      );
  });

  groups.each(function addLabels(category) {
    addWrappedLabel(window.d3.select(this), category.label, x.bandwidth() / 2, chartBottom + 34);
  });

  updateMetaText();
}

function stopCommentStream() {
  if (!window.d3 || !commentStream) {
    return;
  }

  const d3 = window.d3;
  d3.select(commentStream).selectAll(".stream-comment").interrupt().remove();
}

function renderStaticCommentStream(subcategoryLabel) {
  if (!window.d3 || !commentStream || !categoryComments?.[subcategoryLabel]?.length) {
    return;
  }

  stopCommentStream();

  const comments = categoryComments[subcategoryLabel]
    .slice(0, 8)
    .map((text, index) => ({
      id: `${subcategoryLabel}-static-${index}`,
      text: truncateComment(censorComment(text), 86),
    }));

  const d3 = window.d3;
  const bounds = commentStream.getBoundingClientRect();
  const width = Math.max(bounds.width, 900);
  const height = Math.max(bounds.height, 760);
  const random = createSeededRandom(`${subcategoryLabel}-static-layout`);

  const selection = d3
    .select(commentStream)
    .selectAll(".stream-comment")
    .data(comments, (datum) => datum.id)
    .join("div")
    .attr("class", "stream-comment stream-comment--static")
    .text((datum) => datum.text)
    .style("opacity", 0.88);

  selection.each(function eachComment(_, index) {
    const left = 28 + (index / Math.max(1, comments.length - 1)) * (width - 330);
    const top = 36 + (index % 4) * 104 + random() * 18;
    d3.select(this)
      .style("left", `${left}px`)
      .style("top", `${Math.min(top, height - 90)}px`);
  });
}

function stopStoneThrow() {
  stoneThrowRunId += 1;

  if (!window.d3 || !stoneFlightLayer) {
    return;
  }

  window.d3.select(stoneFlightLayer).selectAll(".flying-stone").interrupt().remove();
  if (pondSplashLayer) {
    window.d3.select(pondSplashLayer).selectAll("*").interrupt().remove();
  }
  pondContainer?.classList.remove("pond-container--landing");
}

function pulsePondLanding(runId) {
  if (!pondContainer) {
    return;
  }

  pondContainer.classList.add("pond-container--landing");
  window.setTimeout(() => {
    if (runId === stoneThrowRunId) {
      pondContainer.classList.remove("pond-container--landing");
    }
  }, 420);
}

function createPondSplash(localX, localY, runId) {
  if (!window.d3 || !pondSplashLayer || !pondContainer) {
    return;
  }

  const d3 = window.d3;
  const pondRect = pondContainer.getBoundingClientRect();
  pondSplashLayer.setAttribute("viewBox", `0 0 ${pondRect.width} ${pondRect.height}`);

  const splash = d3
    .select(pondSplashLayer)
    .append("g")
    .attr("transform", `translate(${localX}, ${localY})`)
    .attr("opacity", 1);

  splash
    .append("circle")
    .attr("class", "splash-core")
    .attr("r", 4)
    .attr("opacity", 0.82)
    .transition()
    .duration(420)
    .ease(d3.easeCubicOut)
    .attr("r", 22)
    .attr("opacity", 0);

  [26, 48, 74, 102].forEach((radius, index) => {
    splash
      .append("circle")
      .attr("class", "splash-ring")
      .attr("r", 3)
      .attr("opacity", 0.88 - index * 0.12)
      .transition()
      .delay(index * 70)
      .duration(760)
      .ease(d3.easeCubicOut)
      .attr("r", radius)
      .attr("opacity", 0);
  });

  [-34, -20, -6, 10, 26, 40].forEach((offsetX, index) => {
    const droplet = splash
      .append("ellipse")
      .attr("class", "splash-droplet")
      .attr("cx", offsetX)
      .attr("cy", -6)
      .attr("rx", Math.max(2.4, 4.8 - index * 0.32))
      .attr("ry", Math.max(4.2, 8.8 - index * 0.48))
      .attr("opacity", 0.98);

    droplet
      .transition()
      .delay(55 + index * 28)
      .duration(560)
      .ease(d3.easeQuadOut)
      .attrTween("transform", () => {
        const driftX = offsetX * 0.75;
        const lift = 54 + Math.abs(offsetX) * 0.55 + index * 4;
        return (t) => {
          const travelX = driftX * t;
          const travelY = -4 * lift * t * (1 - t) - 22 * t;
          return `translate(${travelX}, ${travelY})`;
        };
      })
      .attr("opacity", 0.92)
      .transition()
      .duration(220)
      .attr("opacity", 0);
  });

  window.setTimeout(() => {
    if (runId === stoneThrowRunId) {
      splash.remove();
    } else {
      splash.remove();
    }
  }, 1180);
}

function throwStonesToPond(sourceGroup) {
  if (prefersReducedMotion()) {
    return Promise.resolve();
  }

  if (!window.d3 || !sourceGroup || !stoneFlightLayer || !chartPanel || !pondContainer) {
    return Promise.resolve();
  }

  stopStoneThrow();

  const runId = stoneThrowRunId;
  const d3 = window.d3;
  const panelRect = chartPanel.getBoundingClientRect();
  const pondRect = pondContainer.getBoundingClientRect();
  const targetBaseX = pondRect.left - panelRect.left + pondRect.width * 0.52;
  const targetBaseY = pondRect.top - panelRect.top + pondRect.height * 0.6;
  const pondLocalBaseX = pondRect.width * 0.52;
  const pondLocalBaseY = pondRect.height * 0.6;
  if (pondSplashLayer) {
    pondSplashLayer.setAttribute("viewBox", `0 0 ${pondRect.width} ${pondRect.height}`);
  }
  const stoneImages = Array.from(sourceGroup.querySelectorAll(".stone-image"));

  if (!stoneImages.length) {
    return Promise.resolve();
  }

  stoneImages.forEach((stoneNode, index) => {
    const rect = stoneNode.getBoundingClientRect();
    const startX = rect.left - panelRect.left;
    const startY = rect.top - panelRect.top;
    const startWidth = rect.width;
    const startHeight = rect.height;
    const spread = (index - (stoneImages.length - 1) / 2) * 12;
    const targetX = targetBaseX + spread - startWidth * 0.36;
    const targetY = targetBaseY + Math.abs(spread) * 0.18 - startHeight * 0.3;
    const splashLocalX = pondLocalBaseX + spread * 0.9;
    const splashLocalY = pondLocalBaseY + Math.abs(spread) * 0.18;
    const peak = Math.max(90, Math.abs(targetX - startX) * 0.12 + 70 + index * 10);

    const clone = d3
      .select(stoneFlightLayer)
      .append("img")
      .attr("class", "flying-stone")
      .attr("src", STONE_IMAGE_PATH)
      .style("width", `${startWidth}px`)
      .style("height", `${startHeight}px`)
      .style("left", `${startX}px`)
      .style("top", `${startY}px`)
      .style("opacity", 0.96)
      .style("transform", "translate3d(0px, 0px, 0) scale(1)");

    clone
      .transition()
      .delay(index * STONE_THROW_STEP_DELAY)
      .duration(STONE_THROW_DURATION)
      .ease(d3.easeCubicInOut)
      .styleTween("transform", () => {
        return (t) => {
          const currentX = (targetX - startX) * t;
          const currentY = (targetY - startY) * t - 4 * peak * t * (1 - t);
          const scale = 1 - t * 0.34;
          const rotate = -9 + t * 18;
          return `translate3d(${currentX}px, ${currentY}px, 0) scale(${scale}) rotate(${rotate}deg)`;
        };
      })
      .styleTween("opacity", () => {
        return (t) => `${0.96 - t * 0.3}`;
      })
      .on("end", function onEnd() {
        d3.select(this).remove();
        if (runId === stoneThrowRunId) {
          pulsePondLanding(runId);
          createPondSplash(splashLocalX, splashLocalY, runId);
        }
      });
  });

  const totalDuration =
    STONE_THROW_DURATION +
    (stoneImages.length - 1) * STONE_THROW_STEP_DELAY +
    SPLASH_SETTLE_DELAY;

  return new Promise((resolve) => {
    window.setTimeout(() => {
      if (runId === stoneThrowRunId) {
        resolve();
      } else {
        resolve();
      }
    }, totalDuration);
  });
}

function animateStreamComment(selection, width, travelHeight, random) {
  const startX = -340 - random() * 180;
  const endX = width + 180 + random() * 160;
  const nextY = 20 + random() * Math.max(40, travelHeight - 56);
  const opacity = 0.6 + random() * 0.22;
  const duration = 12000 + random() * 7000;

  selection
    .style("top", `${nextY}px`)
    .style("left", `${startX}px`)
    .style("opacity", 0)
    .transition()
    .duration(650)
    .style("opacity", opacity)
    .transition()
    .duration(duration)
    .ease(window.d3.easeLinear)
    .style("left", `${endX}px`)
    .transition()
    .duration(550)
    .style("opacity", 0)
    .on("end", function onEnd() {
      animateStreamComment(window.d3.select(this), width, travelHeight, random);
    });
}

function startCommentStream(subcategoryLabel) {
  if (!window.d3 || !commentStream) {
    return;
  }

  stopCommentStream();

  if (!categoryComments || !categoryComments[subcategoryLabel]?.length) {
    return;
  }

  const comments = categoryComments[subcategoryLabel]
    .slice(0, MAX_STREAM_COMMENTS)
    .map((text, index) => ({
      id: `${subcategoryLabel}-${index}`,
      text: truncateComment(censorComment(text), 92),
    }));

  const d3 = window.d3;
  const bounds = commentStream.getBoundingClientRect();
  const width = Math.max(bounds.width, 900);
  const height = Math.max(bounds.height, 900);
  const selection = d3
    .select(commentStream)
    .selectAll(".stream-comment")
    .data(comments, (datum) => datum.id)
    .join("div")
    .attr("class", "stream-comment")
    .text((datum) => datum.text);

  selection.each(function eachComment(_, index) {
    const seeded = createSeededRandom(`${subcategoryLabel}-${index}`);
    animateStreamComment(d3.select(this), width, height, seeded);
  });
}

function renderPoemDots() {
  if (!poemDotsEl) {
    return;
  }

  poemDotsEl.innerHTML = "";
  POEM_STANZA_LINES.forEach((_, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "poem-dot";
    btn.setAttribute("aria-label", `Stanza ${index + 1}`);

    if (index < poemMaxRevealed) {
      btn.classList.add("poem-dot--unlocked");
      btn.addEventListener("click", () => showPoemStanza(index));
    }
    if (index === poemCurrentIndex) {
      btn.classList.add("poem-dot--active");
    }

    poemDotsEl.appendChild(btn);
  });
}

function showPoemStanza(index) {
  if (!poemStanzaText) {
    return;
  }

  poemCurrentIndex = index;
  poemStanzaText.classList.add("poem-stanza-text--fade");

  window.setTimeout(() => {
    poemStanzaText.innerHTML = POEM_STANZA_LINES[index].join("<br>");
    poemStanzaText.classList.remove("poem-stanza-text--fade");
    renderPoemDots();
  }, 360);
}

function updatePoem(view) {
  const targetCount = POEM_REVEAL_COUNT[view] ?? 1;
  const newMax = Math.max(poemMaxRevealed, targetCount);

  if (newMax <= poemMaxRevealed) {
    return;
  }

  const firstNewIndex = poemMaxRevealed;
  poemMaxRevealed = newMax;

  renderPoemDots();

  // Cross-fade to the first newly revealed stanza
  showPoemStanza(firstNewIndex);

  const allRevealed = poemMaxRevealed >= POEM_STANZA_LINES.length;

  if (poemHint) {
    poemHint.textContent = allRevealed ? "full poem revealed" : "keep exploring to reveal more";
    poemHint.classList.toggle("poem-hint--hidden", allRevealed);
  }

  if (poemExpandBtn) {
    poemExpandBtn.classList.toggle("poem-expand-btn--done", allRevealed);
  }
}

function openOverview() {
  appState = {
    view: APP_VIEWS.OVERVIEW,
    activeCategory: null,
    activeSubcategory: null,
  };

  hideDrillDownHeader();
  setPondState({
    title: "Choose a subcategory",
    status: "The pond stays beside the title while the chart remains visible below.",
    isActive: false,
  });
  stopCommentStream();
  stopStoneThrow();
  setContentWarningVisible(false);
  updatePoem(APP_VIEWS.OVERVIEW);
  announceUiState("Overview chart loaded.");
  renderChart();
}

function openBreakdown(category) {
  appState = {
    view: APP_VIEWS.BREAKDOWN,
    activeCategory: category,
    activeSubcategory: null,
  };

  showDrillDownHeader(`${category.label} distribution`, "Back to overview");
  setPondState({
    title: category.label,
    status: "Pick one breakdown bar to send sampled comments across the page.",
    isActive: false,
  });
  stopCommentStream();
  stopStoneThrow();
  setContentWarningVisible(false);
  updatePoem(APP_VIEWS.BREAKDOWN);
  announceUiState(`${category.label} breakdown opened.`);
  renderChart(category);
}

function renderPondFeedback(subcategory) {
  if (commentDataError) {
    setPondState({
      title: subcategory.label,
      status: "Sampled comments could not be loaded, but the chart remains available.",
      isActive: true,
      isError: true,
    });
    stopCommentStream();
    stopStoneThrow();
    setContentWarningVisible(false);
    updateMetaText();
    announceUiState(`Could not load sampled comments for ${subcategory.label}.`);
    return;
  }

  if (!categoryComments) {
    setPondState({
      title: subcategory.label,
      status: "Loading sampled comments for the page-wide stream...",
      isActive: true,
    });
    setContentWarningVisible(false);
    announceUiState(`Loading sampled comments for ${subcategory.label}.`);
    ensureCommentData()
      .then(() => {
        if (appState.view === APP_VIEWS.POND && appState.activeSubcategory?.label === subcategory.label) {
          renderPondFeedback(subcategory);
        }
      })
      .catch(() => {
        if (appState.view === APP_VIEWS.POND && appState.activeSubcategory?.label === subcategory.label) {
          renderPondFeedback(subcategory);
        }
    });
    return;
  }

  const sampleCount = categoryComments[subcategory.label]?.length || 0;

  if (!sampleCount) {
    setPondState({
      title: subcategory.label,
      status: "No sampled comments were available for this subcategory yet.",
      isActive: true,
    });
    stopCommentStream();
    stopStoneThrow();
    setContentWarningVisible(false);
    updateMetaText();
    announceUiState(`No sampled comments were available for ${subcategory.label}.`);
    return;
  }

  setPondState({
    title: `${subcategory.label} stream`,
    status: prefersReducedMotion()
      ? `${formatNumber(sampleCount)} sampled comments are shown without motion.`
      : `${formatNumber(sampleCount)} sampled comments are drifting across the panel from left to right with D3 transitions.`,
    isActive: true,
  });
  setContentWarningVisible(true);
  if (prefersReducedMotion()) {
    renderStaticCommentStream(subcategory.label);
  } else {
    startCommentStream(subcategory.label);
  }
  updateMetaText();
  announceUiState(
    `${subcategory.label} pond active. ${formatNumber(sampleCount)} sampled comments ${
      prefersReducedMotion() ? "shown in a static layout." : "streaming across the page."
    }`
  );
}

async function openPond(subcategory, sourceGroup = null) {
  if (!appState.activeCategory) {
    return;
  }

  stopCommentStream();

  appState = {
    ...appState,
    view: APP_VIEWS.POND,
    activeSubcategory: subcategory,
  };

  showDrillDownHeader(
    `${subcategory.label} — ${formatNumber(subcategory.count)} comments`,
    `Back to ${appState.activeCategory.label} breakdown`
  );
  updatePoem(APP_VIEWS.POND);
  updateMetaText();
  announceUiState(`Launching ${subcategory.label} pond view.`);

  await throwStonesToPond(sourceGroup);

  if (appState.activeSubcategory?.label !== subcategory.label || appState.view !== APP_VIEWS.POND) {
    return;
  }

  renderPondFeedback(subcategory);
}

function handleBackClick() {
  if (!chartData) {
    return;
  }

  if (appState.view === APP_VIEWS.POND && appState.activeCategory) {
    openBreakdown(appState.activeCategory);
    return;
  }

  if (appState.view === APP_VIEWS.BREAKDOWN) {
    openOverview();
  }
}

function ensureCommentData() {
  if (categoryComments) {
    return Promise.resolve(categoryComments);
  }

  if (commentDataError) {
    return Promise.reject(commentDataError);
  }

  if (!commentDataPromise) {
    commentDataPromise = fetchJson(COMMENT_DATA_PATH)
      .then((data) => {
        categoryComments = data;
        return data;
      })
      .catch((error) => {
        commentDataError = error;
        throw error;
      });
  }

  return commentDataPromise;
}

async function initChart() {
  // Seed the first stanza immediately so the poem stage is never blank
  if (poemStanzaText) {
    poemStanzaText.innerHTML = POEM_STANZA_LINES[0].join("<br>");
  }
  renderPoemDots();

  if (backButton) {
    backButton.addEventListener("click", handleBackClick);
  }

  if (poemExpandBtn) {
    poemExpandBtn.addEventListener("click", () => {
      const firstNew = poemMaxRevealed;
      poemMaxRevealed = POEM_STANZA_LINES.length;
      renderPoemDots();
      showPoemStanza(firstNew < POEM_STANZA_LINES.length ? firstNew : POEM_STANZA_LINES.length - 1);
      if (poemHint) {
        poemHint.textContent = "full poem revealed";
        poemHint.classList.add("poem-hint--hidden");
      }
      poemExpandBtn.classList.add("poem-expand-btn--done");
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      handleBackClick();
    }
  });

  try {
    chartData = window.HATEXPLAIN_COUNTS || (await fetchJson(COUNT_DATA_PATH));
    openOverview();

    ensureCommentData().catch((error) => {
      console.error(error);
      if (appState.view === APP_VIEWS.POND && appState.activeSubcategory) {
        renderPondFeedback(appState.activeSubcategory);
      }
    });
  } catch (error) {
    renderError(
      "Run `python3 scripts/preprocess_hatexplain.py` to generate the chart data files, then reload the page."
    );
    console.error(error);
  }
}

initChart();
