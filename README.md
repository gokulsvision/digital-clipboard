# Indoor Tactics Board

A dead-simple tactics whiteboard for our 6-a-side indoor football team. Place
**X**'s (us) and **O**'s (them) on a clean pitch, give someone the ball, and
draw solid run arrows and dashed pass arrows (passes curve). Save boards by
name and reopen them later. No accounts, no backend — everything stays in the
browser.

## Run it

```sh
npm install
npm run dev
```

Open http://localhost:5173. For a phone on the same Wi-Fi, use the network
URL Vite prints (e.g. `http://192.168.x.x:5173`).

## Tools

Gamer layout, LoL muscle memory: **A** to move, **QWER** for the core actions,
**D/F** summoners, **B** to recall (save).

| Key | Tool | Does |
|---|---|---|
| `A` | Move | drag any X, O, or arrow |
| `Q` | Us | place an X at the cursor (stays active for more) |
| `W` | Them | place an O at the cursor |
| `E` | Ball | give the ball to the player under the cursor |
| `D` | Pass | drag to draw a dashed, curved pass — hold `Shift` to flip the bow |
| `R` | Run | drag to draw a solid run arrow |
| `F` | Erase | hover over anything to wipe it (tap on touch) |

Arrows are editable: drag the body to move them, grab an end handle to extend
or re-angle, grab the middle handle to bend them into sharp cuts. Extras:
`⌘Z`/`Ctrl+Z` undo, `Delete` removes the selection, `Esc` clears it, `B` saves
the board. The board autosaves to this browser; named copies reopen from
**Saved boards**. Dark/light toggle in the top bar.

## Stack

Vite + React + TypeScript, pitch and markings in SVG, state in
`localStorage` (`tactical-board-v4`). No backend.
