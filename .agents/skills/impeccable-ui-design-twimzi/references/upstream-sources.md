# Upstream Impeccable references used

Reviewed the official repository and its current skill/playbook content when adapting this Twimzi skill.

- README / installation / command list: https://github.com/pbakaus/impeccable/blob/main/README.md
- Current universal/Codex-style skill: https://github.com/pbakaus/impeccable/blob/main/.agents/skills/impeccable/SKILL.md
- Source skill: https://github.com/pbakaus/impeccable/blob/main/skill/SKILL.src.md
- Craft floor (read immediately before UI edits when using upstream runtime): https://github.com/pbakaus/impeccable/blob/main/skill/reference/craft-floor.md
- New visual work / design direction: https://github.com/pbakaus/impeccable/blob/main/skill/reference/new-work.md
- Audit: https://github.com/pbakaus/impeccable/blob/main/skill/reference/audit.md
- Critique: https://github.com/pbakaus/impeccable/blob/main/skill/reference/critique.md
- Polish: https://github.com/pbakaus/impeccable/blob/main/skill/reference/polish.md
- Native adaptation: https://github.com/pbakaus/impeccable/blob/main/skill/reference/adapt.native.md

## Adaptation notes

- Preserves the official command vocabulary and high-level routing without claiming the commands execute in plain ChatGPT.
- Adds Twimzi's web/mobile stack, audience, security and feature-preservation requirements.
- Applies native Android guidance to Flutter/Material 3 work, while acknowledging that upstream native references are platform-oriented and not a substitute for inspecting the actual Flutter app.
- Treats design anti-patterns as defaults to challenge rather than universally banned choices, except where the official upstream playbook explicitly defines a ban.
