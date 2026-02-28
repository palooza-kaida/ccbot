import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import preact from "@astrojs/preact";

export default defineConfig({
  site: "https://kaida-palooza.github.io",
  base: "/ccpoke/",
  integrations: [preact()],
  vite: {
    plugins: [tailwindcss()],
  },
});
