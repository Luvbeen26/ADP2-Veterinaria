---
name: "Mascotas Felices - Editorial Care"
description: "Editorial client experiences and clear clinical workflows in one veterinary identity."
colors:
  brand: "#146b62"
  brand-hover: "#10564f"
  ink: "#17332f"
  muted: "#52645f"
  background: "#f7faf9"
  surface: "#ffffff"
  selected: "#e8f3ef"
  warm: "#f3d5bd"
  border: "#ccd8d3"
  control-border: "#71847c"
  focus: "#235db8"
  error: "#ae3345"
  error-surface: "#fcecef"
  pending: "#805a13"
  pending-surface: "#fff4d8"
  attended: "#226744"
  attended-surface: "#e8f4ec"
  absent: "#7c4c69"
  absent-surface: "#f5ebf1"
  cancelled: "#59655f"
  cancelled-surface: "#edf0ee"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "4rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.025em"
  editorial-headline:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "2.5rem"
    fontWeight: 500
    lineHeight: 1.05
  headline:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.2
  title:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
  section-title:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  navigation:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  button:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.25
  status:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.5
rounded:
  control: "0.5rem"
  panel: "0.75rem"
  status: "999px"
spacing:
  space-4: "0.25rem"
  space-8: "0.5rem"
  space-12: "0.75rem"
  space-16: "1rem"
  space-20: "1.25rem"
  space-24: "1.5rem"
  space-32: "2rem"
  space-48: "3rem"
  space-64: "4rem"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.brand-hover}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.brand}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1rem"
  button-quiet-hover:
    backgroundColor: "{colors.selected}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0.5rem 0.75rem"
    width: "100%"
  navigation-link:
    textColor: "{colors.muted}"
    typography: "{typography.navigation}"
    padding: "0 0.75rem"
  navigation-link-active:
    textColor: "{colors.brand}"
  status-pending:
    backgroundColor: "{colors.pending-surface}"
    textColor: "{colors.pending}"
    typography: "{typography.status}"
    rounded: "{rounded.status}"
    padding: "0.25rem 0.5rem"
---
# Design System: Mascotas Felices

## Overview

**Creative North Star: "Editorial Care"**

Editorial Care is the approved identity across the client and veterinary application. Newsreader gives client headlines an editorial voice; Source Sans 3 keeps forms, clinical records, navigation, and data easy to scan. Care Green ties the roles together through actions, states, and a shared Header.

The implementation covers all routed pages and their shared controls. The retained `--cc-*` namespace supplies the system; its historical Care & Clarity filename does not limit the redesign to opt-in surfaces. This document replaces that earlier scope.

**Key Characteristics:**

- Editorial client headlines paired with practical clinical typography.
- Asymmetric Home composition, photography, and ruled service entries.
- Vertical appointment records with visible status and role-specific actions.
- Flat surfaces, restrained borders, and consistent shared controls.
- One identity with role-aware navigation and responsive page layouts.

## Colors

The frontmatter records the source palette from `src/styles/care-clarity.css`; it is normative. No additional palette or tonal ramp is established.

### Primary

Care Green (`brand`) anchors primary actions, links, active navigation, and the Home contact strip. Its darker hover token supports action feedback. Selected Green (`selected`) supplies quiet hover fills and supplementary highlights.

### Neutral

Deep Care Ink (`ink`) carries primary text; Muted Ink (`muted`) supports secondary text and placeholders. Cool Background (`background`), White Surface (`surface`), Soft Divider (`border`), and Control Outline (`control-border`) separate content and fields. Warm Selection (`warm`) highlights selected text.

Focus and error colors have distinct interaction roles. Pending, attended, absent, and cancelled statuses each have text/surface pairs and readable labels. Material system variables in `src/styles.css` map core green, text, surface, outline, and error roles; `src/custom-theme.scss` supplies Source Sans 3 typography and retains its underlying Material palette configuration.

## Typography

**Display font:** Newsreader, Georgia, serif, loaded at 500 and 600. **Body and interface font:** Source Sans 3, sans-serif, loaded at 400 and 600 through `src/index.html`.

The frontmatter's display role is Home's headline. General editorial page headings use the editorial-headline role; clinical page headings use the Source Sans headline role. Home's lead service title also uses Newsreader (2.25rem); the contact heading uses it at 2rem. Remaining headings, labels, buttons, records, and navigation use Source Sans 3. Numeric record values use tabular figures where specified.

At 599px and below, Home's headline becomes 2.5rem, general editorial headings become 2rem, and clinical headings become 1.75rem. Foundation descriptions have a 70ch maximum measure. The source declares additional text steps for local composition; these do not establish a mandatory modular scale.

**The Clinical Type Rule.** Keep clinical headings, forms, and data in Source Sans 3; use Newsreader for the implemented editorial headline roles.

## Layout

The sticky Header uses an operations width cap (85rem), minimum row height (4rem), and stacking order 1000. Its disclosure navigation starts at 1199px and below; compact Header spacing starts at 479px and below. Home and Profile use a client width cap (75rem); veterinary Consultas uses a 1360px cap and client Mis citas uses a 1200px cap. Local page layouts determine density rather than one universal grid.

Home opens with a 4/8 copy/photo grid and `consulta.png` with intrinsic dimensions 712 by 474. Services use a 7/5 grid with a larger leading entry. Pet-care recommendations group by pet and source. Contact details sit in a green typographic strip. At 899px and below, the opening photo moves below the copy and pet/contact groups stack; at 599px and below, the remaining service, copy, care-source, and contact-detail columns stack.

Consultas groups vertically stacked appointment records by date. Each record uses three desktop columns for identity, service/status, and actions; two columns at 899px and below; one at 599px and below. Clinical notes follow the same record rather than a horizontal card carousel. Profile uses two panels, stacking at 899px and below, and form columns stack at 599px and below. The frontmatter records the shared spacing steps; page CSS also uses local spacing where composition requires it.

## Elevation & Depth

Shared controls, navigation, and content records are flat. Dividers and tonal surfaces establish grouping; no shared shadow token is defined. Profile dialogs use a dimmed backdrop (`rgb(23 51 47 / 55%)`) and fixed layering rather than a decorative elevation scale.

Button and navigation color transitions use 150ms and the default `ease`. Reduced-motion rules remove or minimize transitions and animations. Focus uses a visible 2px outline: global offset is 3px, while scoped foundations use 2px.

## Shapes

Controls use the control radius; panels and dialogs can use the panel radius. Ruled editorial sections and appointment records remain flat. Foundation status capsules use 999px corners, while appointment badges use 6px and Profile badges use 4px. Do not flatten these local differences into a single universal badge shape.

## Components

### Buttons and fields

Primary actions use green with white text and the darker hover state. Quiet foundations use transparent green text; shared secondary controls add a control-outline border. Destructive controls use error text/border and an error-surface hover. Disabled controls use muted text and cancelled-surface fills. Controls have a minimum height of 2.75rem. Foundation button padding is 0.5rem 1rem; global shared buttons use .65rem 1.1rem. Foundation field padding is 0.5rem 0.75rem; global shared fields use .65rem .8rem. Both use visible focus, distinct field outlines, and consistent placeholder colors. Shared selectors intentionally style controls across the application.

### Status and records

Appointment statuses pair text with semantic fills. Interactive Consultas filters are distinct from passive badges: active filters have a green background and white text. Records expose client reschedule/cancel actions and veterinary record/reschedule/attendance actions according to existing role and status conditions. These visual changes do not redefine business behavior.

### Navigation and dialogs

The shared Header retains the logo, underlined active links, role-specific destinations, and responsive disclosure. Nested consultation, history, and booking destinations highlight their owning navigation section. Its toggle exposes expanded/control semantics; Escape, outside click, and navigation close it. Profile dialogs use CDK focus trapping with automatic capture, dialog semantics, bounded height, and internal scrolling.

### Page and role implementation map

| Surface | Implemented pattern |
| --- | --- |
| Home | Editorial opening photograph, asymmetric services, grouped care, green contact strip |
| Client services and pets | Editorial headings, service/pet records, shared actions |
| Pet registration and appointment flows | Responsive forms, calendar, confirmation views |
| Client appointments / veterinary Consultas | Shared vertical records with role-specific actions |
| Veterinary users, history, consultation registration, statistics | Clinical typography, records/forms, charts with Source Sans 3 and the approved palette |
| Authentication and Profile | Shared form treatment, account panels, focused dialogs |

The final production build passed. The responsive suite passed all 108 checks (36 tests across three browser widths). The suite uses mocked services and renders charts, calendar, and forms at effective widths of 485, 735, and 1407px. Source-review findings were corrected. No screenshot or manual browser review was performed; widths below 485px were not measured. Full authentication/backend E2E, PDF pagination, and known prior functional defects remain outside this verification. The redesign does not change services, models, routes, guards, or business rules; prior authentication changes predate this work.

## Do's and Don'ts

### Do:

- Do preserve Newsreader editorial headlines and Source Sans 3 clinical/interface typography.
- Do reuse the `--cc-*` tokens and shared control treatments across routed pages.
- Do retain role-aware navigation, readable status text, visible focus, and reduced-motion behavior.
- Do preserve responsive record and form layouts when adding content.

### Don't:

- Don't restore the obsolete Home-only opt-in scope.
- Don't introduce unsupported palettes, tonal ramps, or decorative elevation tokens.
- Don't treat passing automated tests as screenshot or manual visual approval.
- Don't turn known functional defects into design rules.
