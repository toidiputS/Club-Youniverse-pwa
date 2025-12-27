# Lyric Visualizer - Final Setup Steps

## ✅ Completed

- Created `ParticleBackground.tsx`
- Created `LyricStage.tsx`
- Created `LyricVisualizer.tsx`
- Added lyric types to `types.ts`

## 📝 Remaining Manual Steps

### 1. Update index.html

After line 9 (`<script src="https://cdn.tailwindcss.com"></script>`), add this Tailwind config:

```html
<script>
  tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          sans: ["Montserrat", "Inter", "sans-serif"],
          marker: ["Permanent Marker", "cursive"],
          tech: ["Orbitron", "sans-serif"],
        },
        animation: {
          "pulse-fast": "pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          float: "float 3s ease-in-out infinite",
          shake: "shake 0.5s cubic-bezier(.36,.07,.19,.97) both",
          "pop-in":
            "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
          "fade-out-up": "fadeOutUp 1.2s ease-out forwards",
          "glitch-snap": "glitchSnap 0.3s linear forwards",
          "scanline-wipe": "scanlineWipe 0.4s linear forwards",
        },
        keyframes: {
          float: {
            "0%, 100%": { transform: "translateY(0)" },
            "50%": { transform: "translateY(-10px)" },
          },
          shake: {
            "10%, 90%": { transform: "translate3d(-1px, 0, 0)" },
            "20%, 80%": { transform: "translate3d(2px, 0, 0)" },
            "30%, 50%, 70%": { transform: "translate3d(-4px, 0, 0)" },
            "40%, 60%": { transform: "translate3d(4px, 0, 0)" },
          },
          popIn: {
            "0%": { opacity: "0", transform: "scale(0.5)" },
            "70%": { opacity: "1", transform: "scale(1.1)" },
            "100%": { opacity: "1", transform: "scale(1)" },
          },
          fadeOutUp: {
            "0%": {
              opacity: "0.6",
              transform: "translateY(0) scale(0.9)",
              filter: "blur(0px)",
            },
            "100%": {
              opacity: "0",
              transform: "translateY(-50px) scale(0.6)",
              filter: "blur(8px)",
            },
          },
          glitchSnap: {
            "0%": { transform: "translateX(0) skew(0)" },
            "20%": { transform: "translateX(-10px) skew(20deg)" },
            "40%": { transform: "translateX(10px) skew(-20deg)" },
            "60%": { transform: "translateX(-5px) skew(5deg)" },
            "100%": { transform: "translateX(0) skew(0)" },
          },
          scanlineWipe: {
            "0%": { top: "-20%", opacity: "0" },
            "10%": { opacity: "1" },
            "100%": { top: "120%", opacity: "0" },
          },
        },
      },
    },
  };
</script>
```

Replace line 13 (Google Fonts) with:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inter:wght@400;500;600&family=Montserrat:wght@400;500;600;700;800;900&family=Permanent+Marker&family=Orbitron:wght@400;500;600;700;800;900&display=swap"
  rel="stylesheet"
/>
```

### 2. Add to .env.local

```
VITE_GEMINI_API_KEY=your_api_key_here
```

### 3. Update types.ts

Add to `ImportMetaEnv` interface (around line 10):

```typescript
readonly VITE_GEMINI_API_KEY: string;
```

That's it! The visualizer components are ready to use. See `lyric_visualizer_guide.md` for integration examples.
