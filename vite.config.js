import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ============================================================================
// GITHUB PAGES BASE PATH — PLACEHOLDER
// Replace REPLACE_WITH_REPO_NAME with your GitHub repository name.
// Example: repo "artemis-outpost" -> base: "/artemis-outpost/"
// (Keep the leading and trailing slashes. If you deploy to a user/org site
// named <user>.github.io, or a custom domain, use base: "/" instead.)
// ============================================================================
const REPO_BASE = "/astronaut-mission-trainer/";

export default defineConfig({
  base: astronaut-mission-trainer,
  plugins: [react()],
});
