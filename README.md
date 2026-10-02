# Bridge Crossing Puzzle Game

A kid-friendly, self-contained browser game for the classic bridge-and-flashlight puzzle.

## Play locally

Open `index.html` in a modern browser. No build step and no dependencies are required.

For best results, you can also serve the folder with a tiny local web server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish with GitHub Pages

1. Create a new GitHub repository, for example `bridge-crossing-puzzle`.
2. Upload `index.html`, `style.css`, `game.js`, and `README.md` to the repository root.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then save.
6. GitHub will provide the public Pages URL after deployment.

## Game behavior

- Select one or two travelers who are on the same side as the flashlight.
- Click **Send Across** or **Bring Back**.
- A crossing costs the time of the slower selected traveler.
- The fastest possible solution is **17 minutes**.
- The bridge shakes while characters cross and the app generates playful sound effects with the browser's Web Audio API.
- No external images, fonts, libraries, audio files, or network calls are required.

## Accessibility

The game uses native buttons, keyboard focus states, ARIA labels/live feedback, and respects `prefers-reduced-motion`.
