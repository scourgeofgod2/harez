---
name: linear-design
description: Rebuilds harez.io UI in the Linear dark design system from DESIGN.md. Use when the user says "Linear tasarım", "design.md", "frontend'i baştan yaz", "arayüzü komple değiştir", or asks to restyle chat, login, or admin. Do not use for API, database, or auth logic changes.
---

# Linear Design

Source of truth: `references/design.md` in this skill folder. Read it before changing visual UI.

## Rules

- Dark only. Default `<html>` has class `dark`. Do not follow `prefers-color-scheme` and do not ship a light theme unless the user asks.
- Canvas `#010102`. Surfaces climb `#0f1011` → `#141516` → `#18191a` → `#191a1b`. Borders are hairlines `#23252a` / `#34343a` / `#3e3e44`. No drop shadows except a menu that must float.
- Lavender `#5e6ad2` is the only chromatic accent: brand mark, primary button, focus ring, selected state. Hover `#828fff`. Never fill cards or page sections with it.
- Text: `#f7f8f8` / muted `#8a8f98` / tertiary `#62666d`. Success `#27a644` only for status. Destructive stays red and rare.
- Type: Inter as the stand-in for Linear Display/Text (500–600). IBM Plex Mono for code. Display tracking is negative; 13px eyebrows use `+0.4px`.
- Radius: controls 8px, cards 12px, screenshot frames 16px, badges pill. Spacing is a 4px grid.
- Hierarchy comes from the surface ladder and hairlines, not color blocks, gradients, or large shadows.
- Keep product behavior. Restyle `app/globals.css`, `components/ui/*`, and the chat/auth/admin screens. Do not rewrite API routes.
