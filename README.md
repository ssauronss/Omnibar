# Omnibar

A fast, minimal Spotlight-like command palette for switching tabs, searching history, and web navigation. Built primarily for Orion Browser.

![Omnibar](omnibar.png)

## Features

- **Instant fuzzy search** across open tabs and browsing history
- **Prefix-cached search** for fast results as you type.
- **Three scopes** — Tabs, History, Web search
- **Keyboard-first** navigation
- **Zero startup cost** — uFuzzy lazy loads only when activated

## Installation

### Orion Browser

1. Open Orion's extensions at Orion -> Tools -> Manage Extensions
2. Load extension from disk
3. Select 'Omnibus' folder

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

| Scope | Description |
|-------|------|-------------|
| **Tabs** | Search and switch between open tabs |
| **History** | Search your browsing history |
| **Web** | Enter a URL or search Google |


## Tech

- Manifest V3
- [uFuzzy](https://github.com/leeoniya/uFuzzy) for fuzzy search
- No frameworks, no build step

## License

MIT
