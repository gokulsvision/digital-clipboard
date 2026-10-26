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

| Tool | Does | Key |
|---|---|---|
| Move | drag any X, O, or arrow | `V` |
| Us | click to place an X at the cursor | `X` |
| Them | click to place an O at the cursor | `O` |
| Ball | click a player to give them the ball | `B` |
| Pass | drag to draw a dashed, curved pass arrow — hold `Shift` to flip which way it bows | `P` |
| Run | drag to draw a solid run arrow | `R` |
| Erase | hover over anything to wipe it (tap on touch) | `E` |

Extras: `⌘Z`/`Ctrl+Z` undo, `Delete` removes the selected item, `Esc` clears
the selection. The board autosaves to this browser; use **Save** to keep named
copies you can reopen from **Saved boards**. There is a dark/light theme
toggle in the top bar.

## Stack

Vite + React + TypeScript, pitch and markings in SVG, state in
`localStorage` (`tactical-board-v4`). No backend.
