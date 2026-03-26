# CS441 — HateXplain Category Visualization

An interactive bar chart built with D3.js that visualizes comment counts per hate-speech target category (Race, Religion, Gender, Sexual Orientation, Miscellaneous) from the cleaned HateXplain dataset. Each stone image represents 1,000 comments. Click a category bar to drill into its sub-label distribution.

**Live demo:** [https://furiouswood.github.io/TweetData_Visualization/](https://furiouswood.github.io/TweetData_Visualization/)

## Running locally

### Prerequisites

- Python 3 (to generate chart data)
- A local HTTP server (required because the page fetches JSON — opening `index.html` directly via `file://` will not work)

### Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/FuriousWood/TweetData_Visualization.git
   cd TweetData_Visualization
   ```

2. **Generate the chart data**

   ```bash
   python3 scripts/preprocess_hatexplain.py
   ```

   This reads `project/clean_hateXplain.csv` and writes two output files:
   - `data/category_counts.json` — used by the page when served over HTTP
   - `data/category_counts.js` — inline fallback for environments without a server

3. **Serve the project locally**

   Using Python's built-in server:

   ```bash
   python3 -m http.server 8000
   ```

   Then open [http://localhost:8000](http://localhost:8000) in your browser.

   Any other static file server (VS Code Live Server, `npx serve`, etc.) works too.

## Project structure

```
CS441-main/
├── index.html                  # Main page
├── script.js                   # D3 chart logic and drill-down interactivity
├── styles.css                  # Styles
├── stone.png                   # Stone image used as bar unit (1 stone = 1,000 comments)
├── data/
│   ├── category_counts.json    # Generated chart data (JSON)
│   └── category_counts.js      # Generated chart data (JS inline fallback)
├── scripts/
│   └── preprocess_hatexplain.py  # Data aggregation script
└── project/
    ├── clean_hateXplain.csv    # Cleaned dataset (20,109 comments)
    └── Data_Cleaning.ipynb     # Jupyter notebook for data cleaning
```
