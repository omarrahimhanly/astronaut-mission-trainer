# Artemis & Mars Outpost Commander

A Vite + React + Tailwind CSS game. Icons come from `lucide-react`.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

1. Open `vite.config.js` and replace `REPLACE_WITH_REPO_NAME` with your repository name
   (e.g. `base: "/artemis-outpost/"`).
2. Push the project to the `main` branch of your GitHub repository.
3. In the repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
4. The included workflow (`.github/workflows/deploy.yml`) builds and publishes on every push to `main`.

Your site will be at `https://<your-username>.github.io/<repo-name>/`.

## Notes

- The app calls NASA's DONKI API with `DEMO_KEY`. If it is rate-limited or offline, the game
  falls back to an archived flare record and says so in the UI.
- Fonts (Space Grotesk, Inter, IBM Plex Mono) load from Google Fonts at runtime, with system fallbacks.
- All artwork is inline SVG/CSS, so there are no image files to host.
