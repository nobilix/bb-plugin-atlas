/**
 * The selectors the Playwright suite asserts against: one place, cited by every
 * spec, and the thing to change if a component renames its markup.
 *
 * `zoneMap.*` matches `site/src/components/ZoneMap.tsx` and `zonemap/Screens.astro`.
 */

export const zoneMap = {
  root: "[data-atlas-zonemap], .atlas-zonemap",
  stage: "[data-atlas-stage], #stage, .stage",
  stageWrap: "[data-atlas-stage-wrap], #stagewrap, .stagewrap",
  screen: "[data-screen]",
  zonesLayer: "[data-atlas-zones], #zones, .zones",
  zone: "[data-atlas-zone], .zone",
  badge: "[data-atlas-badge], .badge",
  navblock: "[data-atlas-navblock], .navblock",
  fixture: "[data-fx]",
  /** A zone's details, open in the legend's column. `data-atlas-details` is the surface id. */
  details: "[data-atlas-details]",
  legend: "aside.legend",
  closeDetails: "[data-atlas-details] .close",
  toolbar: "[data-atlas-toolbar], #chrome, header.chrome",
} as const;

/** Starlight's header, and what this site adds to it. */
export const siteHeader = {
  frame: "header.header",
  search: "site-search button",
  mapLink: '[data-atlas-navlink="map"]',
} as const;

export const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "900", width: 900, height: 620 },
  { name: "390", width: 390, height: 844 },
] as const;
