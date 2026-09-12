# Local interface review

September 12, 2026. Preview branch: `preview/restore-console-design`.
Publication is explicitly on hold until the owner requests deployment.

## Direction

Keep the existing four-panel experiment and the Fly template's minimal console
appearance: cool dark surfaces, system monospace, straight panel edges and thin
separators. There is no external font request or decorative grain overlay.
The original white Chromium game surface and the signed activation colors remain.

## Changes

- Shorter introduction, a definition of connectome, clearer panel names and a
  direct Results navigation link. Explain when manual input takes over and when
  training starts. Keep the model's biological limits and all upstream credits.
- Text roles use caption, label, body, section and title tokens. Main explanatory
  copy is 14px with 1.65–1.7 line height. Data labels stay compact. Control gaps,
  section spacing and panel padding use shared tokens.
- Group training actions separately from model file actions. Explain the seed,
  validate its range with visible text and `aria-invalid`, and keep loading,
  stopped and missing-result states explicit.
- Plot the two actual history series against labeled generation and score axes.
  The plot uses its rendered width so labels stay readable on narrow screens.
  Training and validation are differentiated by dashed/solid lines as well as
  color. Scale only the series that are shown.
- Show completed-course counts for the trained agent, silenced circuit and
  untrained readout. Preserve all six control conditions in the comparison table;
  explain their labels, align numbers to the right and show mean survival bars
  against the same 180-second limit. These displays use the loaded benchmark,
  not hardcoded results. Include its model generation and training seed.
- Clear previous results when restoring a model, avoiding a momentary mismatch
  between the current model and an earlier evaluation.

## Checklist references

Reviewed the relevant guidance from [Checklist Design](https://www.checklist.design/):

- [Typography](https://www.checklist.design/design-system/typography)
- [Spacing and grid](https://www.checklist.design/design-system/spacing-and-grid)
- [Accessibility](https://www.checklist.design/design-system/accessibility)
- [Color system](https://www.checklist.design/design-system/color-system)
- [Buttons](https://www.checklist.design/design-system/button)
- [Input fields](https://www.checklist.design/design-system/input-field)
- [Tables](https://www.checklist.design/design-system/table)
- [Analytics](https://www.checklist.design/web-app/analytics)
- [Loading](https://www.checklist.design/design-system/loading)

Apply items to this bounded experiment. A six-row, fixed-course comparison does
not need pagination, date filters or search. No extra theme or density selector
is introduced.

## Verification

- Production build and all 11 existing tests pass, including exact reproduction
  of the published benchmark and parity with original Chromium physics.
- Chrome layout checks at 1440, 760, 390 and 320 CSS pixels: no document overflow
  or clipped panel headings/footers. The comparison table intentionally scrolls
  inside its own keyboard-focusable region on narrow screens.
- Invalid seed feedback, disabled training action and visible keyboard focus
  checked through the UI.
- Started real browser training, observed generation 26 / 5,096 episodes and a
  dynamically updated chart, then stopped and restored the published model.
  Restored comparison shows 99/100, 0/100 and 0/100 for the three main conditions.
- Text contrast: primary 14.00:1 on page background; muted 7.07:1 on panel header;
  accent 11.25:1 on panel background; link 10.88:1 on page background.
  Control boundary 3.53:1 on its fill; primary boundary 4.76:1; focus 10.58:1.
- Preview listens only on the Mac mini's Tailscale interface, port 4180.
  HTTP and rendered application verified at that address from this host.
  MacBook acceptance is left to the owner.

This is a targeted UI review, not a claim of complete WCAG conformance.
VoiceOver/NVDA and actual browser zoom at 200% have not been manually audited.
