# Slash Commander

[![Obsidian community plugin](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json&query=%24%5B%22slash-commander%22%5D.downloads&logo=obsidian&label=downloads)](https://obsidian.md/plugins?id=slash-commander) [![GitHub all releases](https://img.shields.io/github/downloads/alephpiece/obsidian-slash-commander/total?logo=GitHub)](https://github.com/alephpiece/obsidian-slash-commander/releases) ![GitHub Repo stars](https://custom-icon-badges.demolab.com/github/stars/alephpiece/obsidian-slash-commander?logo=star)

Customizable slash command list for [Obsidian](https://obsidian.md).

## Features

- [x] Customizable slash command trigger (defaults to `/`)
	- [x] Additional triggers
   - [x] Per-command trigger modes
- [x] Customizable slash command list
	- [x] Drag-and-drop command setting items
 	- [ ] Command groups
- [x] Triggering slash commands only at the beginning of a line

## How to install

### Community plugins

1. Open Obsidian settings and scroll to "Community plugins".
2. Turn off the restricted mode.
3. Browse community plugins, search `Slash Commander` and install it.
4. Enable this plugin.

### Using BRAT

1. Install this plugin using BRAT.
   - Go to "Community plugins" and install "Obsidian42 - BRAT". 
   - Add https://github.com/alephpiece/obsidian-slash-commander to BRAT.
2. Enable this plugin.

## How to use

### Simple usage

![slash-commander-usage](https://github.com/alephpiece/obsidian-slash-commander/assets/22237751/bf30296d-0588-48f0-852f-ef1deaf46e27)

### Add a new slash command

![slash-commander-add](https://github.com/alephpiece/obsidian-slash-commander/assets/22237751/95750d82-1846-4a29-af13-9e450cca4a65)

### Define your own trigger(s)

![slash-commander-triggers](https://github.com/alephpiece/obsidian-slash-commander/assets/22237751/94f63b78-bf79-45f2-b84b-9bcdb5fe393e)

### Triggering on new line

![slash-commander-newline](https://github.com/alephpiece/obsidian-slash-commander/assets/22237751/1343483e-d889-496d-a05f-dd80bcad1797)

### Show descriptions

![slash-commander-description](https://github.com/alephpiece/obsidian-slash-commander/assets/22237751/9b1f3cf9-f04b-4d0b-96ac-b8520edb09e4)

## Development

```shell
# install deps
yarn

# dev
yarn dev

# build
yarn build
```

## Credits

- Idea & logic: [Better Slash Commands](https://github.com/SPiCaRiA/obsidian-better-slash-commands)
- UI design & data structures: based on [Commander](https://github.com/phibr0/obsidian-commander)
- Standalone menu suggest:
  - idea: [FelipeRearden](https://github.com/FelipeRearden)
  - suggester: [Periodic Notes](https://github.com/liamcain/obsidian-periodic-notes) and [Admonitions](https://github.com/javalent/admonitions)
  - positioning: [Highlightr](https://github.com/chetachiezikeuzor/Highlightr-Plugin) and [Typing Assistant](https://github.com/Jambo2018/notion-assistant-plugin)
