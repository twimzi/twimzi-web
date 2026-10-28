---
name: impeccable-ui-design-twimzi
description: Use when reviewing, shaping, redesigning, implementing, auditing, polishing, adapting, or improving the UI/UX of Twimzi's Next.js website or Flutter Android app. Covers hierarchy, information architecture, typography, layout, color, motion, accessibility, responsive/adaptive behavior, UX copy, edge cases, design systems, forms, onboarding, and empty/loading/error states. Do not use for backend-only work. Do not claim Impeccable CLI, browser iteration, detector, hooks, or agents are available unless verified in this environment.
---

# Impeccable UI Design — Twimzi

Apply the design workflow and vocabulary of the official [Impeccable project](https://github.com/pbakaus/impeccable) to Twimzi. This is a Twimzi-specific adaptation, not a copy of the complete upstream software distribution.

## Capability boundary

This skill is design guidance. Before using any upstream command, launcher, detector, browser overlay, hook, or sub-agent workflow, verify that it is actually installed and available in the current environment. Never imply that a command ran just because its name appears here. If the official runtime is unavailable, use the manual workflow below and clearly report which automated checks could not run. In plain ChatGPT, these command names are vocabulary, not executable slash commands.

If an Impeccable launcher exists in the project, follow the upstream SKILL.md and referenced playbooks as installed; do not substitute this summary for those instructions. Official project: https://github.com/pbakaus/impeccable

## Twimzi product context

- Website: https://www.twimzi.com
- Web: Next.js, TypeScript, Tailwind CSS, Supabase.
- Android app: Flutter, Material 3, Riverpod, GoRouter.
- Product: mobile-first local-business discovery and business presence platform.
- Priority audiences: manufacturers; traders and wholesalers; professionals; home-service providers; local shops; restaurants.
- Product areas may include business profiles, products, services, search, favorites, reputation, follows, offers, posts, and community. Confirm the current implementation before assuming any feature exists or is complete.

## Non-negotiable workflow

1. **Inspect first.** Identify repository root, current branch and git diff, project instructions, framework/package versions, target route/screen, shared components, theme/tokens, assets, and relevant tests. Read the current implementation and neighboring screens before proposing changes. Never overwrite unrelated user work.
2. **Establish the truth.** Read existing PRODUCT.md, DESIGN.md, route/surface briefs, design-system documentation, and source tokens when present. A missing DESIGN.md does not mean the product has no visual identity; infer only from verified code/assets and document uncertainty.
3. **Choose the surface mode.** Use Impeccable's modes according to the surface, not the product overall:
   - **Persuade:** a landing/marketing page where visitors decide and act.
   - **Operate:** app UI, dashboard, admin, settings, and task flows where scanability, consistency, and native expectations lead.
   - **Read:** articles, help, and documentation.
   - **Experience:** a portfolio/gallery/showcase where the artifact itself leads.
4. **Separate refinement from redesign.** Refinement preserves incumbent visual identity, content, behavior, and everything outside scope. Redesign preserves product truth, content, function, constraints, and explicit brand commitments, but may replace the old visual world after a clear direction is chosen. Do not smuggle a redesign into a polish task.
5. **State the direction briefly.** For meaningful implementation, summarize evidence-based issues and the proposed direction before editing. Ask only when a missing decision materially changes the result. Do not ask for CSS values or generic aesthetic presets.
6. **Reuse and preserve.** Reuse existing components, hooks, models, utilities, themes, and data-access patterns. Preserve business logic, routes, API contracts, analytics, auth, Supabase server/client boundaries, and RLS/security policies. Never weaken security to solve a presentation issue.
7. **Implement the requested scope.** Make the smallest complete set of changes that fixes the cause, not just the visible symptom. No duplicate components or speculative features. Do not invent business facts, metrics, claims, reviews, addresses, or content.
8. **Verify the result.** Inspect rendered output at representative shipped sizes when browser/device tools are available. Batch related visual checks; fix what the review reveals and recheck. If rendering is unavailable, inspect source and available fixtures, run applicable checks, and clearly state visual verification was not performed.
9. **Report honestly.** Give exact changed paths, design decisions, commands actually run and their results, and known limitations. Never claim editing, testing, committing, pushing, or deployment unless confirmed.

## Official Impeccable command vocabulary

These are the upstream command names and intent. They are executable only when the real compatible Impeccable runtime is installed.

| Command | Use |
|---|---|
| `init` | Capture durable product truth in PRODUCT.md |
| `document` | Document the incumbent design system in DESIGN.md |
| `extract` | Identify reusable tokens and components |
| `shape` | Plan UX/UI before implementation |
| `critique` | Review UX hierarchy, clarity, and emotional fit |
| `audit` | Evaluate accessibility, performance, responsive behavior, and implementation integrity |
| `polish` | Refine an existing design without redesigning it |
| `bolder` | Make a safe/bland design more distinctive when appropriate |
| `quieter` | Reduce visual aggression or overstimulation |
| `distill` | Remove unnecessary complexity |
| `harden` | Handle errors, localization, overflow, and edge cases |
| `onboard` | Improve first-run, empty, and activation states |
| `animate` | Add purposeful motion |
| `colorize` | Introduce purposeful color |
| `typeset` | Improve typography and hierarchy |
| `layout` | Improve spacing, rhythm, and composition |
| `delight` | Add appropriate personality and memorable details |
| `overdrive` | Explore technically ambitious effects when the brief calls for them |
| `clarify` | Improve UX copy, labels, and errors |
| `adapt` | Adapt layouts for device sizes and contexts |
| `optimize` | Improve UI performance |
| `live` | Iterate through visual variants in a supported live browser environment |
| `generate` | Generate named-element variants in a supported live environment |
| `craft` | Deprecated alias for ordinary new-work; do not require it |

Command routing from upstream: if the user gives no command and asks what to do, present a context-aware choice rather than automatically running a command. If a command is explicit or clearly implied, follow its actual reference/playbook when available. For ordinary design work, inspect and proceed. If two command interpretations materially conflict, ask once.

Recommended manual sequence for a substantial redesign: inspect → choose mode and direction → implement → critique/audit → polish/harden → validate. For a narrow defect, inspect and fix the defect without forcing the full sequence.

## Design quality bar

Judge the built result, not the intention. Use the following as checks, not as a substitute for product judgment.

### Product specificity and hierarchy
- Make the primary task and next action obvious.
- Ground the composition and visual language in Twimzi's audience and use scene; avoid a generic template that could fit any SaaS or social product.
- Keep manufacturers, traders, wholesalers, professionals, local shops, and service providers first-class—not only consumer retail or restaurants.
- Preserve established Twimzi brand decisions unless the request authorizes a new direction.
- Prioritize useful content and information hierarchy over decorative chrome.

### Typography, layout, and color
- Inspect the existing typefaces, scale, weights, spacing tokens, and responsive behavior before changing them.
- Avoid defaulting to Inter/system sans, purple-to-blue gradients, identical icon-heading-text card grids, nested cards, decorative icon tiles, or a generic hero-metric template when the brief does not justify them. These are anti-patterns to question, not a reason to ignore a specific approved brief.
- Avoid gray secondary text on colored surfaces; choose a legible hue-aware color.
- For rendered web text, verify contrast of at least 4.5:1 for normal text and 3:1 for large text where WCAG criteria apply.
- Group related elements tightly and separate distinct groups generously. Use a consistent spacing rhythm and check computed values and optical alignment.
- Avoid arbitrary gradients, glass/blur, glows, decorative shadows, and animation. Use them only when they have a clear job and fit the approved visual world.
- Do not use emoji or arbitrary Unicode glyphs as substitutes for a consistent icon system. Reuse the project's existing icon library or authored SVGs.
- Test real copy at each supported breakpoint; handle long strings, localization expansion, zoom/text scaling, and overflow.
- Keep long-form reading measure comfortable (roughly 65–75 characters per line where appropriate); do not force this constraint on compact app controls.

### Accessibility and interaction
- Review keyboard navigation and visible focus on web; semantic labels, screen-reader names, contrast, color-independent meaning, reduced motion, and appropriate touch targets.
- Review default, hover, focus, pressed/active, selected, disabled, loading, error, empty, success, retry, and permission-denied states as applicable.
- Every control must perform its advertised action. Errors must identify the problem and recovery; controls must name their action.
- Use motion to communicate state or hierarchy, not to make the design look busy. Respect reduced-motion preferences.
- Do not introduce modal interruptions unless the task requires interruption or protected focus.

### Impeccable craft-floor checks

Immediately before UI edits, if the upstream runtime is installed, read its current `reference/craft-floor.md`. The official craft floor currently emphasizes:
- Contrast and hue-aware secondary text.
- Deliberate depth (offset plus soft blur, not a colored halo by default).
- Consistent spacing rhythm and heading spacing.
- Distinct typography scale, balanced headings, and overflow checks at every breakpoint.
- Purposeful, varied motion rather than the same entrance animation on every section.
- Complete states, real content, working controls, responsive composition, and keyboard focus.
- Theming browser surfaces such as selection, caret, scrollbars, focus rings, underline offset, and tabular numerals where appropriate.
- Product-specific copy, with labels naming actions and errors naming recovery.
- Coverage of every brief requirement.

Do not turn a heuristic into a blind universal rule if the approved visual brief or platform conventions provide a better, user-justified answer. Follow explicit upstream bans and the current installed reference when the actual runtime is present.

## Twimzi web-specific implementation checks

- Inspect the route, layout, shared UI primitives, design-system tokens, Tailwind setup, assets, metadata, and relevant loading/error boundaries before editing.
- Follow this repository's actual Next.js version and local Next.js documentation; do not assume APIs or file conventions from a different version.
- Preserve server/client component boundaries, Supabase authorization and RLS, session handling, cache behavior, API contracts, and existing routes.
- Make search, location/category context, business identity, and the next useful action discoverable on mobile.
- Business pages should prioritize the public-facing business identity, real products/services/offers/posts, and exact shop location where available. Do not expose private/administrative addresses unnecessarily. Verify coordinates and map destinations before changing location links.
- Forms should clearly mark required fields, use correct input types, validate inline, and preserve entered values where practical.
- Prevent layout shift; use correct image aspect ratios, responsive sources, and meaningful alt text.
- Review mobile, intermediate/tablet, and wide desktop layouts, plus keyboard/touch paths and loading/empty/error states.

## Twimzi Android / Flutter-specific implementation checks

- Inspect the actual screen, shared widgets, theme and Material 3 roles, Riverpod providers, GoRouter routes, asset/icon system, and current project instructions before editing.
- Follow Android and Material conventions; do not simply transplant web layouts or hover affordances into native UI.
- Adapt to window size classes, orientation, safe areas/insets, keyboard, split-screen, and foldable behavior where relevant. Restructure instead of merely stretching phone layouts onto tablets.
- Preserve providers, models, navigation, API behavior, auth, and business logic.
- Check text scaling, semantic labels, focus/navigation behavior, touch targets, loading/empty/error/permission states, and performance.
- Run `flutter analyze` and require **zero issues** before claiming the quality gate passes. Run relevant tests/builds if available; report any failure accurately.

## Validation and reporting

- Read project scripts before selecting commands. In the Twimzi website repo, the documented checks are `npm run lint` and `npm run build`; use the package manager and commands actually available.
- Run applicable lint, typecheck, unit/integration tests, and production build. Do not infer test coverage or success from a successful build alone.
- If the official Impeccable detector is installed, use the relevant current command (for example, `impeccable detect --json <target>`) and verify findings in context. A clean detector is evidence, not proof of quality.
- If browser/device capture is available, inspect rendered web viewports and relevant native device classes. Record which were captured, platform/browser/device, and what remains untested.
- Do not run detector commands, browser overlays, hooks, or agents just because this file names them. Verify the launcher/provider/tool first.
- End with: what changed, exact file paths, checks run with results, and remaining limitations. Do not claim deployment without deployment evidence.

## Example prompts

- “Use Impeccable UI Design — Twimzi to critique the homepage and inspect the current code first.”
- “Audit the business profile on mobile, then implement the highest-impact fixes.”
- “Polish this Flutter screen while preserving Material 3, Riverpod, and GoRouter.”
- “Distill the community feed and remove UI that does not improve discovery.”
- “Harden business registration validation, loading, and error states.”
