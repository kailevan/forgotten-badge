Build a complete, playable browser game called **FORGOTTEN BADGE**: a 2D top-down pixel-art stealth game in the style of *The Escapists*. It's for IFM's (Institut Français de la Mode, Paris) 40th anniversary, 1986–2026.

## Premise
It's IFM's 40th anniversary day. You're a student who has to present in **room 1.11 at 9:30**, and you've left your student badge at home. Sneak from Gare d'Austerlitz into IFM, through the security gates, up to the first floor and into room 1.11 without getting caught by security, teachers or cameras.

## Tech
- A single web app that runs in the browser on a laptop (keyboard) and on a phone (landscape, on-screen joystick plus buttons).
- HTML5 Canvas or Phaser 3. Internal resolution 480×270, scaled up with nearest-neighbour so the pixels stay crisp. 16×16 tiles.
- Draw all art procedurally in code (no external images). Use a consistent, muted, warm palette with 1px dark outlines on characters and props, and a 3/4 top-down view: walls show their top plus a front face.
- Keep the HUD as sharp HTML over the canvas: a suspicion meter, the current objective, an in-game clock (08:47 → 09:30), a "badge" chip, and the interaction prompt.

## The real place (keep this layout)
Use one orientation for every map: the Seine at the top (north), quai d'Austerlitz at the bottom, and the NW end on the left.

**Outside (level 1)**
- **Gare d'Austerlitz** at the far left, on the south side of the quai.
- **Pont Charles-de-Gaulle** comes in from the river and lands at a big junction. **Avenue Pierre-Mendès-France** branches south there, between the Le Monde building and the station.
- **Les Docks – Cité de la Mode et du Design**, a long building on the river side, with **IFM in its NW end**:
  - The roof is an oak deck with planting, and a green fritted-glass "Plug-Over" tube runs along the river side.
  - On the street side: green metal cladding above ground-floor glazing between raw concrete pillars, with **"entrée 34"** and **"Institut FRANÇAIS de la MODE"** lettered on the glass.
- **The street, from the building outward:** pavement with plane trees and black X barriers, a bus lane with the bus stop "Cité de la Mode et du Design" (lines 61 and 215), two traffic lanes, a two-way bike track, and the far pavement.
- **Across the street:** the curved dark-glass Caisse des Dépôts block, a wedge pointed at the junction.
- **Between the bridge and the Docks:** a paved riverside plaza with trees and a long ramp down to the cobbled riverbank. A red-and-white barge is moored by the bridge.
- **Under the Docks,** on the riverbank: an arcade of roller-shuttered club fronts and an IFM staff door.
- **The public passage at no. 34:** stairs going down from the street to the river.

**IFM lobby**
- Oak parquet floor and raw concrete columns.
- **Three stainless speed-gate lanes with glass wings** (one lane wider), with a blue badge reader on a post.
- A **white reception desk under a white sculptural staircase**, with the security guard behind it.
- Behind the gates, a corridor of programme posters with the tagline "Création. Management. Savoir-faire."

**Ground floor**
- A long "interior street" (the through-hall) with concrete columns down the middle.
- An amphitheatre with tiered seats at the NW end, and a glazed médiathèque.
- Black-steel-framed glazed workshops: knit, couture with mannequins, craft station, leather goods.
- An **oak grand staircase** going up through a skylit atrium.

**First floor**
- The grand staircase arrives in the atrium: oak balustrade, white high café tables, a row of black cantilever chairs, and glazed rooms 1.02 and 1.03.
- A corridor heads west, with concrete columns down its middle. Glazed classrooms on the river side (1.08, 1.09 couture studio, 1.10, **1.11**); a sewing atelier and rooms 1.12–1.14 on the quai side.
- **Room 1.11** is the NW corner room, with **glass on two sides, over the Seine**.

## Flow
1. **Title screen** designed as an IFM student card: "FORGOTTEN BADGE · 40 ans · 1986–2026", with a blank photo marked "?".
2. **Intro, ~10 seconds, skippable (Esc or a Skip button).** You walk out of Gare d'Austerlitz, cross at the bridge junction and walk along the river side to the Docks. Captions say "IFM turns 40 today" and "You present in room 1.11 at 9:30", then the player realises the badge is at home. The intro must never wait for a key press.
3. **Level 1 (outside and lobby).** Three ways in:
   - **Text your friend Léa** on an in-game phone. She comes out, follows you, and you must lead her somewhere nobody can see before she hands you a classmate's badge. If anyone watches the handoff, suspicion spikes.
   - **Blend into the crowd.** Bus 61 unloads students who head for the gates. Each gate opens briefly when a student badges through, so you can tailgate. Inside a crowd of 3+ students, suspicion barely rises.
   - **Secret route.** Go down to the riverbank and slip past a smoking staff member to the staff door.
4. **Level 2 (ground floor).** Get past the grey-haired teacher and a sweeping dome camera to the grand staircase.
5. **Level 3 (first floor).** Get past the second teacher to the door of 1.11.
6. **Win screen:** "You made it." Show your arrival time and how many times you were caught, plus "Happy 40th, IFM · 1986–2026".

## Stealth rules
- **One suspicion meter (0–100).** It rises while any watcher sees you. Running doubles it; standing near the gates without a badge quadruples it; being in a crowd cuts it to a fraction; holding a badge reduces it. It drains when nobody sees you.
- At 35 the watcher shows "?" and turns toward you. At 70 they show "!" and walk at you. At 100 you're caught: a "CAUGHT" stamp screen shows a funny line from whoever caught you, then you restart at a checkpoint.
- **Vision cones are drawn on the floor, colour-coded and outlined:** security blue, teachers yellow, cameras pink, staff green. They turn orange on "?" and red on "!". Line of sight is blocked by walls and trees, but **not by glass**. Guards also notice you within a short radius whichever way they face. Each watcher has a small icon over their head.
- **Hiding spots:** clothes racks and hedges. Standing still in one makes you invisible.
- **Roofs hide interiors:** you can't see inside a building until you walk in. The roof fades out when you enter.
- **Stairs and exits** get a bobbing arrow and a sign ("▲ 1ST FLOOR", "★ ROOM 1.11").

## Cast (archetypes, never real people)
- **Security guard:** dark uniform, short hair.
- **Madame:** an older teacher with grey hair clipped back and glasses. Slow, but she remembers your face: suspicion rises faster after she's seen you once.
- **Monsieur:** about 33, buzz cut, black long-sleeve turtleneck, high-waisted blue jeans. Fast and sharp-eyed, but he stops to check his phone at the end of his patrol (that's your window).
- **Léa:** your friend.
- **Students** with varied, fashionable outfits.

## Quality bar
This is for a fashion school, so it has to look designed, not generic. Make it clean and readable, with consistent pixel art, clear contrast between floor and walls, and no clutter. Make it fun in about 3–5 minutes.
