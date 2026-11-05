# FORGOTTEN BADGE — IFM 40

IFM turns 40 today. You forgot your student badge. Sneak from Gare d'Austerlitz into **room 1.11** before 9:30.

A 2D top-down stealth game (Escapists-style) in plain HTML/JS + Phaser 3. No build step.

## Run it

```
python3 _serve.py
```
then open **http://localhost:8040**. (Use `_serve.py`, not a plain server: it disables caching so every reload shows the latest code.)

## Floor plans (review)

Open **http://localhost:8040/plans.html**. It shows each floor as the game draws it.
- Drag to move, scroll to zoom.
- Toggle the roofs (outside view) and the guards with their cones and patrol routes.

## Sketch pad

Open **http://localhost:8040/sketch.html**. It's white paper and a pen, with one page each for Outside, Ground floor, 1st floor and Extra. Each page saves itself to `sketches/<page>.png`.

## Map editor (tile painter)

Open **http://localhost:8040/editor.html** while `_serve.py` is running.
- Paint walls, glass, doors, stairs, furniture and street pieces.
- Drop a photo or plan onto it to trace over.
- Place markers and notes.
- **Save** writes `maps/<level>.json`. **▶ Try it** opens the game with your drawn maps (`?map=custom`).

## Controls

| | Laptop | Phone (landscape) |
|---|---|---|
| Move | WASD / arrows | joystick (left) |
| Run | Shift | RUN |
| Act / talk / next | E · Space · Enter | A |
| Phone | P | phone button |
| Hide/show the "Ways in" panel | H | tap it |

## Ways in (level 1)

1. **Léa's badge.** Text Léa on your phone. She comes out, you lead her somewhere nobody can see, and she hands you Camille's badge.
2. **The crowd.** Bus 61 unloads students at "Cité de la Mode et du Design". Slip through an open gate in the middle of the crowd.
3. **The riverbank** (secret). Go down the ramp or the public passage at no. 34 and get past the smoker to the staff door.

## Project map

```
index.html            page shell + all HUD/menus (HTML over the canvas → sharp text)
css/                  base · hud · screens (title/caught/win) · touch controls
js/main.js            boots Phaser, title → game
js/config.js          ALL tuning numbers (speeds, suspicion rates, palette)
js/scenes/Level.js    the one game scene: stealth rules, gates, cones, zones
js/levels/            quai.js (outside + IFM ground floor, one map) · first.js (1st floor → 1.11)
js/systems/           map (ASCII → tilemap) · vision (line of sight) · input (keys + touch)
js/entities/actors.js player, NPCs, CCTV
js/art/               tiles.js (every material, painted in code) · characters.js (people, bus, props)
maps/                 maps saved by the editor (+ the reference image you traced)
editor.html           the map editor (js/editor/, css/editor.css)
docs/                 google-ai-studio-prompt.md
research/             RESEARCH.md + reference images (reference only — do not ship press photos)
```

## Test shortcuts

- `?level=first`: jump to the 1st floor
- `?level=quai&entry=lobby`: start inside the IFM lobby
- `&badge`: start holding a badge
- `?level=quai&entry=door`: start at entrée 34
- `&overview`: zoom out to see the whole map
- `&debug`: physics debug boxes
