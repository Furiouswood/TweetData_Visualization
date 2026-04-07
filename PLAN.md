# Stone → Pond → Floating Comments: Implementation Plan

## Stage 0 — Data Pipeline (Preprocessing)

**Goal:** Make actual comment text available to the frontend, grouped by subcategory.

- Extend `preprocess_hatexplain.py` to produce a new file: `data/category_comments.json`
- Structure:
  ```json
  {
    "Jewish": ["comment text 1", "comment text 2", ...],
    "African": ["comment text 1", ...],
    ...
  }
  ```
- For each subcategory (e.g. "Jewish", "African", "Women"), collect a **random sample of ~30–50 comments** — keeps the JSON small and the pond readable
- The CSV has a `comment` column and subcategory columns (`Race`, `Religion`, etc.) with values like `"Jewish"`, `"African"`, etc.
- This file gets loaded alongside `category_counts.json` at startup

**Deliverable:** `data/category_comments.json` loads in the browser with sampled comment text per subcategory.

---

## Stage 1 — Pond Container & View Transition

**Goal:** When user clicks a subcategory bar, the chart fades out and a "pond" area fades in.

- Add a new `<div class="pond-container">` to `index.html`, hidden by default, sitting inside `.chart-stage` alongside `.chart-grid`
- On subcategory bar click, transition to pond view:
  - Fade out the SVG chart (opacity → 0, then `display: none`)
  - Fade in the pond container (a blue/dark gradient area styled to look like water)
  - Show a back button to return to the chart
- The pond is a full-width container with a subtle water-like CSS gradient and a ripple keyframe animation on the background
- Store which subcategory was clicked so later stages know what data to show

**Deliverable:** Click a subcategory bar → chart disappears → empty pond appears.

---

## Stage 1.5 — Navigation Backbone & Core State

**Goal:** Make the interaction flow stable before adding visual polish.

- Add explicit UI states in `script.js`: `overview`, `breakdown`, and `pond`
- Reuse the existing drill-down interaction pattern so pond view is entered only from a clicked subcategory
- Store the active parent category and subcategory in state so the app can restore the correct view on back navigation
- Update the existing back button behavior to support:
  - Pond → subcategory breakdown
  - Breakdown → main category overview
- Update the drill-down header when pond view is open, for example: `"Jewish — 1,950 comments"`
- Add a basic loading/error state for comment data so the pond can still fail gracefully while the chart remains usable

**Deliverable:** The full navigation flow works reliably end-to-end before animation polish is added.

---

## Stage 2 — Stone Throw Animation

**Goal:** Before the pond appears, stones from the clicked bar animate in an arc toward the pond area.

- When a subcategory bar is clicked, collect all `.stone-node` elements in that bar group
- Calculate a target landing point (center of where the pond will be)
- Animate each stone along a **parabolic arc** using D3 transitions with custom `attrTween`:
  - **X:** linear interpolation from stone's current position → pond center (with slight random spread)
  - **Y:** quadratic curve (rises up, then falls down) simulating a throw
  - Scale down slightly as they "fly away"
  - Stagger each stone by ~100ms for a cascading throw effect
- After the last stone lands, trigger the pond fade-in (Stage 1's transition)
- Total animation: ~1.5–2 seconds for all stones to land

**Deliverable:** Stones visibly arc through the air and land before the pond view appears.

---

## Stage 3 — Splash Effect

**Goal:** Each stone landing creates a splash animation in the pond.

- As each stone reaches its landing point, spawn an SVG splash at that position:
  - 2–3 concentric **circles** that expand outward and fade (like ripples)
  - A few small **ellipses** that fly upward and fall back (water droplets)
- Use D3 transitions: `r` grows from 0 → 60px while `opacity` goes 1 → 0 over ~600ms
- Droplets use the same parabolic arc technique from Stage 2 but smaller/faster
- Stagger splashes to match stone landing times
- After all splashes finish (~500ms after last stone lands), transition to floating comments

**Deliverable:** Visible ripple + droplet animations where each stone hits the water.

---

## Stage 4 — Floating Comments

**Goal:** After splashes settle, hate comments from that category float on the pond surface.

- Load comments for the clicked subcategory from `category_comments.json`
- Spawn ~15–20 comment elements as `<div>` overlays inside the pond container
- Each comment:
  - Positioned randomly across the pond area
  - Fades in with staggered delays (50–100ms apart)
  - Has a slow, continuous **drift animation** (CSS `@keyframes` or D3 timer):
    - Gentle horizontal movement (sine wave, ±20–40px)
    - Very slight vertical bob (±5–10px)
    - Random speed/phase per comment so they don't move in sync
  - Styled as semi-transparent white/cream text on the dark pond, with a subtle text-shadow glow
- Comments should not overlap too much — use a simple collision-avoidance grid or random placement with minimum spacing
- Truncate long comments to ~80–100 characters with "..."

**Deliverable:** Actual hate comments gently floating on the pond surface, readable and haunting.

---

## Stage 5 — Final Polish & Non-Core Refinements

**Goal:** Tie everything together after the main experience already works.

- **Interaction polish:** Smooth timing between stone throw, splash, and floating comment reveal
- **Safety note:** Add a final content warning / framing note for the rendered hate comments
- **Accessibility:** Add keyboard navigation (Escape to go back), screen reader text, and a restrained live-region announcement for pond state changes
- **Reduced motion:** Respect `prefers-reduced-motion` — skip throw/splash, just fade to pond with static comments
- **Edge cases:** Empty comment sample, fetch failure, and unusually long comments

**Deferred for later:** Mobile-specific layout tuning is intentionally out of scope for this version.

---

## File Changes Summary

| File | Changes |
|---|---|
| `scripts/preprocess_hatexplain.py` | Add comment sampling logic, output `category_comments.json` |
| `data/category_comments.json` | New — sampled comments per subcategory |
| `index.html` | Add pond container div, load comments JSON |
| `script.js` | View state backbone, pond transitions, floating comments, stone throw, splash, back nav |
| `styles.css` | Pond styles, water gradient, floating comment styles, drift keyframes |

## Suggested Build Order

**0 → 1 → 1.5 → 4 → 2 → 3 → 5**

Build the backbone first: data pipeline, pond container, state management, navigation, and floating comments. Once the end-to-end interaction works, layer on the stone throw and splash animations. Leave safety framing, accessibility refinements, reduced motion, and mobile-specific work for the final polish stage.
