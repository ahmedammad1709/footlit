# Footlit launch film

The film is rendered from the real overlay engine (the same bundle the extension and the website run), one frame at a time, so it is exact and repeatable. Nothing is screen-recorded.

```
npm install                      # once (ffmpeg, puppeteer-core)
# one-off: headless browser used for frame capture
npx @puppeteer/browsers install chrome-headless-shell@stable --path .cache/chrome-headless-shell
# the extension must be built first (the film shows the real popup): from the repo root, npm run build
npm run vo                       # scratch voiceover (free neural voice) into assets/vo
npm run all                      # bundle, synthesise the score, render out/footlit-launch-1920x1080.mp4
npm run loudness                 # momentary loudness per 2 s window
```

- `npm run teaser` renders the 12 s vertical teaser (1080x1920, no voice, "coming soon") to `out/footlit-teaser-1080x1920.mp4`. Its timings are in `src/teaser-cues.json`; the shared synth is `scripts/synth.mjs`.
- `src/cues.json` holds every timing (cuts, clicks, shows). Picture and sound both read it.
- `src/vo.json` holds the script. To use a purchased voice, drop `assets/vo/<id>.wav` (mono, 48 kHz, silence trimmed) over the scratch files and run `npm run audio` then `npm run render`.
- `node scripts/make-vo.mjs --line=10` regenerates just the closing narration when Python and `edge-tts` are installed. Set `PYTHON` to an executable path if needed. The closing take was edited offline to remove the Edge mention while preserving the original voice; `scripts/update-browser-voice.mjs` retains the original WAV and reproduces that edit.
- `node scripts/render.mjs --preview=1.5,10,30` saves stills to `out/preview/` for quick checks.
- Stand-in pages (`src/gh.ts`) are generic code-host lookalikes with no logos or marks.

## Marketing film (landscape for LinkedIn, then vertical for Instagram)

A separate project from the launch film and the teaser; it overrides nothing. Script, timings and voice live in `src/marketing-vo.json` and `src/marketing-cues.json`; the picture is `src/marketing.ts`.

```
npm run marketing:vo      # voiceover with Kokoro (open Apache-2.0 voice, runs locally; needs .cache/tts-venv and .cache/kokoro, see scripts/tts_kokoro.py)
npm run marketing:audio   # score, effects, ducking, loudness (-14 LUFS), plus the .srt file
npm run marketing         # 1920x1080 @ 60 fps, BT.709, -> out/footlit-marketing-linkedin-1920x1080.mp4
```

- Subtitles are burned in (timed from the voice) and also exported as `out/footlit-marketing-linkedin.en.srt` for upload.
- To use another voice: change `voice` in `src/marketing-vo.json` (try `out/voice-auditions/*.wav`), or drop your own mono 48 kHz wavs into `assets/vo-marketing/` and re-run `marketing:audio` and `marketing`.

The portrait cut for Instagram Reels is `src/marketing-reel.ts` (same script, timing, voice and sound; only the layout changes, with captions kept inside Reels' safe zone):

```
node scripts/build.mjs
copy out/marketing-audio-mix.wav out/marketing-reel-audio-mix.wav     # same sound as the landscape cut
node scripts/render.mjs --film=marketing-reel --full --crf=13          # -> out/footlit-marketing-reel-1080x1920.mp4
```
