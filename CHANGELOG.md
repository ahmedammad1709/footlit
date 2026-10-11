# Changelog

## 1.0.0 - 2026-10-12

First complete release.

- **Eleven events** in four groups: repo created / deleted / forked; pull request opened / merged / closed; checks passed / failed / site or deploy live; release published / issue closed.
- **Six themes**, each with applause, farewell and alarm versions and its own copy per event: Marquee, Terminal, Mission Control, Pixel Arcade, Web Crawler, Quiet.
- Per-event theme override, show length, appearance, reduced-motion handling, Quiet mode.
- Popup: theme tiles, all eleven events with a Rehearse button and an on/off switch each, a quiet-mode notice, and an out-of-date-tab notice with a Reload button.
- Settings page: sticky navigation, live-preview dock that stays on screen, first-run welcome, activity log, collapsible help, reset.
- Detectors only react to transitions seen in a live tab; verified against fixtures (positive and negative cases). Isolated from each other so one failure cannot affect the rest.
- Firefox build (its manifest declares that no data is collected), store zips, generated store screenshots and promo tiles, privacy policy and listing copy.
- Test suites: detectors and handshake (38 cases), theme matrix (6 themes x 11 events, reduced motion, narrow window).

Known gaps: detectors for repo create/delete/fork, release, Pages and the PR merge-box wording are written from documented behaviour and fixtures and have not yet been confirmed on live GitHub; the Firefox build is verified by an automated test on Firefox 157 but, until the Firefox Add-ons listing is approved, installs only as a temporary add-on; no sound; stars and terminal pushes are not detected.
