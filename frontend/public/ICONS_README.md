# PWA Icons

This directory should contain the following icon files for the Progressive Web App:

- `icon-192x192.png` - 192x192 pixel icon (required)
- `icon-512x512.png` - 512x512 pixel icon (required)

## Generating Icons

You can generate these icons using:

1. **PWA Asset Generator** (recommended):
   ```bash
   npx @vite-pwa/assets-generator --preset minimal public/icon-source.png
   ```

2. **Online Tools**:
   - [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
   - [RealFaviconGenerator](https://realfavicongenerator.net/)

3. **Manual Creation**:
   - Create a square image (at least 512x512)
   - Export as PNG
   - Resize to 192x192 and 512x512
   - Place in `frontend/public/`

## Icon Requirements

- **Format**: PNG
- **Sizes**: 192x192 and 512x512 pixels
- **Purpose**: Should be "any maskable" (works on all backgrounds)
- **Design**: Simple, recognizable icon representing "Civic View"

## Placeholder Icons

If icons are missing, the PWA will still work but may not pass all Lighthouse PWA checks. The manifest.json references these files, so they must exist for the PWA to be installable.


