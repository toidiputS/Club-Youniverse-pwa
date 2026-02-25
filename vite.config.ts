import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "Club Youniverse Live",
        short_name: "Youniverse",
        description: "24/7 AI Radio Experience",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "https://ktfezfnkghtwbkmhxdyd.supabase.co/storage/v1/object/public/site_assets/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "https://ktfezfnkghtwbkmhxdyd.supabase.co/storage/v1/object/public/site_assets/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"]
      }
    })
  ],
});
