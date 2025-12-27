# Club Youniverse Live - Technical & Safety Specifications

This document outlines the core safety guardrails for AI generation and the technical export specifications for all media assets to ensure consistency and interoperability.

## 1. Safety & Rights Guardrails

This text should be included in the system prompt or safety settings for Gemini API calls to enforce content policies.

- Do not generate lyrics unless provided by the user.
- No doxxing or harassment during roast bits; keep it playful.
- No claims of ownership; always attribute to the uploader.
- Filter slurs, adult content, or personal attacks.

## 2. Export Specifications

These specifications ensure that all generated assets are compatible with each other and with external platforms.

### Audio

- **Format**: MP3
- **Bitrate**: 320kbps
- **Sample Rate**: 44.1kHz
- **Metadata**: Store waveform JSON (peaks) for visual previews.

### Snippets (for "The Box")

- **Duration**: 10 seconds
- **Loudness**: Normalized to -14 LUFS
- **Editing**: Pre-cut at hooks if detectable.

### Covers

- **Dimensions**: 3000×3000 pixels
- **Format**: PNG
- **Color Space**: RGB
- **Safe Margins**: 3% per side.

### Fold-out PDF

- **Format**: PDF
- **Layout**: A4 landscape spreads
- **Settings**: Embed fonts
- **Resolution**: 300 DPI

### Video

- **Resolutions**:
  - 1080×1920 (Vertical)
  - 1920×1080 (Horizontal)
- **Format**: MP4
- **Codec**: H.264
