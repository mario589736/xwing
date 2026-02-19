# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sternenspiel** is a browser-based space adventure game for children (Anton & Valentin). It uses German for all UI text and is a pure HTML5/Canvas application with no build tools or dependencies.

## Running the Project

No build step needed — open `index.html` directly in a browser. An internet connection is required for MediaPipe hand-tracking libraries (loaded via CDN).

## Architecture

The entire game lives in 4 files: `index.html`, `game.js`, `style.css`, `favicon.svg`.

All game logic is in a single global `Game` object in `game.js` (~2,400 lines). There are no modules, no bundler, no framework.

### Three Game Modes

Each mode has its own init, update, and draw methods:

| Mode | German Name | Description |
|------|-------------|-------------|
| `xwing` | Sternjäger Fliegen | Fly a ship, collect crystals, fight the Schattenmond boss |
| `force` | Sternenkraft-Training | Use hand gestures to lift rocks; final mission: lift ship from swamp |
| `saber` | Energieklinge | Swing a lightsaber to hit training drones |

### Game Loop & State

- `gameLoop()` runs on `requestAnimationFrame`, calling `update()` then `draw()`
- `Game.mode` holds the active mode: `'xwing'`, `'force'`, or `'saber'`
- `Game.controlMode` is either `'camera'` (MediaPipe hand tracking) or `'touch'`
- Mission progression is tracked via `Game.xwing.mission`, `Game.force.mission`, `Game.saber.mission` (levels 1–3)

### Input

- **Touch/click**: `setupTouchControls()` — sets position on pointer events
- **Camera**: `setupCamera()` — initializes MediaPipe, streams webcam to a `<video>` element, triggers `handleForceGesture()` / equivalent per mode

### Rendering

Canvas is full-screen and rescaled in `resize()`. Each mode has its own draw method; `drawXWingMode()`, `drawForceMode()`, `drawSaberMode()` handle all mode-specific visuals.

### Mission Progression Flow

After completing a mission, `checkMissionProgress()` is called (in xwing and saber modes). The force mode uses similar logic inline. Missions increment from 1 → 2 → 3, then trigger a `victorySequence()` after level 3.

### Cache Busting

Static assets use `?v=N` version params in `index.html` script/link tags — increment manually when deploying changes.
