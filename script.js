const chartGrid = document.getElementById("chart-grid");
const totalComments = document.getElementById("total-comments");
const multipleTargets = document.getElementById("multiple-targets");
const commentTotal = document.getElementById("comment-total");
const chartNote = document.getElementById("chart-note");
const STONE_IMAGE_PATH = "./stone.png";

const numberFormatter = new Intl.NumberFormat("en-US");
const STONE_UNIT = 1000;
const STONE_HEIGHT = 58;
const STONE_GAP = 10;
const CHART_WIDTH = 1080;
const CHART_HEIGHT = 760;
const MARGIN = { top: 52, right: 36, bottom: 126, left: 84 };
const STONE_WIDTHS = [0.9, 0.8, 0.88, 0.78, 0.92, 0.84, 0.86, 0.8];

function formatNumber(value) {
  return numberFormatter.format(value);
}

function splitLabel(label) {
  return label.split(" ");
}

function renderError(message) {
  chartGrid.innerHTML = `<p class="is-error">${message}</p>`;
  commentTotal.textContent = "Data unavailable";
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

function renderChart(data) {
  if (!window.d3) {
    renderError("D3 did not load. Connect to the internet and reload the page.");
    return;
  }

  const d3 = window.d3;
  const categories = [...data.categories].sort((a, b) => b.count - a.count);
  const maxCount = d3.max(categories, (category) => category.count);
  const yMax = Math.ceil(maxCount / STONE_UNIT) * STONE_UNIT;
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
      "Vertical D3 bar chart of HateXplain category counts, using stacked stone images where each stone represents one thousand comments."
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
    .data(categories)
    .enter()
    .append("g")
    .attr("class", "bar-group")
    .attr("transform", (category) => `translate(${x(category.label)},0)`);

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
      const clipId = `stone-clip-${groupIndex}-${index}`;

      defs
        .append("clipPath")
        .attr("id", clipId)
        .attr("clipPathUnits", "userSpaceOnUse")
        .append("rect")
        // The clip path shares the bar group's coordinate space, so using the
        // band offset here shifts it away from the image and clips the stone out.
        .attr("x", stoneX)
        .attr("y", stoneY + (STONE_HEIGHT * (1 - fillRatio)))
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
    addWrappedLabel(d3.select(this), category.label, x.bandwidth() / 2, chartBottom + 34);
  });

  totalComments.textContent = formatNumber(data.totalComments);
  multipleTargets.textContent = formatNumber(data.commentsWithMultipleTargets);
  commentTotal.textContent = `${formatNumber(data.totalComments)} rows processed`;
  chartNote.textContent =
    `One comment can contribute to more than one bar because the dataset allows multiple target types per comment. This SVG chart is drawn with D3, and each stone image represents ${formatNumber(STONE_UNIT)} comments.`;
}

async function initChart() {
  try {
    if (window.HATEXPLAIN_COUNTS) {
      renderChart(window.HATEXPLAIN_COUNTS);
      return;
    }

    const response = await fetch("./data/category_counts.json");
    if (!response.ok) {
      throw new Error("The chart data file could not be loaded.");
    }

    const data = await response.json();
    renderChart(data);
  } catch (error) {
    renderError(
      "Run `python3 scripts/preprocess_hatexplain.py` to generate the chart data files, then reload the page."
    );
    console.error(error);
  }
}

initChart();
