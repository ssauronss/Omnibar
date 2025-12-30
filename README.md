# Omnibar

A fast, minimal Spotlight-like command palette for switching tabs, searching history, and web navigation.

![Omnibar](images/omnibar-icon.png)

## Features

- **Instant fuzzy search** across open tabs and browsing history
- **Prefix-cached search** for lightning-fast results as you type
- **Three scopes** — Tabs, History, Web search
- **Keyboard-first** navigation
- **Zero startup cost** — lazy loads only when activated

## Installation

### Orion Browser

1. Open Orion Settings → Advanced
2. Enable "Allow unsigned extensions" under Chrome Extensions
3. Navigate to `chrome://extensions`
4. Enable "Developer mode"
5. Click "Load unpacked" and select this folder

### Chrome / Edge / Brave

1. Navigate to `chrome://extensions` (or equivalent)
2. Enable "Developer mode"
3. Click "Load unpacked" and select this folder

## Usage

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Open Omnibar |
| `Tab` | Cycle scopes (Tabs → History → Web) |
| `Shift+Tab` | Cycle scopes backwards |
| `↑` / `↓` | Navigate results |
| `Enter` | Select result |
| `Escape` | Close |

## Scopes

| Scope | Icon | Description |
|-------|------|-------------|
| **Tabs** | 🪟 | Search and switch between open tabs |
| **History** | 🕐 | Search your browsing history |
| **Web** | 🌐 | Enter a URL or search Google |

## Performance

- **50ms debounced input** — responsive without wasted cycles
- **Prefix cache** — incremental searches reuse previous results
- **Lazy uFuzzy loading** — search library loads only on first use
- **CSS containment** — optimized rendering performance
- **DocumentFragment batching** — minimal DOM operations

## Tech

- Manifest V3
- [uFuzzy](https://github.com/leeoniya/uFuzzy) for fuzzy search
- No frameworks, no build step

## License

MIT
