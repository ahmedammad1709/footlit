# Footlit LinkedIn film

24 seconds, 1080×1350, 30 fps. A standalone film with new choreography, fresh product-engine footage and an original synthesized score. No narration; designed to be understood muted. The extension itself is silent.

## Rebuild from the repository root

```powershell
npm.cmd install --prefix video/linkedin-tools
node video/scripts/build.mjs
node video/scripts/render.mjs --film=linkedin-product --full --no-audio
node video/scripts/prepare-linkedin.mjs
node video/scripts/linkedin-cli.mjs check --samples 15
node video/scripts/linkedin-cli.mjs render --quality delivery --fps 30 --workers 2 --output ../footlit-linkedin.mp4
node video/scripts/finalize-linkedin.mjs
```

The render command uses the project's cached Chrome and FFmpeg and a locally installed FFprobe. `composition/index.html` contains the editable timeline. `composition/assets/product.mp4` is freshly captured from the real extension engine. Popup images use the real built popup with fictional browser state. Product source: `video/src/linkedin-product.ts`.

`brag-plan.md` explains the concept and asset provenance. `share-copy.txt` contains the posting caption. The final deliverable has a custom poster baked into its first frame, with the score and remaining timing preserved.

No website or extension runtime code is changed by this workflow. No publication is performed.
