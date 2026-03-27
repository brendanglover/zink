---
name: zink-conventions
description: Use when building, editing, or reviewing anything in the Zink. project. Defines the full design system, tool structure, brand rules, and workflow conventions.
---

# Zink. Project Conventions

## Brand & Design System
- Brand name: Zink. — always written with a full stop. Never "Zink" without the period.
- Accent colour: #6366f1 (indigo)
- Theme: Dark-first with light mode toggle
- Tagline: "The tools you actually use, nothing you don't."
- Tone: Clean, minimal, direct. No emoji in copy.

## Current Tools (shipped)
1. Title Capitaliser
2. Amazon Listing Builder
3. Word Counter
4. Keyword Density Analyser

## Rules
- Always explain a change before making it
- Never change the colour scheme or remove the light mode toggle without approval
- Never add dependencies or npm packages
- Do not add tools without a full spec discussion first
- Brand name always includes the full stop — find/replace if ever missing
- Three separate Git commands always: git add . then git commit then git push
- Commit messages: lowercase, descriptive, no emoji

## Stack
- Vanilla HTML/CSS/JS only, no frameworks, no build steps
- Google Analytics installed - never remove the GA script tag
- Hosted on Cloudflare Pages - push to main to deploy
- Each tool is a standalone HTML page
